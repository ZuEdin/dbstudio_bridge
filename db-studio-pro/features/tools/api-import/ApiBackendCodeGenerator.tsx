import React from 'react';
import { Server, Check, Copy, Database } from 'lucide-react';

interface ApiBackendCodeGeneratorProps {
  backendLang: 'dotnet' | 'node' | 'php';
  setBackendLang: (lang: 'dotnet' | 'node' | 'php') => void;
  copied: boolean;
  setCopied: (copied: boolean) => void;
  activeCode: string;
  sqlServerMigration: string;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export const ApiBackendCodeGenerator: React.FC<ApiBackendCodeGeneratorProps> = ({
  backendLang,
  setBackendLang,
  copied,
  setCopied,
  activeCode,
  sqlServerMigration,
  showMessage,
}) => {
  return (
    <div className="p-4 h-full overflow-auto bg-slate-50 flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 rounded-lg p-4 shadow-sm shrink-0 gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Server size={18} className="text-emerald-500" /> SQL Server Code-Generator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Generieren Sie einsatzbereiten Code, um diese API-Struktur automatisch in Ihrer produktiven SQL-Server-Datenbank zu synchronisieren.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto shrink-0">
          <button 
            type="button"
            onClick={() => {
              setBackendLang('dotnet');
              setCopied(false);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'dotnet' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
          >
            .NET C# (EF Core)
          </button>
          <button 
            type="button"
            onClick={() => {
              setBackendLang('node');
              setCopied(false);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'node' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Node.js (Prisma)
          </button>
          <button 
            type="button"
            onClick={() => {
              setBackendLang('php');
              setCopied(false);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${backendLang === 'php' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
          >
            PHP (Laravel)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden min-h-[480px]">
          <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center shrink-0">
            <span className="font-mono text-xs text-slate-500 font-semibold">
              {backendLang === 'dotnet' ? 'SqlServerApiImporter/SyncController.cs' : backendLang === 'node' ? 'server.js & schema.prisma' : 'SyncController.php & migrations.php'}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(activeCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                showMessage("Kopiert", "Backend-Code wurde in die Zwischenablage kopiert.", "success");
              }}
              className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copied ? 'Kopiert!' : 'Code kopieren'}
            </button>
          </div>
          <pre className="flex-1 p-4 font-mono text-xs overflow-auto bg-slate-950 text-emerald-400 select-text leading-relaxed">
            <code>{activeCode}</code>
          </pre>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5 border-b pb-2 uppercase tracking-wider">
              <Database size={14} className="text-blue-500" /> SQL Server Tabellen-Schema (DDL)
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              Führen Sie diese SQL-Anweisung in Ihrem SQL-Client (z.B. SSMS, DBeaver) aus, um die Struktur anzulegen:
            </p>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-[10px] overflow-auto max-h-[160px] select-text leading-normal">
                <code>{sqlServerMigration}</code>
              </pre>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlServerMigration);
                  showMessage("Kopiert", "SQL-Migrationsskript kopiert.", "success");
                }}
                className="absolute right-2 top-2 p-1 bg-slate-800 border border-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Kopieren"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-lg shadow-sm p-4">
            <h4 className="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-wider">Anleitung zur Einrichtung:</h4>
            <ol className="text-xs text-indigo-950 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Kopieren Sie den DDL-Code links und erstellen Sie die Tabelle auf Ihrem SQL-Server.</li>
              <li>Kopieren Sie den generierten Backend-Code für Ihr Wunschframework (.NET, Node, PHP).</li>
              <li>Fügen Sie den Code in Ihr Backend-Projekt ein und konfigurieren Sie die SQL Server-Verbindung.</li>
              <li>Verwenden Sie die Route, um Daten aus der API abzuholen und direkt in Ihre produktive SQL-Server-Tabelle zu speichern!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
