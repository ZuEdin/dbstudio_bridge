import React, { useState } from 'react';
import { Table } from '../../../types/index';
import { SecurityRlsConfig, RlsRule } from '../rlsTypes';
import { Plus, Trash2, ShieldCheck, Sparkles, Filter, CheckCircle } from 'lucide-react';

interface RlsPolicyRuleEditorProps {
  tables: Table[];
  config: SecurityRlsConfig;
  onChangeConfig: (newConfig: SecurityRlsConfig) => void;
}

export const RlsPolicyRuleEditor: React.FC<RlsPolicyRuleEditorProps> = ({
  tables,
  config,
  onChangeConfig
}) => {
  const [newRuleTableId, setNewRuleTableId] = useState<string>(tables[0]?.id || '');
  const [newRuleRoleId, setNewRuleRoleId] = useState<string>(config.roles[1]?.id || 'role_manager');
  const [newRuleAction, setNewRuleAction] = useState<'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'>('SELECT');
  const [newRuleName, setNewRuleName] = useState<string>('Nur eigene Datensätze anzeigen');
  const [newRuleExpr, setNewRuleExpr] = useState<string>("owner_id = current_setting('app.current_user_id', true)::uuid");

  const PRESETS = [
    { label: 'Eigene Datensätze (Owner ID)', expr: "owner_id = current_setting('app.current_user_id', true)::uuid" },
    { label: 'Gleicher Mandant / Filiale', expr: "filiale_id = current_setting('app.current_filiale_id', true)::integer" },
    { label: 'Nur aktive Datensätze', expr: "status = 'AKTIV' AND is_deleted = false" },
    { label: 'Freigegebene Vorgänge', expr: "freigabe_status = 'GENEHMIGT'" }
  ];

  const handleAddRule = () => {
    const targetTable = tables.find(t => t.id === newRuleTableId) || tables[0];
    if (!targetTable || !newRuleName.trim() || !newRuleExpr.trim()) return;

    const newRule: RlsRule = {
      id: `rule_${Date.now()}`,
      tableId: targetTable.id,
      tableName: targetTable.name,
      roleId: newRuleRoleId,
      action: newRuleAction,
      name: newRuleName.trim(),
      expression: newRuleExpr.trim(),
      enabled: true
    };

    onChangeConfig({
      ...config,
      rules: [...config.rules, newRule]
    });

    setNewRuleName('');
  };

  const handleDeleteRule = (id: string) => {
    onChangeConfig({
      ...config,
      rules: config.rules.filter(r => r.id !== id)
    });
  };

  const handleToggleRule = (id: string) => {
    onChangeConfig({
      ...config,
      rules: config.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-indigo-400" />
            <span className="font-extrabold text-sm text-slate-100">Row-Level-Security (RLS) Filter-Regeln</span>
          </div>
          <p className="text-xs text-slate-400">
            Definiere feingranulare Filterbedingungen, die serverseitig in PostgreSQL Policies oder ORM-Abfragen injiziert werden.
          </p>
        </div>
      </div>

      {/* New Rule Creation Card */}
      <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
          <Plus size={13} className="text-indigo-600" />
          <span>Neue RLS-Regel erstellen</span>
        </span>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Tabelle:</label>
            <select
              value={newRuleTableId}
              onChange={e => setNewRuleTableId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Betroffene Rolle:</label>
            <select
              value={newRuleRoleId}
              onChange={e => setNewRuleRoleId(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {config.roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Operation:</label>
            <select
              value={newRuleAction}
              onChange={e => setNewRuleAction(e.target.value as any)}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
            >
              <option value="ALL">ALL (Alle Operationen)</option>
              <option value="SELECT">SELECT (Lesen)</option>
              <option value="INSERT">INSERT (Erstellen)</option>
              <option value="UPDATE">UPDATE (Aktualisieren)</option>
              <option value="DELETE">DELETE (Löschen)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Regel-Bezeichnung:</label>
            <input
              type="text"
              value={newRuleName}
              onChange={e => setNewRuleName(e.target.value)}
              placeholder="z.B. Nur eigene Kunden"
              className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Expression & Presets */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Filter-Ausdruck (SQL WHERE Bedingung / Policy Expression):
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold">Vorlagen:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => { setNewRuleExpr(p.expr); setNewRuleName(p.label); }}
                  className="text-[10px] bg-slate-200 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            value={newRuleExpr}
            onChange={e => setNewRuleExpr(e.target.value)}
            className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-bold"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddRule}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
          >
            <Plus size={13} />
            <span>Regel hinzufügen</span>
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
          Aktive RLS-Policies ({config.rules.length})
        </span>

        {config.rules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Noch keine RLS-Regeln hinterlegt. Alle Berechtigungen folgen der Standard-Rollen-Matrix.
          </div>
        ) : (
          config.rules.map(rule => {
            const role = config.roles.find(r => r.id === rule.roleId);
            return (
              <div
                key={rule.id}
                className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 shadow-2xs hover:border-slate-300"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="rounded text-indigo-600 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{rule.name}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-slate-600 dark:text-slate-400">
                      {rule.tableName}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {role?.name || 'Rolle'}
                    </span>
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                      FOR {rule.action}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 pl-6">
                    USING ({rule.expression})
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
