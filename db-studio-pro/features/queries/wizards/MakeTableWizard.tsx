import React, { useState } from 'react';
import { Table, Query, Field } from '../../../types/index';
import { X, TableProperties, CheckCircle2, AlertCircle, ArrowRight, Key } from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface MakeTableWizardProps {
  tables: Table[];
  queries: Query[];
  onClose: () => void;
}

export const MakeTableWizard: React.FC<MakeTableWizardProps> = ({ tables, queries, onClose }) => {
  const store = useProjectStore();
  const ui = useUIStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [newTableName, setNewTableName] = useState('TabellenExport_' + new Date().toISOString().slice(0,10).replace(/-/g, ''));
  const [sourceType, setSourceType] = useState<'table' | 'query'>('table');
  const [sourceId, setSourceId] = useState('');
  
  // Selected field IDs to copy
  const [selectedFieldNames, setSelectedFieldNames] = useState<string[]>([]);
  const [primaryKeyFieldName, setPrimaryKeyFieldName] = useState<string>('');

  const selectedSourceTable = sourceType === 'table' ? tables.find(t => t.id === sourceId) : null;
  const selectedSourceQuery = sourceType === 'query' ? queries.find(q => q.id === sourceId) : null;

  // Available fields from source
  const availableFields: { id: string; name: string; type: string }[] = React.useMemo(() => {
    if (selectedSourceTable) {
      return selectedSourceTable.fields.map(f => ({ id: f.id, name: f.name, type: f.type }));
    }
    if (selectedSourceQuery && 'columns' in selectedSourceQuery) {
      return selectedSourceQuery.columns.map(c => ({ id: c.id, name: c.alias || c.fieldName, type: 'VARCHAR' }));
    }
    return [];
  }, [selectedSourceTable, selectedSourceQuery]);

  React.useEffect(() => {
    if (availableFields.length > 0) {
      const names = availableFields.map(f => f.name);
      setSelectedFieldNames(names);
      setPrimaryKeyFieldName(names[0] || '');
    }
  }, [sourceId, sourceType]);

  const toggleFieldSelection = (fieldName: string) => {
    if (selectedFieldNames.includes(fieldName)) {
      setSelectedFieldNames(selectedFieldNames.filter(n => n !== fieldName));
    } else {
      setSelectedFieldNames([...selectedFieldNames, fieldName]);
    }
  };

  const handleExecute = () => {
    if (!newTableName.trim()) return;

    let sourceRows: Record<string, any>[] = [];
    if (selectedSourceTable) {
      sourceRows = selectedSourceTable.data || [];
    } else if (selectedSourceQuery) {
      // Execute query logic if applicable
      sourceRows = [];
    }

    // Build new fields list
    const newFields: Field[] = availableFields
      .filter(f => selectedFieldNames.includes(f.name))
      .map(f => ({
        id: crypto.randomUUID(),
        name: f.name,
        type: (f.type || 'VARCHAR') as any,
        isPrimaryKey: f.name === primaryKeyFieldName,
        isAutoIncrement: f.name === primaryKeyFieldName && (f.type === 'INTEGER' || f.name.toLowerCase() === 'id')
      }));

    if (newFields.length === 0) {
      alert('Bitte wählen Sie mindestens ein Feld aus.');
      return;
    }

    // Filter source row data to only selected fields
    const newTableData = sourceRows.map(row => {
      const cleanRow: Record<string, any> = {};
      newFields.forEach(field => {
        cleanRow[field.name] = row[field.name] !== undefined ? row[field.name] : '';
      });
      return cleanRow;
    });

    const newTable: Table = {
      id: crypto.randomUUID(),
      name: newTableName.trim(),
      description: `Generiert durch Tabellenerstellungsabfrage aus ${sourceType === 'table' ? selectedSourceTable?.name : selectedSourceQuery?.name}`,
      fields: newFields,
      data: newTableData
    };

    store.addTable(newTable);
    ui.addToast(`Neue Tabelle "${newTable.name}" mit ${newTableData.length} Datensätzen erstellt.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-slate-300 flex flex-col h-[620px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-teal-700 to-teal-600 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TableProperties className="text-teal-200"/> Tabellenerstellungsabfrage Assistent
            </h2>
            <p className="text-teal-100 text-sm mt-1">Erstellt eine neue eigenständige Tabelle aus bestehenden Daten.</p>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Name der neuen Tabelle</label>
                <input 
                  type="text"
                  className="w-full border border-slate-300 rounded p-2.5 text-sm font-semibold focus:ring-2 focus:ring-teal-500 outline-none"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  placeholder="Z.B. Kunden_2026_Archiv"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Datenquelle Typ</label>
                  <select 
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    value={sourceType}
                    onChange={e => { setSourceType(e.target.value as any); setSourceId(''); }}
                  >
                    <option value="table">Tabelle</option>
                    <option value="query">Abfrage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Quellobjekt wählen</label>
                  <select 
                    className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    value={sourceId}
                    onChange={e => setSourceId(e.target.value)}
                  >
                    <option value="">Bitte wählen...</option>
                    {sourceType === 'table' ? (
                      tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.data?.length || 0} Zeilen)</option>)
                    ) : (
                      queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-teal-600 shrink-0 mt-0.5" size={20}/>
                <p className="text-sm text-teal-900 leading-relaxed">
                  <strong>Funktionsweise:</strong> Eine Tabellenerstellungsabfrage liest alle Datensätze der Quelldatei aus und speichert sie als eigenständige, dauerhafte Tabelle im System ab.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Spaltenauswahl & Primärschlüssel</h3>
                <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">
                  {selectedFieldNames.length} von {availableFields.length} Spalten gewählt
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="p-3 text-center w-12 border-r">Inkl.</th>
                      <th className="p-3 text-left border-r">Spaltenname</th>
                      <th className="p-3 text-left border-r">Datentyp</th>
                      <th className="p-3 text-center w-32">Primärschlüssel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableFields.map(field => {
                      const isSelected = selectedFieldNames.includes(field.name);
                      const isPK = primaryKeyFieldName === field.name;

                      return (
                        <tr key={field.id} className={isSelected ? 'bg-teal-50/20' : 'bg-slate-50/50 opacity-60'}>
                          <td className="p-3 text-center border-r border-slate-100">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleFieldSelection(field.name)}
                              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 border-r border-slate-100 font-semibold text-slate-800">
                            {field.name}
                          </td>
                          <td className="p-3 border-r border-slate-100 text-xs text-slate-500">
                            <span className="border px-1.5 py-0.5 rounded bg-slate-50 font-mono">{field.type}</span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setPrimaryKeyFieldName(isPK ? '' : field.name)}
                              className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 mx-auto transition-colors ${isPK ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                              <Key size={12}/> {isPK ? 'PK gesetzt' : 'Setzen'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex justify-between shrink-0">
          {step === 2 ? (
            <button onClick={() => setStep(1)} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
              Zurück
            </button>
          ) : (
            <button onClick={onClose} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded font-medium border border-slate-300">
              Abbrechen
            </button>
          )}

          {step === 1 && (
            <button 
              onClick={() => setStep(2)}
              disabled={!newTableName.trim() || !sourceId}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter <ArrowRight size={18}/>
            </button>
          )}

          {step === 2 && (
            <button 
              onClick={handleExecute}
              disabled={selectedFieldNames.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={18}/> Tabelle Erstellen & Ausführen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
