import React, { useState } from 'react';
import { Table } from '../../types/index';
import { SecurityRlsConfig } from './rlsTypes';
import { createInitialRlsConfig } from './rlsService';
import { RlsRoleMatrixTable } from './components/RlsRoleMatrixTable';
import { RlsPolicyRuleEditor } from './components/RlsPolicyRuleEditor';
import { RlsPolicyCodeExport } from './components/RlsPolicyCodeExport';
import { X, ShieldAlert, KeyRound, Filter, Code, Save, Check } from 'lucide-react';

interface SecurityRlsModalProps {
  tables: Table[];
  existingConfig?: SecurityRlsConfig;
  onSaveConfig: (config: SecurityRlsConfig) => void;
  onClose: () => void;
}

export const SecurityRlsModal: React.FC<SecurityRlsModalProps> = ({
  tables,
  existingConfig,
  onSaveConfig,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'rules' | 'export'>('matrix');
  const [config, setConfig] = useState<SecurityRlsConfig>(() => {
    return existingConfig || createInitialRlsConfig(tables);
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSaveConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[780px]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/30">
              <ShieldAlert className="text-rose-400 w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Row-Level-Security (RLS) & Rollen-Matrix</h2>
                <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-700">
                  {config.roles.length} Rollen
                </span>
                <span className="bg-emerald-900/60 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-700">
                  {config.rules.filter(r => r.enabled).length} RLS-Policies aktiv
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfiguriere tabellen- und spaltenbasierte CRUD-Berechtigungen sowie feingranulare Zeilenfilter (RLS).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 pt-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'matrix'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <KeyRound size={13} />
              <span>Berechtigungs-Matrix (CRUD)</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'rules'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Filter size={13} />
              <span>Row-Level Filter (RLS)</span>
              {config.rules.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                  {config.rules.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Code size={13} />
              <span>Policy SQL & Handler Code</span>
            </button>
          </div>

          <div className="pb-2">
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all ${
                saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {saved ? <Check size={13} /> : <Save size={13} />}
              <span>{saved ? 'Gespeichert!' : 'Regeln speichern'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-slate-900">
          {activeTab === 'matrix' && (
            <RlsRoleMatrixTable
              tables={tables}
              config={config}
              onChangeConfig={setConfig}
            />
          )}

          {activeTab === 'rules' && (
            <RlsPolicyRuleEditor
              tables={tables}
              config={config}
              onChangeConfig={setConfig}
            />
          )}

          {activeTab === 'export' && (
            <RlsPolicyCodeExport
              config={config}
              tables={tables}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldAlert size={13} className="text-rose-500" />
            <span>PostgreSQL Native RLS & ASP.NET Core Multi-Tenant Handler kompatibel</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
