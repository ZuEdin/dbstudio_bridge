
import React, { useState, useRef } from 'react';
import { Table, Field, FieldType } from '../../types/index';
import { X, Upload, ArrowRight, Check, Database, AlertTriangle } from 'lucide-react';
import { inferFieldType } from '../../utils/apiImportHelper';

interface AccessImportWizardProps {
  onSave: (table: Table) => void;
  onClose: () => void;
}

export const AccessImportWizard: React.FC<AccessImportWizardProps> = ({ onSave, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [foundTables, setFoundTables] = useState<Table[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            // Check parser errors
            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                throw new Error("Ungültiges XML Format.");
            }

            const root = xmlDoc.documentElement;
            // Access XML usually has structure: <dataroot><TableName>...fields...</TableName></dataroot>
            
            const tablesMap = new Map<string, any[]>();

            // Iterate children
            for (let i = 0; i < root.children.length; i++) {
                const node = root.children[i];
                if (node.nodeType !== 1) continue; // Skip non-elements
                
                const tableName = node.tagName;
                if (!tablesMap.has(tableName)) {
                    tablesMap.set(tableName, []);
                }
                
                // Parse Row Data
                const rowData: any = {};
                for (let j = 0; j < node.children.length; j++) {
                    const fieldNode = node.children[j];
                    const fieldName = fieldNode.tagName;
                    const val = fieldNode.textContent;
                    rowData[fieldName] = val;
                }
                tablesMap.get(tableName)?.push(rowData);
            }

            // Convert to DB Studio Pro Tables
            const parsedTables: Table[] = [];
            tablesMap.forEach((rows, tableName) => {
                if (rows.length === 0) return;

                // Infer Schema from first row (or scan multiple if needed)
                const sampleRow = rows[0];
                const fields: Field[] = Object.keys(sampleRow).map(key => ({
                    id: crypto.randomUUID(),
                    name: key,
                    type: inferFieldType(sampleRow[key]),
                    isPrimaryKey: key.toLowerCase() === 'id' || key.toLowerCase().endsWith('id'),
                    allowNull: true
                }));

                // If no ID found, add artificial one (optional, but good practice)
                if (!fields.some(f => f.name.toLowerCase() === 'id')) {
                    fields.unshift({ 
                        id: crypto.randomUUID(), 
                        name: 'ID', 
                        type: 'INTEGER', 
                        isPrimaryKey: true, 
                        isAutoIncrement: true 
                    });
                    rows.forEach((r, idx) => r['ID'] = idx + 1);
                }

                parsedTables.push({
                    id: crypto.randomUUID(),
                    name: tableName,
                    fields: fields,
                    data: rows
                });
            });

            setFoundTables(parsedTables);
            setStep(2);

        } catch (err) {
            alert("Fehler beim Lesen der Datei: " + err);
        } finally {
            setLoading(false);
        }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
      foundTables.forEach(t => onSave(t));
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-slate-300 flex flex-col h-[500px] overflow-hidden">
        
        <div className="flex justify-between items-center p-5 bg-red-800 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Database className="text-red-200"/> Access Import (XML)
            </h2>
            <p className="text-red-100 text-sm mt-1">Importieren Sie Struktur und Daten aus MS Access.</p>
          </div>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
            {step === 1 && (
                <div className="flex flex-col items-center justify-center h-full gap-6">
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center max-w-md">
                        <p className="text-slate-600 mb-4 text-sm">
                            Exportieren Sie Ihre Tabellen in Access über <strong>Externe Daten &rarr; XML-Datei</strong> (Haken bei "Daten" und "Schema").
                        </p>
                        <input 
                            type="file" 
                            accept=".xml" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={(e) => e.target.files && processFile(e.target.files[0])}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="bg-red-700 hover:bg-red-800 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 mx-auto"
                        >
                            {loading ? 'Analysiere XML...' : <><Upload size={18}/> XML Datei wählen</>}
                        </button>
                    </div>
                    <div className="flex gap-2 text-xs text-slate-400">
                        <AlertTriangle size={14}/>
                        <span>.accdb Direk-Import erfordert Backend-Komponenten. XML funktioniert im Browser.</span>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Check className="text-green-600"/> {foundTables.length} Tabellen gefunden
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {foundTables.map(t => (
                            <div key={t.id} className="bg-white p-3 rounded border border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Database size={16} className="text-slate-400"/>
                                    <span className="font-bold text-slate-700">{t.name}</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {t.fields.length} Spalten, {t.data?.length} Zeilen
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
            {step === 2 ? (
                <button onClick={() => setStep(1)} className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50">Zurück</button>
            ) : ( <div></div> )}

            {step === 2 && (
                <button onClick={handleImport} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2">
                    Importieren <ArrowRight size={18}/>
                </button>
            )}
        </div>

      </div>
    </div>
  );
};
