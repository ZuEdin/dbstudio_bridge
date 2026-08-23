import React, { useState } from 'react';
import { X, ArrowRight, Code, Copy, Check, Sparkles, RefreshCw } from 'lucide-react';

export function convertAccessSqlToStandard(accessSql: string): string {
  if (!accessSql) return '';
  let converted = accessSql;

  // 1. Convert IIF(cond, trueVal, falseVal) to CASE WHEN cond THEN trueVal ELSE falseVal END
  // Simple regex conversion for single-level IIF
  converted = converted.replace(/IIF\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'CASE WHEN $1 THEN $2 ELSE $3 END');

  // 2. Convert Nz(field, altValue) to COALESCE(field, altValue)
  converted = converted.replace(/Nz\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'COALESCE($1, $2)');
  converted = converted.replace(/Nz\s*\(\s*([^)]+)\s*\)/gi, "COALESCE($1, '')");

  // 3. Convert FormatCurrency(val) to TO_CHAR(val, 'FM999,990.00€') or FORMAT(val, 'C')
  converted = converted.replace(/FormatCurrency\s*\(\s*([^)]+)\s*\)/gi, "FORMAT($1, 'C', 'de-DE')");

  // 4. Convert Format(val, formatStr)
  converted = converted.replace(/Format\s*\(\s*([^,]+)\s*,\s*"([^"]+)"\s*\)/gi, "TO_CHAR($1, '$2')");

  // 5. Convert String concatenation & to ||
  converted = converted.replace(/(\w+|\'[^\']*\')\s*&\s*(\w+|\'[^\']*\')/g, '$1 || $2');

  // 6. Convert CStr(val) to CAST(val AS VARCHAR)
  converted = converted.replace(/CStr\s*\(\s*([^)]+)\s*\)/gi, 'CAST($1 AS VARCHAR)');

  // 7. Convert Val(val) to CAST(val AS NUMERIC)
  converted = converted.replace(/Val\s*\(\s*([^)]+)\s*\)/gi, 'CAST($1 AS NUMERIC)');

  // 8. Convert True/False literals
  converted = converted.replace(/\bYes\b/gi, 'TRUE');
  converted = converted.replace(/\bNo\b/gi, 'FALSE');

  return converted;
}

interface AccessSqlConverterModalProps {
  onClose: () => void;
  onApplySql?: (sql: string) => void;
}

export const AccessSqlConverterModal: React.FC<AccessSqlConverterModalProps> = ({ onClose, onApplySql }) => {
  const [accessSql, setAccessSql] = useState<string>(
    'SELECT KundeID, IIF(Umsatz > 1000, "Premium", "Standard") AS KundenStatus, Nz(Telefon, "Keine Nummer") AS Tel, Vorname & " " & Nachname AS Vollname FROM Kunden WHERE Aktiv = Yes;'
  );
  const [standardSql, setStandardSql] = useState<string>(() => convertAccessSqlToStandard(accessSql));
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setStandardSql(convertAccessSqlToStandard(accessSql));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(standardSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500 text-white rounded font-bold">
              <Code size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-400 flex items-center gap-1.5">
                <Sparkles size={14} /> SQL Dialekt Konverter
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Wandelt spezielle Funktionen (IIF, Nz, Format, &amp;) automatisch in Standard ANSI SQL / PostgreSQL um</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Input Access SQL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Quell SQL Dialekt:</span>
                <span className="text-[10px] text-red-600 font-mono bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Klassisch</span>
              </label>
              <textarea
                value={accessSql}
                onChange={e => {
                  setAccessSql(e.target.value);
                  setStandardSql(convertAccessSqlToStandard(e.target.value));
                }}
                rows={8}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="Geben Sie hier Ihre SQL Abfrage ein..."
              />
            </div>

            {/* Output Standard SQL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Konvertiertes Standard SQL:</span>
                <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Standard / PostgreSQL</span>
              </label>
              <textarea
                readOnly
                value={standardSql}
                rows={8}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg bg-slate-900 text-emerald-400 focus:outline-none shadow-inner"
              />
            </div>

          </div>

          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800 space-y-1">
            <span className="font-bold">Unterstützte Access-Funktionen:</span>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 text-amber-900">
              <li><code className="font-mono font-bold">IIF(A, B, C)</code> &rarr; <code className="font-mono">CASE WHEN A THEN B ELSE C END</code></li>
              <li><code className="font-mono font-bold">Nz(field, alt)</code> &rarr; <code className="font-mono">COALESCE(field, alt)</code></li>
              <li><code className="font-mono font-bold">FormatCurrency(x)</code> &rarr; <code className="font-mono">FORMAT(x, 'C')</code></li>
              <li><code className="font-mono font-bold">str1 &amp; str2</code> &rarr; <code className="font-mono">str1 || str2</code></li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleConvert}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-300 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Neu Konvertieren
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copied ? 'Kopiert!' : 'SQL Kopieren'}
            </button>

            {onApplySql && (
              <button
                onClick={() => {
                  onApplySql(standardSql);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-xs flex items-center gap-1.5 transition-colors"
              >
                In Abfrage Übernehmen <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
