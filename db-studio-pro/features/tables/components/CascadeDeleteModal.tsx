import React, { useMemo, useState } from 'react';
import { ShieldAlert, Trash2, X, AlertTriangle, Layers, ChevronRight, ShieldCheck, CornerDownRight } from 'lucide-react';
import { Table, Relationship } from '../../../types/index';

interface CascadeDeleteModalProps {
  parentTable: Table;
  recordToDelete: Record<string, any>;
  allTables: Table[];
  relationships: Relationship[];
  onConfirmDelete: (mode: 'cascade' | 'set_null' | 'restrict') => void;
  onClose: () => void;
}

export const CascadeDeleteModal: React.FC<CascadeDeleteModalProps> = ({
  parentTable,
  recordToDelete,
  allTables,
  relationships,
  onConfirmDelete,
  onClose
}) => {
  const [selectedMode, setSelectedMode] = useState<'cascade' | 'set_null' | 'restrict'>('cascade');

  // Primary key or display title for record
  const pkField = parentTable.fields.find(f => f.isPrimaryKey) || parentTable.fields[0];
  const recordLabel = pkField ? `${pkField.name}: ${recordToDelete[pkField.name] ?? '(Kein Wert)'}` : 'Datensatz';

  // Find linked dependent tables
  const dependentDetails = useMemo(() => {
    const rels = relationships.filter(r => r.fromTableId === parentTable.id);
    return rels.map(rel => {
      const parentField = parentTable.fields.find(f => f.id === rel.fromFieldId);
      const childTable = allTables.find(t => t.id === rel.toTableId);
      const childField = childTable?.fields.find(f => f.id === rel.toFieldId);
      const parentVal = parentField ? recordToDelete[parentField.name] : null;

      let count = 0;
      let matchingRows: Record<string, any>[] = [];
      if (childTable && childField && parentVal !== undefined && parentVal !== null) {
        matchingRows = (childTable.data || []).filter(cRow => String(cRow[childField.name]) === String(parentVal));
        count = matchingRows.length;
      }

      return {
        rel,
        childTable,
        childField,
        parentField,
        parentVal,
        count,
        matchingRows
      };
    }).filter(d => d.childTable !== undefined);
  }, [parentTable, recordToDelete, allTables, relationships]);

  const totalDependentCount = dependentDetails.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-25">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600/30 rounded-lg border border-rose-500/40">
              <ShieldAlert className="text-rose-400" size={22} />
            </div>
            <div>
              <h2 className="font-bold text-base text-rose-100">Erweitertes Löschen & Referenzielle Integrität</h2>
              <p className="text-xs text-rose-300">Prüfung von Fremdschlüsseln & Löschweitergaben (Cascade)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-rose-900 text-rose-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50">
          
          {/* Target Record Info */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 block">Zu löschender Hauptdatensatz:</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                Tabelle "{parentTable.name}" &bull; <span className="text-indigo-600">{recordLabel}</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {Object.keys(recordToDelete).length} Spaltenwerte
            </div>
          </div>

          {/* Relationships Dependent List */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Layers size={14} className="text-indigo-600" /> Verknüpfte Tabellen & Abhängige Datensätze:
            </h3>

            {dependentDetails.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <strong>Keine Fremdschlüssel-Abhängigkeiten definiert.</strong>
                  <p className="text-emerald-700 mt-0.5">Für diese Tabelle sind keine aktivierten Beziehungen vorhanden.</p>
                </div>
              </div>
            ) : totalDependentCount === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <strong>Sicher löschbar!</strong>
                  <p className="text-emerald-700 mt-0.5">Es wurden keine abhängigen Datensätze in den verknüpften Tabellen gefunden.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Achtung: Referenzielle Integrität betroffen!</strong>
                    <p className="mt-0.5 text-amber-800">
                      Dieser Datensatz besitzt insgesamt <strong>{totalDependentCount}</strong> verknüpfte Datensätze in anderen Tabellen. Wählen Sie unten, wie verfahren werden soll.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
                  {dependentDetails.map((dep, idx) => (
                    <div key={idx} className="p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CornerDownRight size={14} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800">{dep.childTable?.name}</span>
                          <span className="text-slate-400 ml-2">
                            (Fremdschlüssel: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">{dep.childField?.name}</code>)
                          </span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        dep.count > 0 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {dep.count} Datensatz/Datensätze
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Strategy Option Selection */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Aktion bei referenzieller Integrität:</h3>

            <label className={`block bg-white p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'cascade' ? 'border-rose-500 bg-rose-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteMode"
                  value="cascade"
                  checked={selectedMode === 'cascade'}
                  onChange={() => setSelectedMode('cascade')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <Trash2 size={14} className="text-rose-600" /> Kaskadierend löschen (CASCADE DELETE)
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Löscht den Hauptdatensatz in "{parentTable.name}" sowie automatisch alle {totalDependentCount} verknüpften Datensätze in den abhängigen Tabellen.
                  </p>
                </div>
              </div>
            </label>

            <label className={`block bg-white p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'set_null' ? 'border-amber-500 bg-amber-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteMode"
                  value="set_null"
                  checked={selectedMode === 'set_null'}
                  onChange={() => setSelectedMode('set_null')}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <X size={14} className="text-amber-600" /> Fremdschlüssel leeren (SET NULL)
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Setzt das Fremdschlüsselfeld in den abhängigen Datensätzen auf LEER/NULL und löscht nur diesen Hauptdatensatz.
                  </p>
                </div>
              </div>
            </label>

            <label className={`block bg-white p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMode === 'restrict' ? 'border-indigo-500 bg-indigo-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="deleteMode"
                  value="restrict"
                  checked={selectedMode === 'restrict'}
                  onChange={() => setSelectedMode('restrict')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-indigo-600" /> Löschen sperren bei Abhängigkeit (RESTRICT)
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Bricht den Löschvorgang ab, falls abhängige Datensätze in verknüpften Tabellen existieren.
                  </p>
                </div>
              </div>
            </label>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(selectedMode)}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md flex items-center gap-2 transition-colors"
          >
            <Trash2 size={14} /> Löschen ausführen
          </button>
        </div>

      </div>
    </div>
  );
};
