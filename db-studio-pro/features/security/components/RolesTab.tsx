import React, { useState } from 'react';
import { UserCog, RefreshCw, Trash2, Plus } from 'lucide-react';

interface RolesTabProps {
  roles: any[];
  onResetDefaults: () => void;
  onDeleteRole: (roleId: any) => void;
  onAddRole: (name: string, description: string) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  roles,
  onResetDefaults,
  onDeleteRole,
  onAddRole,
}) => {
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const handleAdd = () => {
    if (!newRoleName) return;
    onAddRole(newRoleName, newRoleDesc);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 m-6 h-[90%] overflow-y-auto max-w-3xl mx-auto flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <UserCog size={20} className="text-slate-600" /> Rollenverwaltung
        </h3>
        <button
          onClick={onResetDefaults}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
        >
          <RefreshCw size={12} /> Defaults wiederherstellen
        </button>
      </div>

      <div className="flex-1 overflow-auto border border-slate-200 rounded-lg mb-6">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="p-3 border-b font-semibold text-slate-600 w-16">ID</th>
              <th className="p-3 border-b font-semibold text-slate-600">Rollenname</th>
              <th className="p-3 border-b font-semibold text-slate-600">Beschreibung</th>
              <th className="p-3 border-b w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map((r: any) => (
              <tr key={r.Id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-slate-500">{r.Id}</td>
                <td className="p-3 font-bold text-slate-800">
                  {r.Name}
                  {String(r.Id) === '1' && (
                    <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">
                      System
                    </span>
                  )}
                </td>
                <td className="p-3 text-slate-600">{r.Description || '-'}</td>
                <td className="p-3 text-right">
                  {String(r.Id) !== '1' && (
                    <button
                      onClick={() => onDeleteRole(r.Id)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Neue Rolle erstellen</h4>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Bezeichnung</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
              placeholder="z.B. Lektor"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">Beschreibung</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded p-2 text-sm bg-white"
              placeholder="z.B. Darf Berichte lesen"
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newRoleName}
            className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 h-[38px] transition-colors"
          >
            <Plus size={16} /> Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};
