export function calculateDetailedAge(birthdateInput: string | Date): string {
  if (!birthdateInput) return '';
  let birthDate: Date;
  if (birthdateInput instanceof Date) birthDate = birthdateInput;
  else {
    const str = String(birthdateInput).trim().replace(/^["']|["']$/g, '');
    if (!str || str === '0') return '';
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(str)) {
      const [d, m, y] = str.split('.').map(Number);
      birthDate = new Date(y, m - 1, d);
    } else birthDate = new Date(str);
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
  if (months < 0) { years -= 1; months += 12; }
  if (years < 0) return 'Datum in der Zukunft';
  const parts = [];
  if (years === 1) parts.push('1 Jahr'); else if (years > 1) parts.push(`${years} Jahre`);
  if (months === 1) parts.push('1 Monat'); else if (months > 1) parts.push(`${months} Monate`);
  if (days === 1) parts.push('1 Tag'); else parts.push(`${days} Tage`);
  return parts.length > 0 ? parts.join(', ') : '0 Tage';
}

export function evaluateFormFormula(formula: string, record: Record<string, any>, fieldMap?: Record<string, string>): any {
  if (!formula || typeof formula !== 'string') return '';
  try {
    let expr = formula.trim();
    const ageMatch = expr.match(/^(?:AGE|ALTER|ALTER_JMD|DATEDIFF)\s*\(\s*\[([^\]]+)\]\s*\)$/i);
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
    expr = expr.replace(/\[([^\]]+)\]/g, (_, nameOrId) => {
      const fieldName = fieldMap && fieldMap[nameOrId] ? fieldMap[nameOrId] : nameOrId;
      let val = record[fieldName];
      if (val === undefined) {
        const lowerKey = Object.keys(record).find(k => k.toLowerCase() === fieldName.toLowerCase());
        if (lowerKey) val = record[lowerKey];
      }
      if (val === undefined || val === null || val === '') return '0';
      return typeof val === 'number' ? String(val) : JSON.stringify(String(val));
    });
    expr = expr.replace(/(?:AGE|ALTER|ALTER_JMD)\s*\(([^)]+)\)/gi, (_, innerVal) => JSON.stringify(calculateDetailedAge(innerVal)));
    const safeExpr = expr.replace(/[^0-9.\-/*+()% ]/g, '');
    if (!safeExpr) return '';
    const fn = new Function('"use strict"; return (' + safeExpr + ');');
    const res = fn();
    return typeof res === 'number' && !isNaN(res) ? (Number.isInteger(res) ? res : Number(res.toFixed(2))) : res ?? '';
  } catch {
    return '';
  }
}
