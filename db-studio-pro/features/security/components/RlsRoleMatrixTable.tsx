import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { SecurityRlsConfig, RoleDefinition, TablePermission } from '../rlsTypes';
import { Shield, Plus, Check, Lock, Eye, EyeOff, Edit3 } from 'lucide-react';

interface RlsRoleMatrixTableProps {
  tables: Table[];
  config: SecurityRlsConfig;
  onChangeConfig: (newConfig: SecurityRlsConfig) => void;
}

export const RlsRoleMatrixTable: React.FC<RlsRoleMatrixTableProps> = ({
  tables,
  config,
  onChangeConfig
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(config.roles[0]?.id || 'role_admin');
  const [selectedTableForCols, setSelectedTableForCols] = useState<string | null>(tables[0]?.id || null);

  const selectedRole = config.roles.find(r => r.id === selectedRoleId) || config.roles[0];
  const rolePermissions = config.permissions[selectedRoleId] || {};

  const handleToggleTablePerm = (tableId: string, permKey: 'create' | 'read' | 'update' | 'delete') => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const currentTablePerm = rolePermissions[tableId] || {
      tableId,
      tableName: table.name,
      create: true,
      read: true,
      update: true,
      delete: true
    };

    const nextPerm = {
      ...currentTablePerm,
      [permKey]: !currentTablePerm[permKey]
    };

    const nextPermissions = {
      ...config.permissions,
      [selectedRoleId]: {
        ...rolePermissions,
        [tableId]: nextPerm
      }
    };

    onChangeConfig({
      ...config,
      permissions: nextPermissions
    });
  };

  const handleColPermChange = (tableId: string, colName: string, mode: 'readwrite' | 'readonly' | 'hidden') => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const currentTablePerm = rolePermissions[tableId] || {
      tableId,
      tableName: table.name,
      create: true,
      read: true,
      update: true,
      delete: true,
      columnPermissions: {}
    };

    const nextColPerms = {
      ...(currentTablePerm.columnPermissions || {}),
      [colName]: mode
    };

    const nextPermissions = {
      ...config.permissions,
      [selectedRoleId]: {
        ...rolePermissions,
        [tableId]: {
          ...currentTablePerm,
          columnPermissions: nextColPerms
        }
      }
    };

    onChangeConfig({
      ...config,
      permissions: nextPermissions
    });
  };

  const activeTableObj = tables.find(t => t.id === selectedTableForCols) || tables[0];

  return (
    <div className="space-y-5">
      {/* Role Selection Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          {config.roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedRoleId === role.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Shield size={13} />
              <span>{role.name}</span>
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 italic">
          {selectedRole?.description}
        </div>
      </div>

      {/* CRUD Permissions Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Table Level Matrix */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Tabellen-Rechte (CRUD Matrix)
            </span>
            <span className="text-[11px] text-slate-400">Rolle: <strong>{selectedRole?.name}</strong></span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Tabelle</th>
                <th className="p-3 text-center">Create (C)</th>
                <th className="p-3 text-center">Read (R)</th>
                <th className="p-3 text-center">Update (U)</th>
                <th className="p-3 text-center">Delete (D)</th>
                <th className="p-3 text-right">Spalten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {tables.map(table => {
                const perm = rolePermissions[table.id] || {
                  tableId: table.id,
                  tableName: table.name,
                  create: true,
                  read: true,
                  update: true,
                  delete: true
                };

                const isSelectedForCols = selectedTableForCols === table.id;

                return (
                  <tr key={table.id} className={`hover:bg-slate-100/60 dark:hover:bg-slate-800/40 ${isSelectedForCols ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Lock size={12} className="text-slate-400" />
                      <span>{table.name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.create}
                        onChange={() => handleToggleTablePerm(table.id, 'create')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.read}
                        onChange={() => handleToggleTablePerm(table.id, 'read')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.update}
                        onChange={() => handleToggleTablePerm(table.id, 'update')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perm.delete}
                        onChange={() => handleToggleTablePerm(table.id, 'delete')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedTableForCols(table.id)}
                        className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${
                          isSelectedForCols
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        Felder ({table.fields.length})
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Column Level Permissions Panel */}
        {activeTableObj && (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs flex flex-col">
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="font-extrabold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Spalten-Rechte: {activeTableObj.name}
              </span>
            </div>

            <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[380px]">
              {activeTableObj.fields.map(field => {
                const tablePerm = rolePermissions[activeTableObj.id];
                const colMode = tablePerm?.columnPermissions?.[field.name] || 'readwrite';

                return (
                  <div key={field.id} className="p-2.5 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{field.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{field.type}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleColPermChange(activeTableObj.id, field.name, 'readwrite')}
                        className={`p-1 rounded text-[10px] font-bold ${
                          colMode === 'readwrite' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                        title="Vollzugriff (Lesen + Schreiben)"
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        onClick={() => handleColPermChange(activeTableObj.id, field.name, 'readonly')}
                        className={`p-1 rounded text-[10px] font-bold ${
                          colMode === 'readonly' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                        title="Nur Lesen (Read-Only)"
                      >
                        <Eye size={11} />
                      </button>
                      <button
                        onClick={() => handleColPermChange(activeTableObj.id, field.name, 'hidden')}
                        className={`p-1 rounded text-[10px] font-bold ${
                          colMode === 'hidden' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}
                        title="Ausgeblendet (Hidden)"
                      >
                        <EyeOff size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
