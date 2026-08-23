import React from 'react';
import { Table } from '../../../../types/index';
import { RbacRole } from '../types';
import { Shield, Database } from 'lucide-react';
import { generateRlsPolicies, generateRbacMiddlewareCode } from '../utils/codeGenerators';

interface SecurityRbacTabProps {
  tables: Table[];
  rbacRoles: RbacRole[];
  setRbacRoles: React.Dispatch<React.SetStateAction<RbacRole[]>>;
  selectedRole: string;
  setSelectedRole: (val: string) => void;
  jwtExpiry: string;
  setJwtExpiry: (val: string) => void;
  rateLimitMax: number;
  setRateLimitMax: (val: number) => void;
  corsOrigins: string;
  setCorsOrigins: (val: string) => void;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  selectedTables: Record<string, boolean>;
}

export const SecurityRbacTab: React.FC<SecurityRbacTabProps> = ({
  tables,
  rbacRoles,
  setRbacRoles,
  selectedRole,
  setSelectedRole,
  jwtExpiry,
  setJwtExpiry,
  rateLimitMax,
  setRateLimitMax,
  corsOrigins,
  setCorsOrigins,
  showMessage,
  selectedTables,
}) => {
  const rlsCode = generateRlsPolicies(tables, selectedTables, rbacRoles);
  const rbacCode = generateRbacMiddlewareCode();

  const togglePerm = (tableName: string, type: 'read' | 'create' | 'update' | 'delete') => {
    setRbacRoles(prev => prev.map(r => {
      if (r.name !== selectedRole) return r;
      const currentPerms = r.permissions[tableName] || { read: false, create: false, update: false, delete: false };
      const updatedTablePerm = { ...currentPerms, [type]: !currentPerms[type] };
      return { ...r, permissions: { ...r.permissions, [tableName]: updatedTablePerm } };
    }));
  };

  const handleCopy = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    showMessage("Kopiert", `${label} wurde erfolgreich in die Zwischenablage kopiert.`, "success");
  };

  return (
    <div id="security_rbac_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="text-indigo-400" size={20} />
              <span>Punkt 4: Security & Dynamic RBAC Roles Generator</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">Row Level Security (RLS) Active</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Definieren Sie rollenbasierte Zugriffsrechte (RBAC), Zeilenebenen-Sicherheitsregeln (RLS) und Sicherheits-Guards.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Role selected:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700 shrink-0 font-mono text-xs">
              {rbacRoles.map(r => (
                <button
                  key={r.name}
                  onClick={() => setSelectedRole(r.name)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${selectedRole === r.name ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Role Permissions Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Tabellen-Zugriffsmatrix für Rolle '{selectedRole}'</span>
            <span className="text-slate-400 font-normal text-[11px]">{rbacRoles.find(r => r.name === selectedRole)?.description}</span>
          </h3>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Tabelle</th>
                  <th className="p-3 text-center">SELECT (Read)</th>
                  <th className="p-3 text-center">INSERT (Create)</th>
                  <th className="p-3 text-center">UPDATE (Edit)</th>
                  <th className="p-3 text-center">DELETE (Remove)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {tables.map(t => {
                  const currentRoleObj = rbacRoles.find(r => r.name === selectedRole);
                  const perm = currentRoleObj?.permissions[t.name] || { read: false, create: false, update: false, delete: false };

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-bold text-indigo-300 flex items-center gap-2">
                        <Database size={14} className="text-slate-500" />
                        <span>{t.name}</span>
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.read}
                          onChange={() => togglePerm(t.name, 'read')}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.create}
                          onChange={() => togglePerm(t.name, 'create')}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.update}
                          onChange={() => togglePerm(t.name, 'update')}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={perm.delete}
                          onChange={() => togglePerm(t.name, 'delete')}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Config Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block">JWT Expiration Policy</label>
            <input
              type="text"
              value={jwtExpiry}
              onChange={(e) => setJwtExpiry(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-750 focus:outline-none"
              placeholder="15m"
            />
            <p className="text-[10px] text-slate-500">Gültigkeitsdauer des Access-Tokens (z.B. 15m, 1h, 7d)</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block">IP Rate Limiter (req/min)</label>
            <input
              type="number"
              value={rateLimitMax}
              onChange={(e) => setRateLimitMax(parseInt(e.target.value) || 60)}
              className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-750 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">Maximale Anfragen pro IP-Adresse in einer Minute</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
            <label className="text-slate-300 font-bold block">CORS Origin Whitelist</label>
            <input
              type="text"
              value={corsOrigins}
              onChange={(e) => setCorsOrigins(e.target.value)}
              className="w-full bg-slate-950 text-white p-2 rounded-lg border border-slate-750 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">Erlaubte Client-Domains für API-Aufrufe</p>
          </div>
        </div>

        {/* Generated Policy Scripts & Middleware */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
              <span className="text-indigo-400 font-bold">🔒 postgresql_rls_policies.sql</span>
              <button
                onClick={() => handleCopy(rlsCode, "PostgreSQL RLS Policies")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
              >
                SQL Kopieren
              </button>
            </div>
            <pre className="text-slate-300 max-h-56 overflow-y-auto leading-relaxed"><code>{rlsCode}</code></pre>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
              <span className="text-indigo-400 font-bold">🛡️ rbac_auth_middleware.ts</span>
              <button
                onClick={() => handleCopy(rbacCode, "Express RBAC Middleware")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer transition-colors"
              >
                TS Kopieren
              </button>
            </div>
            <pre className="text-slate-300 max-h-56 overflow-y-auto leading-relaxed"><code>{rbacCode}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};
