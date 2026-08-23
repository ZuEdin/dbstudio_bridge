
import React, { useState, useEffect } from 'react';
import { DbType } from '../../types/index';
import { X, Save, Server, Database, User, Key, FileCode, CheckCircle, Globe } from 'lucide-react';

interface ConnectionSettingsModalProps {
  dbType: DbType;
  currentConnectionString: string;
  onSave: (connectionString: string) => void;
  onClose: () => void;
}

export const ConnectionSettingsModal: React.FC<ConnectionSettingsModalProps> = ({ dbType, currentConnectionString, onSave, onClose }) => {
  const [server, setServer] = useState('localhost');
  const [database, setDatabase] = useState('my_db');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('');
  const [sqliteFile, setSqliteFile] = useState('app.db');
  const [noSqlUri, setNoSqlUri] = useState('mongodb://localhost:27017');
  const [trusted, setTrusted] = useState(true); // For SQL Server

  useEffect(() => {
    if (!currentConnectionString) return;

    if (dbType === DbType.SQLite) {
       const match = currentConnectionString.match(/Data Source=(.*?)(?:;|$)/i);
       if (match) setSqliteFile(match[1]);
    } else if (dbType === DbType.NoSQL) {
       // Simple check if it looks like a URI
       if (currentConnectionString.startsWith('mongodb://') || currentConnectionString.startsWith('mongodb+srv://')) {
           setNoSqlUri(currentConnectionString);
       }
    } else {
       // Parse standard connection string parts
       const sMatch = currentConnectionString.match(/(?:Server|Data Source|Host)=(.*?)(?:;|$)/i);
       if(sMatch) setServer(sMatch[1]);

       const dMatch = currentConnectionString.match(/(?:Database|Initial Catalog)=(.*?)(?:;|$)/i);
       if(dMatch) setDatabase(dMatch[1]);

       const uMatch = currentConnectionString.match(/(?:User Id|Uid|User)=(.*?)(?:;|$)/i);
       if(uMatch) { 
           setUser(uMatch[1]); 
           setTrusted(false); 
       } else if (currentConnectionString.toLowerCase().includes('trusted_connection=true')) {
           setTrusted(true);
       }

       const pMatch = currentConnectionString.match(/(?:Password|Pwd)=(.*?)(?:;|$)/i);
       if(pMatch) setPassword(pMatch[1]);
       
       const portMatch = currentConnectionString.match(/(?:Port)=(.*?)(?:;|$)/i);
       if (portMatch) setPort(portMatch[1]);
    }
  }, [currentConnectionString, dbType]);

  const handleSave = () => {
      let cs = '';
      if (dbType === DbType.SQLite) {
          cs = `Data Source=${sqliteFile}`;
      } else if (dbType === DbType.NoSQL) {
          cs = noSqlUri;
      } else if (dbType === DbType.MySQL) {
          const portPart = port ? `Port=${port};` : '';
          cs = `Server=${server};${portPart}Database=${database};User Id=${user};Password=${password};`;
      } else {
          // SQL Server
          if (trusted) {
              cs = `Server=${server};Database=${database};Trusted_Connection=True;TrustServerCertificate=True;`;
          } else {
              cs = `Server=${server};Database=${database};User Id=${user};Password=${password};TrustServerCertificate=True;`;
          }
      }
      onSave(cs);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-25">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-slate-300">
        <div className="flex justify-between items-center p-4 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Server className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Verbindung konfigurieren</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">{dbType} Einstellungen</div>
          
          {dbType === DbType.SQLite ? (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Datenbank-Datei</label>
                <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                    <FileCode size={16} className="text-slate-400" />
                    <input 
                        type="text" 
                        value={sqliteFile} 
                        onChange={e => setSqliteFile(e.target.value)} 
                        className="flex-1 outline-none text-sm"
                        placeholder="app.db"
                    />
                </div>
             </div>
          ) : dbType === DbType.NoSQL ? (
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Connection URI (z.B. MongoDB)</label>
                <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                    <Globe size={16} className="text-slate-400" />
                    <input 
                        type="text" 
                        value={noSqlUri} 
                        onChange={e => setNoSqlUri(e.target.value)} 
                        className="flex-1 outline-none text-sm"
                        placeholder="mongodb://localhost:27017/my_db"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2">Geben Sie den vollständigen Connection String inklusive Datenbankname an.</p>
             </div>
          ) : (
             <>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Server / Host</label>
                        <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                            <Server size={16} className="text-slate-400" />
                            <input 
                                type="text" 
                                value={server} 
                                onChange={e => setServer(e.target.value)} 
                                className="flex-1 outline-none text-sm"
                                placeholder="localhost"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                        <input 
                            type="text" 
                            value={port} 
                            onChange={e => setPort(e.target.value)} 
                            className="w-full border border-slate-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={dbType === 'MySQL' ? '3306' : '1433'}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Datenbank Name</label>
                    <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                        <Database size={16} className="text-slate-400" />
                        <input 
                            type="text" 
                            value={database} 
                            onChange={e => setDatabase(e.target.value)} 
                            className="flex-1 outline-none text-sm"
                            placeholder="my_database"
                        />
                    </div>
                </div>

                {dbType === 'SQL' && (
                    <div className="flex items-center gap-2 py-2">
                        <input 
                            type="checkbox" 
                            id="trusted"
                            checked={trusted} 
                            onChange={e => setTrusted(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="trusted" className="text-sm text-slate-700">Windows Authentication (Trusted)</label>
                    </div>
                )}

                {(!trusted || dbType === 'MySQL') && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                                <User size={16} className="text-slate-400" />
                                <input 
                                    type="text" 
                                    value={user} 
                                    onChange={e => setUser(e.target.value)} 
                                    className="flex-1 outline-none text-sm"
                                    placeholder="root"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded p-2 focus-within:ring-2 focus-within:ring-blue-500">
                                <Key size={16} className="text-slate-400" />
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    className="flex-1 outline-none text-sm"
                                    placeholder="***"
                                />
                            </div>
                        </div>
                    </div>
                )}
             </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded text-sm">Abbrechen</button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={16} /> Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
};
