/**
 * Advanced Form Formula & Expression Engine
 * Supports:
 * - Basic Arithmetic: [Preis] * [Menge], [Gesamt] - [Rabatt]
 * - Date Math: DATEDIFF([Startdatum], [Enddatum]), DATEADD([Datum], 14, 'days'), NOW(), TODAY()
 * - Age Functions: AGE([Geburtsdatum]), ALTER([Geburtsdatum])
 * - String Operations: CONCAT([Vorname], ' ', [Nachname]), UPPER([Text]), LOWER([Text]), SUBSTRING([Text], 0, 5), TRIM([Text])
 * - Logical Conditions: IF([Status] == 'Storniert', 0, [Betrag]), IIF([Menge] > 10, [Preis] * 0.9, [Preis])
 * - Math Helpers: ROUND([Wert], 2), ABS([Wert]), MIN([A], [B]), MAX([A], [B]), CEIL([Wert]), FLOOR([Wert])
 * - Subtable Aggregations: SUM([Positionen.Gesamtpreis]), AVG([Positionen.Einzelpreis]), COUNT([Positionen.Id]), MIN([Positionen.Preis]), MAX([Positionen.Preis])
 */

export function calculateDetailedAge(birthdateInput: string | Date): string {
  if (!birthdateInput) return '';
  let birthDate: Date;
  
  if (birthdateInput instanceof Date) {
    birthDate = birthdateInput;
  } else {
    const str = String(birthdateInput).trim().replace(/^["']|["']$/g, '');
    if (!str || str === '0') return '';
    
    // German date format DD.MM.YYYY
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
      const [d, m, y] = str.split('.').map(Number);
      birthDate = new Date(y, m - 1, d);
    } else {
      birthDate = new Date(str);
    }
  }

  if (isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) return 'Datum in der Zukunft';

  const parts = [];
  if (years === 1) parts.push('1 Jahr');
  else if (years > 1) parts.push(`${years} Jahre`);

  if (months === 1) parts.push('1 Monat');
  else if (months > 1) parts.push(`${months} Monate`);

  if (days === 1) parts.push('1 Tag');
  else parts.push(`${days} Tage`);

  return parts.length > 0 ? parts.join(', ') : '0 Tage';
}

function parseDateVal(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const str = String(val).trim().replace(/^["']|["']$/g, '');
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
    const [d, m, y] = str.split('.').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function evaluateFormFormula(
  formula: string,
  record: Record<string, any>,
  fieldMap?: Record<string, string>,
  subtablesContext?: Record<string, Record<string, any>[]> // e.g. { 'Positionen': [{...}, {...}] }
): any {
  if (!formula || typeof formula !== 'string' || formula.trim() === '') {
    return '';
  }

  try {
    let expr = formula.trim();

    // 0. Handle Subtable Aggregations: SUM([Positionen.Gesamtpreis]), COUNT([Positionen.Id]), AVG(...), MIN(...), MAX(...)
    if (subtablesContext) {
      expr = expr.replace(/(SUM|AVG|COUNT|MIN|MAX)\s*\(\s*\[([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\]\s*\)/gi, (_, funcName, subtableName, fieldKey) => {
        const rows = subtablesContext[subtableName] || subtablesContext[subtableName.toLowerCase()] || [];
        const fn = funcName.toUpperCase();
        if (rows.length === 0) return fn === 'COUNT' ? '0' : '0.00';

        const values = rows.map(r => {
          const val = r[fieldKey] !== undefined ? r[fieldKey] : r[fieldKey.toLowerCase()];
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        });

        if (fn === 'COUNT') return String(rows.length);
        if (fn === 'SUM') {
          const sum = values.reduce((a, b) => a + b, 0);
          return String(Number(sum.toFixed(2)));
        }
        if (fn === 'AVG') {
          const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
          return String(Number(avg.toFixed(2)));
        }
        if (fn === 'MIN') {
          return String(Math.min(...values));
        }
        if (fn === 'MAX') {
          return String(Math.max(...values));
        }
        return '0';
      });
    }

    // 1. Date Math Functions: DATEDIFF([Start], [End], 'days'|'months'|'years'), DATEADD([Date], 7, 'days')
    expr = expr.replace(/DATEDIFF\s*\(\s*\[([^\]]+)\]\s*,\s*\[([^\]]+)\](?:\s*,\s*['"]([a-zA-Z]+)['"])?\s*\)/gi, (_, fieldA, fieldB, unit = 'days') => {
      const valA = record[fieldMap?.[fieldA] || fieldA];
      const valB = record[fieldMap?.[fieldB] || fieldB];
      const dA = parseDateVal(valA);
      const dB = parseDateVal(valB);
      if (!dA || !dB) return '0';
      const diffMs = dB.getTime() - dA.getTime();
      const u = unit.toLowerCase();
      if (u === 'months') return String(Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4375)));
      if (u === 'years') return String(Math.round(diffMs / (1000 * 60 * 60 * 24 * 365.25)));
      return String(Math.round(diffMs / (1000 * 60 * 60 * 24))); // days
    });

    expr = expr.replace(/DATEADD\s*\(\s*\[([^\]]+)\]\s*,\s*(-?\d+)(?:\s*,\s*['"]([a-zA-Z]+)['"])?\s*\)/gi, (_, fieldKey, amountStr, unit = 'days') => {
      const val = record[fieldMap?.[fieldKey] || fieldKey];
      const d = parseDateVal(val);
      if (!d) return '""';
      const amount = parseInt(amountStr, 10);
      const targetDate = new Date(d);
      const u = unit.toLowerCase();
      if (u === 'months') targetDate.setMonth(targetDate.getMonth() + amount);
      else if (u === 'years') targetDate.setFullYear(targetDate.getFullYear() + amount);
      else targetDate.setDate(targetDate.getDate() + amount);
      return JSON.stringify(targetDate.toISOString().split('T')[0]);
    });

    // 2. Age functions
    const ageMatch = expr.match(/^(?:AGE|ALTER|ALTER_JMD)\s*\(\s*\[([^\]]+)\]\s*\)$/i);
    if (ageMatch) {
      const fieldKey = ageMatch[1];
      const actualFieldName = fieldMap && fieldMap[fieldKey] ? fieldMap[fieldKey] : fieldKey;
      let val = record[actualFieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === actualFieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }
      return calculateDetailedAge(val);
    }

    // 3. String functions: CONCAT, UPPER, LOWER, TRIM, SUBSTRING
    expr = expr.replace(/CONCAT\s*\(([^)]+)\)/gi, (_, argsStr) => {
      const splitArgs = argsStr.split(',').map((a: string) => evaluateFormFormula(a.trim(), record, fieldMap));
      return JSON.stringify(splitArgs.join(''));
    });

    expr = expr.replace(/UPPER\s*\(\s*\[([^\]]+)\]\s*\)/gi, (_, fieldKey) => {
      const val = record[fieldMap?.[fieldKey] || fieldKey] || '';
      return JSON.stringify(String(val).toUpperCase());
    });

    expr = expr.replace(/LOWER\s*\(\s*\[([^\]]+)\]\s*\)/gi, (_, fieldKey) => {
      const val = record[fieldMap?.[fieldKey] || fieldKey] || '';
      return JSON.stringify(String(val).toLowerCase());
    });

    expr = expr.replace(/TRIM\s*\(\s*\[([^\]]+)\]\s*\)/gi, (_, fieldKey) => {
      const val = record[fieldMap?.[fieldKey] || fieldKey] || '';
      return JSON.stringify(String(val).trim());
    });

    // 4. Logical Conditions: IF(cond, trueVal, falseVal) or IIF(cond, trueVal, falseVal)
    expr = expr.replace(/(?:IF|IIF)\s*\(([^,]+),([^,]+),([^)]+)\)/gi, (_, condStr, trueVal, falseVal) => {
      try {
        const resolvedCond = evaluateFormFormula(condStr.trim(), record, fieldMap);
        const isTruthy = Boolean(resolvedCond && resolvedCond !== '0' && resolvedCond !== 'false');
        return isTruthy ? trueVal.trim() : falseVal.trim();
      } catch {
        return falseVal.trim();
      }
    });

    // 5. Replace [FieldName] or [field_id] placeholders with record values
    expr = expr.replace(/\[([^\]]+)\]/g, (_, nameOrId) => {
      const fieldName = fieldMap && fieldMap[nameOrId] ? fieldMap[nameOrId] : nameOrId;
      let val = record[fieldName];

      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === fieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }

      if (val === undefined || val === null || val === '') {
        return '0';
      }

      if (typeof val === 'number') {
        return String(val);
      } else if (typeof val === 'boolean') {
        return val ? '1' : '0';
      } else if (!isNaN(Number(val)) && String(val).trim() !== '') {
        return String(Number(val));
      } else {
        return JSON.stringify(String(val));
      }
    });

    // 6. Handle AGE/ALTER literal replacement
    expr = expr.replace(/(?:AGE|ALTER|ALTER_JMD)\s*\(([^)]+)\)/gi, (_, innerVal) => {
      const calculatedAge = calculateDetailedAge(innerVal);
      return JSON.stringify(calculatedAge);
    });

    // 7. Handle string concatenation like "Max" + ' ' + "Mustermann"
    if (expr.includes('+') && (expr.includes('"') || expr.includes("'"))) {
      const parts = expr.split('+').map(p => {
        const trimmed = p.trim();
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1);
        }
        return trimmed;
      });
      return parts.join('');
    }

    // 8. Math functions: ROUND, ABS, MIN, MAX, CEIL, FLOOR
    expr = expr.replace(/ROUND\(([^,]+),\s*(\d+)\)/gi, (_, innerExpr, decimals) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Number(num || 0).toFixed(parseInt(decimals, 10)));
    });

    expr = expr.replace(/ABS\(([^)]+)\)/gi, (_, innerExpr) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Math.abs(Number(num || 0)));
    });

    expr = expr.replace(/CEIL(?:ING)?\(([^)]+)\)/gi, (_, innerExpr) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Math.ceil(Number(num || 0)));
    });

    expr = expr.replace(/FLOOR\(([^)]+)\)/gi, (_, innerExpr) => {
      const num = evaluateFormFormula(innerExpr, record, fieldMap);
      return String(Math.floor(Number(num || 0)));
    });

    // 9. Safe Math Evaluation
    const safeExpr = expr.replace(/[^0-9.\-/*+()% <>=!&|?:]/g, '');
    if (!safeExpr) return '';

    const fn = new Function(`"use strict"; return (${safeExpr});`);
    const result = fn();

    if (typeof result === 'number' && !isNaN(result)) {
      return Number.isInteger(result) ? result : Number(result.toFixed(2));
    }
    return result ?? '';
  } catch (err) {
    return '';
  }
}
