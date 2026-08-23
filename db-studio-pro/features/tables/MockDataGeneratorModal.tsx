import React, { useState } from 'react';
import { Table, FieldType } from '../../types/index';
import { X, Database, Code, Copy, Check, Download } from 'lucide-react';
import { faker } from '@faker-js/faker';

interface MockDataGeneratorModalProps {
  table: Table;
  onClose: () => void;
}

export const MockDataGeneratorModal: React.FC<MockDataGeneratorModalProps> = ({ table, onClose }) => {
  const [rowCount, setRowCount] = useState<number>(50);
  const [format, setFormat] = useState<'sql' | 'json'>('sql');
  const [generatedData, setGeneratedData] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const generateMockValue = (field: any): any => {
    const type = field.type;
    const name = field.name;
    const len = field.length || 2;
    const n = name.toLowerCase();
    
    // Simple heuristics
    if (n.includes('email')) return faker.internet.email();
    if (n.includes('first') && n.includes('name')) return faker.person.firstName();
    if (n.includes('last') && n.includes('name')) return faker.person.lastName();
    if (n.includes('name')) return faker.person.fullName();
    if (n.includes('phone')) return faker.phone.number();
    if (n.includes('address') || n.includes('street')) return faker.location.streetAddress();
    if (n.includes('city')) return faker.location.city();
    if (n.includes('country')) {
        if (type === 'CHAR') {
            const codes = ['AT', 'DE', 'CH', 'US', 'GB', 'FR', 'ES', 'IT', 'NL', 'BE'];
            const code = codes[Math.floor(Math.random() * codes.length)];
            return code.substring(0, len).padEnd(len, 'X');
        }
        return faker.location.country();
    }
    if (n.includes('zip') || n.includes('postal')) return faker.location.zipCode();
    if (n.includes('company')) return faker.company.name();
    if (n.includes('date') || type === 'DATE' || type === 'DATETIME' || type === 'TIMESTAMP') {
        const date = faker.date.recent();
        return type === 'DATE' ? date.toISOString().split('T')[0] : date.toISOString().replace('T', ' ').substring(0, 19);
    }
    
    // Markdown / Rich-Text field generator
    if (field.rendererType === 'markdown' || n.includes('markdown') || n.includes('beschreibung') || n.includes('notiz') || n.includes('dokumentation') || n.includes('inhalt') || n.includes('content') || n.includes('details') || (type === 'TEXT' && !n.includes('name') && !n.includes('mail'))) {
        const mdTemplates = [
            `### ${faker.commerce.productName()}\n\n${faker.lorem.paragraph()}\n\n- **Status:** Aktiv\n- **Priorität:** Hoch\n- [x] Überprüfung abgeschlossen\n- [ ] Freigabe ausstehend`,
            `## Übersicht & Spezifikation\n\n> ${faker.company.catchPhrase()}\n\n| Eigenschaft | Wert |\n|---|---|\n| Kategorie | Standard |\n| Version | 1.2.0 |\n| Bewertung | ⭐⭐⭐⭐⭐ |\n\n*Wichtiger Hinweis:* ${faker.lorem.sentence()}`,
            `#### Vorgangsdetails\n\n${faker.lorem.sentence()}\n\n1. Schritt 1: Initialisierung und Vorprüfung\n2. Schritt 2: Durchführung der Aufgaben\n3. Schritt 3: Endabnahme\n\n\`\`\`json\n{\n  "status": "success",\n  "verified": true\n}\n\`\`\``
        ];
        return mdTemplates[Math.floor(Math.random() * mdTemplates.length)];
    }

    switch (type) {
      case 'INTEGER':
      case 'TINYINT':
        return faker.number.int({ min: 1, max: 1000 });
      case 'DECIMAL':
      case 'DOUBLE':
        return faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
      case 'BOOLEAN':
        return faker.datatype.boolean();
      case 'VARCHAR':
      case 'CHAR':
      case 'TEXT':
        if (type === 'CHAR') {
            return faker.string?.alpha ? faker.string.alpha({ length: len, casing: 'upper' }) : 'XY'.substring(0, len).padEnd(len, 'X');
        }
        return faker.lorem.words({ min: 1, max: 3 });
      default:
        return faker.lorem.word();
    }
  };

  const handleGenerate = () => {
    const fields = table.fields.filter(f => !f.isAutoIncrement); // skip auto increment for inserts
    const data: any[] = [];
    
    for (let i = 0; i < rowCount; i++) {
        const row: any = {};
        fields.forEach(f => {
            row[f.name] = generateMockValue(f);
        });
        data.push(row);
    }

    if (format === 'json') {
        setGeneratedData(JSON.stringify(data, null, 2));
    } else {
        // SQL
        const inserts = data.map(row => {
            const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
            const values = Object.values(row).map(v => {
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                if (typeof v === 'boolean') return v ? '1' : '0';
                if (v === null || v === undefined) return 'NULL';
                return v;
            }).join(', ');
            return `INSERT INTO \`${table.name}\` (${keys}) VALUES (${values});`;
        });
        setGeneratedData(inserts.join('\n'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}_mock_data.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Mock-Data Generator</h2>
              <p className="text-sm text-slate-500">Generiere realistische Testdaten für <span className="font-semibold">"{table.name}"</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto bg-slate-50/50 flex flex-col gap-6">
            <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Anzahl der Datensätze</label>
                    <input 
                        type="number" 
                        min="1" max="1000"
                        value={rowCount}
                        onChange={e => setRowCount(parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Export-Format</label>
                    <select 
                        value={format}
                        onChange={(e: any) => setFormat(e.target.value)}
                        className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                    >
                        <option value="sql">SQL (INSERT INTO)</option>
                        <option value="json">JSON-Array</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={handleGenerate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors h-[38px]"
                    >
                        <Code size={16} /> Generieren
                    </button>
                </div>
            </div>

            {generatedData && (
                <div className="flex flex-col flex-1 min-h-[300px]">
                    <div className="flex justify-between items-center bg-slate-800 text-slate-200 px-4 py-2 rounded-t-lg">
                        <span className="text-xs font-mono">{table.name}_mock.{format}</span>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="hover:text-white p-1 rounded transition-colors">
                                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                            <button onClick={handleDownload} className="hover:text-white p-1 rounded transition-colors">
                                <Download size={14} />
                            </button>
                        </div>
                    </div>
                    <textarea 
                        readOnly 
                        value={generatedData}
                        className="w-full flex-1 bg-slate-900 text-slate-300 font-mono text-sm p-4 rounded-b-lg outline-none resize-none"
                    />
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
