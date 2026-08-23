
import React, { useState, useEffect } from 'react';
import { Relationship, Table, Field, ReferentialAction } from '../../../types/index';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';

interface EditRelationshipModalProps {
  relationship: Relationship;
  tables: Table[];
  onSave: (relationship: Relationship) => void;
  onClose: () => void;
}

export const EditRelationshipModal: React.FC<EditRelationshipModalProps> = ({
  relationship,
  tables,
  onSave,
  onClose,
}) => {
  const [fromTableId, setFromTableId] = useState(relationship.fromTableId);
  const [fromFieldId, setFromFieldId] = useState(relationship.fromFieldId);
  const [toTableId, setToTableId] = useState(relationship.toTableId);
  const [toFieldId, setToFieldId] = useState(relationship.toFieldId);
  const [integrity, setIntegrity] = useState(relationship.referentialIntegrity ?? true);
  
  // Cascade Options
  const [onDelete, setOnDelete] = useState<ReferentialAction>(relationship.onDelete || 'NO ACTION');
  const [onUpdate, setOnUpdate] = useState<ReferentialAction>(relationship.onUpdate || 'NO ACTION');

  const fromTable = tables.find(t => t.id === fromTableId);
  const toTable = tables.find(t => t.id === toTableId);

  const fromField = fromTable?.fields.find(f => f.id === fromFieldId);
  const toField = toTable?.fields.find(f => f.id === toFieldId);
  const relationshipType = fromField?.isPrimaryKey && toField?.isPrimaryKey ? '1:1' : '1:n';

  // VALIDATION: Types must match
  const typesMatch = fromField && toField ? fromField.type === toField.type : true;

  const handleSave = () => {
    onSave({
      ...relationship,
      fromTableId,
      fromFieldId,
      toTableId,
      toFieldId,
      type: relationshipType,
      referentialIntegrity: integrity,
      onDelete,
      onUpdate
    });
  };

  const actionOptions: ReferentialAction[] = ['NO ACTION', 'CASCADE', 'SET NULL', 'RESTRICT'];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-300">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Beziehung bearbeiten</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Linke Tabelle (Parent / 1)</label>
              <select
                value={fromTableId}
                onChange={e => {
                  setFromTableId(e.target.value);
                  setFromFieldId(tables.find(t => t.id === e.target.value)?.fields[0]?.id || '');
                }}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-700 mt-4 mb-1">Verknüpftes Feld (PK)</label>
              <select
                value={fromFieldId}
                onChange={e => setFromFieldId(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {fromTable?.fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rechte Tabelle (Child / n)</label>
              <select
                value={toTableId}
                onChange={e => {
                  setToTableId(e.target.value);
                  setToFieldId(tables.find(t => t.id === e.target.value)?.fields[0]?.id || '');
                }}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <label className="block text-sm font-semibold text-slate-700 mt-4 mb-1">Verknüpftes Feld (FK)</label>
              <select
                value={toFieldId}
                onChange={e => setToFieldId(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 text-sm"
              >
                {toTable?.fields.map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
              </select>
            </div>
          </div>
          
          {!typesMatch && (
             <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded text-xs flex items-start gap-2">
                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                 <div>
                     <strong>Warnung: Typ-Konflikt</strong><br/>
                     Feld '{fromField?.name}' ist <strong>{fromField?.type}</strong>.<br/>
                     Feld '{toField?.name}' ist <strong>{toField?.type}</strong>.<br/>
                     Für SQL-Abfragen ist das okay, aber das .NET Backend wird diese Beziehung im Entity Framework ignorieren, um Abstürze zu vermeiden.
                 </div>
             </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-4">
             <div className="flex justify-between items-center">
                 <div className="text-sm text-slate-500">
                    Beziehungstyp: <span className="font-semibold text-slate-700">{relationshipType}</span>
                 </div>
                 <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                          type="checkbox"
                          checked={integrity}
                          onChange={e => setIntegrity(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Referentielle Integrität erzwingen
                  </label>
             </div>

             {integrity && (
                 <div className="bg-slate-50 p-4 rounded border border-slate-200 grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                             <ShieldAlert size={12}/> Löschweitergabe
                         </label>
                         <select 
                            value={onDelete} 
                            onChange={e => setOnDelete(e.target.value as ReferentialAction)}
                            className="w-full border border-slate-300 rounded p-1.5 text-sm"
                         >
                             {actionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                             <ShieldAlert size={12}/> Aktualisierungsweitergabe
                         </label>
                         <select 
                            value={onUpdate} 
                            onChange={e => setOnUpdate(e.target.value as ReferentialAction)}
                            className="w-full border border-slate-300 rounded p-1.5 text-sm"
                         >
                             {actionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                         </select>
                     </div>
                 </div>
             )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">
            Abbrechen
          </button>
          <button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
