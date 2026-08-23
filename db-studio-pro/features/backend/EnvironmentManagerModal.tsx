
import React, { useState } from 'react';
import { EnvironmentConfig, DbType } from '../../types/index';
import { X, Server, Database, Save, Globe, FolderOpen } from 'lucide-react';

interface EnvironmentManagerModalProps {
  initialEnvs: EnvironmentConfig[] | undefined;
  dbType: DbType;
  onSave: (envs: EnvironmentConfig[]) => void;
  onClose: () => void;
}

export const EnvironmentManagerModal: React.FC<EnvironmentManagerModalProps> = ({ initialEnvs, dbType, onSave, onClose }) => {
  const [envs, setEnvs] = useState<EnvironmentConfig[]>(initialEnvs || [
      { name: 'Development', dbConnection: '', apiUrl: 'http://localhost:5000/api', buildPath: './dist/dev' },
      { name: 'Staging', dbConnection: '', apiUrl: 'https://api-staging.example.com', buildPath: './dist/staging' },
      { name: 'Production', dbConnection: '', apiUrl: 'https://api.example.com', buildPath: './dist/prod' }
  ]);

  const updateEnv = (index: number, key: keyof EnvironmentConfig, value: string) => {
      const newEnvs = [...envs];
      (newEnvs[index] as any)[key] = value;
      setEnvs(newEnvs);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-slate-300 overflow-hidden flex flex-col h-[700px]">
        <div className="bg-slate-800 text-white p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Globe className="text-teal-400"/> Umgebungskonfiguration</h2>
            <button onClick={onClose}><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-blue-800">
                Definieren Sie hier Ihre Zielumgebungen. Der Generator passt <code>npm run build</code> Skripte und API-URLs automatisch an, 
                damit Sie ohne manuelle Änderungen deployen können.
            </div>

            {envs.map((env, idx) => {
                const customVars = env.vars || {};
                const varKeys = Object.keys(customVars);

                const handleAddVar = () => {
                    const newEnvs = [...envs];
                    const currentVars = { ...newEnvs[idx].vars };
                    // Find a unique name
                    let counter = 1;
                    while (currentVars[`CUSTOM_VAR_${counter}`] !== undefined) {
                        counter++;
                    }
                    currentVars[`CUSTOM_VAR_${counter}`] = '';
                    newEnvs[idx] = { ...newEnvs[idx], vars: currentVars };
                    setEnvs(newEnvs);
                };

                const handleUpdateVarKey = (oldKey: string, newKey: string) => {
                    if (oldKey === newKey) return;
                    const newEnvs = [...envs];
                    const currentVars = { ...newEnvs[idx].vars };
                    const value = currentVars[oldKey];
                    delete currentVars[oldKey];
                    currentVars[newKey] = value;
                    newEnvs[idx] = { ...newEnvs[idx], vars: currentVars };
                    setEnvs(newEnvs);
                };

                const handleUpdateVarValue = (key: string, value: string) => {
                    const newEnvs = [...envs];
                    const currentVars = { ...newEnvs[idx].vars };
                    currentVars[key] = value;
                    newEnvs[idx] = { ...newEnvs[idx], vars: currentVars };
                    setEnvs(newEnvs);
                };

                const handleRemoveVar = (key: string) => {
                    const newEnvs = [...envs];
                    const currentVars = { ...newEnvs[idx].vars };
                    delete currentVars[key];
                    newEnvs[idx] = { ...newEnvs[idx], vars: currentVars };
                    setEnvs(newEnvs);
                };

                return (
                    <div key={env.name} className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${env.name === 'Production' ? 'bg-red-500' : env.name === 'Staging' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <h3 className="font-bold text-slate-700">{env.name}</h3>
                            </div>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">
                                suffix: {env.name === 'Production' ? 'production' : env.name === 'Staging' ? 'staging' : 'development'}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Connection String ({dbType})
                                </label>
                                <div className="flex items-center gap-2 border border-slate-300 rounded bg-slate-50 px-2 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <Database size={16} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-transparent outline-none text-sm font-mono"
                                        placeholder={dbType === 'SQL' ? "Server=prod-sql;Database=mydb;..." : "mongodb://prod-mongo:27017/..."}
                                        value={env.dbConnection}
                                        onChange={e => updateEnv(idx, 'dbConnection', e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Server URL (Backend API)
                                </label>
                                <div className="flex items-center gap-2 border border-slate-300 rounded bg-slate-50 px-2 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <Server size={16} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-transparent outline-none text-sm font-mono"
                                        placeholder="https://api.mydomain.com"
                                        value={env.apiUrl || ''}
                                        onChange={e => updateEnv(idx, 'apiUrl', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Build Ordner (Output Path)
                                </label>
                                <div className="flex items-center gap-2 border border-slate-300 rounded bg-slate-50 px-2 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                                    <FolderOpen size={16} className="text-slate-400" />
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-transparent outline-none text-sm font-mono"
                                        placeholder="./dist/prod"
                                        value={env.buildPath || ''}
                                        onChange={e => updateEnv(idx, 'buildPath', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Custom Environment Variables Section */}
                        <div className="border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Benutzerdefinierte Umgebungsvariablen</h4>
                                <button 
                                    onClick={handleAddVar}
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors"
                                >
                                    + Variable hinzufügen
                                </button>
                            </div>

                            {varKeys.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">Keine zusätzlichen Variablen definiert. VITE_ prefixete Variablen werden auch im Frontend bereitgestellt.</p>
                            ) : (
                                <div className="space-y-2">
                                    {varKeys.map(key => (
                                        <div key={key} className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                className="flex-1 border border-slate-300 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-500"
                                                value={key}
                                                placeholder="VAR_NAME"
                                                onChange={e => handleUpdateVarKey(key, e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                                            />
                                            <span className="text-slate-400">=</span>
                                            <input 
                                                type="text" 
                                                className="flex-[1.5] border border-slate-300 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-blue-500"
                                                value={customVars[key]}
                                                placeholder="Wert"
                                                onChange={e => handleUpdateVarValue(key, e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleRemoveVar(key)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Variable entfernen"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="p-4 bg-white border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">Abbrechen</button>
            <button onClick={() => onSave(envs)} className="px-4 py-2 bg-slate-900 text-white hover:bg-black rounded text-sm font-bold flex items-center gap-2">
                <Save size={16}/> Konfiguration speichern
            </button>
        </div>
      </div>
    </div>
  );
};