import React, { useState } from 'react';
import { Table, SelectQuery, QueryColumn, TableNode } from '../../../types/index';
import { X, Copy, Unlink } from 'lucide-react';

interface WizardProps {
  tables: Table[];
  onSave: (query: SelectQuery) => void;
  onClose: () => void;
}

export const DuplicateWizard: React.FC<WizardProps> = ({ tables, onSave, onClose }) => {
  const [tableId, setTableId] = useState(tables[0]?.id || '');
  const [fieldId, setFieldId] = useState('');

  const selectedTable = tables.find(t => t.id === tableId);

  const handleCreate = () => {
    if (!selectedTable || !fieldId) return;

    const field = selectedTable.fields.find(f => f.id === fieldId)!;
    
    const newQuery: SelectQuery = {
      id: crypto.randomUUID(),
      type: 'SELECT',
      name: `Duplikate in ${selectedTable.name}`,
      nodes: [{ id: 'n1', tableId: selectedTable.id, x: 50, y: 50 }],
      columns: [
        { 
          id: crypto.randomUUID(), tableId: selectedTable.id, fieldId: field.id, 
          tableName: selectedTable.name, fieldName: field.name, 
          sort: '', show: true, criteria: [''], aggregate: 'GROUP_BY' 
        },
        { 
          id: crypto.randomUUID(), tableId: selectedTable.id, fieldId: field.id, 
          tableName: selectedTable.name, fieldName: field.name, alias: 'AnzahlDuplikate',
          sort: 'DESC', show: true, criteria: ['>1'], aggregate: 'COUNT' 
        }
      ]
    };
    onSave(newQuery);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2"><Copy size={18}/> Duplikat-Assistent</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-bold mb-1">In welcher Tabelle?</label>
             <select className="w-full border rounded p-2" value={tableId} onChange={e => setTableId(e.target.value)}>
               {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1">Welches Feld enthält Duplikate?</label>
             <select className="w-full border rounded p-2" value={fieldId} onChange={e => setFieldId(e.target.value)}>
               <option value="">Bitte wählen...</option>
               {selectedTable?.fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
             </select>
          </div>
          <button onClick={handleCreate} disabled={!fieldId} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">Abfrage erstellen</button>
        </div>
      </div>
    </div>
  );
};

export const InconsistencyWizard: React.FC<WizardProps> = ({ tables, onSave, onClose }) => {
  const [leftTableId, setLeftTableId] = useState(tables[0]?.id || '');
  const [rightTableId, setRightTableId] = useState(tables[1]?.id || '');
  
  const handleCreate = () => {
    const t1 = tables.find(t => t.id === leftTableId);
    const t2 = tables.find(t => t.id === rightTableId);
    if (!t1 || !t2) return;
    
    const newQuery: SelectQuery = {
      id: crypto.randomUUID(),
      type: 'SELECT',
      name: `${t1.name} ohne ${t2.name}`,
      nodes: [
        { id: 'n1', tableId: t1.id, x: 50, y: 50 },
        { id: 'n2', tableId: t2.id, x: 300, y: 50 }
      ],
      columns: [
        ...t1.fields.map(f => ({
           id: crypto.randomUUID(), tableId: t1.id, fieldId: f.id, tableName: t1.name, fieldName: f.name,
           sort: '' as const, show: true, criteria: ['']
        })),
        { 
           id: crypto.randomUUID(), tableId: t2.id, fieldId: t2.fields[0].id, tableName: t2.name, fieldName: t2.fields[0].name,
           sort: '' as const, show: false, criteria: ['NULL'] 
        }
      ]
    };
    
    onSave(newQuery);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2"><Unlink size={18}/> Inkonsistenz-Assistent</h2>
          <button onClick={onClose}><X size={18}/></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Finde Datensätze in Tabelle A, die keine Verknüpfung in Tabelle B haben.</p>
        <div className="space-y-4">
          <div>
             <label className="block text-sm font-bold mb-1">Tabelle A (Hat Datensätze):</label>
             <select className="w-full border rounded p-2" value={leftTableId} onChange={e => setLeftTableId(e.target.value)}>
               {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1">Tabelle B (Fehlende Verknüpfung):</label>
             <select className="w-full border rounded p-2" value={rightTableId} onChange={e => setRightTableId(e.target.value)}>
               {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
          </div>
          <button onClick={handleCreate} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Abfrage erstellen</button>
        </div>
      </div>
    </div>
  );
};