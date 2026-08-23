import React, { useState } from 'react';
import { DbType } from '../../../types/index';
import { X, Check, HardDrive, Cpu, Globe, Server, Layers, Plus, Lock, Cloud } from 'lucide-react';

interface NewDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, dbType: DbType, language: 'csharp' | 'typescript' | 'php' | 'python', isCloud?: boolean) => void;
}

export const NewDatabaseModal: React.FC<NewDatabaseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [dbName, setDbName] = useState('Datenbank1');
  const [storageScope, setStorageScope] = useState<'private' | 'cloud'>('private');
  // Strict priority: Default database engine is always IndexedDB
  const [selectedEngine, setSelectedEngine] = useState<DbType>(DbType.SQLite);
  const [selectedLang, setSelectedLang] = useState<'csharp' | 'typescript' | 'php' | 'python'>('typescript');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = dbName.trim() || 'Datenbank1';
    onCreate(cleanName, selectedEngine, selectedLang, storageScope === 'cloud');
  };

  const engines = [
    {
      id: DbType.SQLite,
      name: 'IndexedDB (Browser-Speicher)',
      sub: 'Standard & Priorität: 100% Client-Persistenz ohne Serverzwang',
      icon: HardDrive,
      recommended: true,
      badge: 'STANDARD',
    },
    {
      id: DbType.SQL,
      name: 'Microsoft SQL Server / MSSQL',
      sub: 'Enterprise Schema mit T-SQL Kompatibilität & .NET Anbindung',
      icon: Server,
    },
    {
      id: DbType.MySQL,
      name: 'MySQL / MariaDB',
      sub: 'Standard Web-RDBMS mit InnoDB-Tabellen & utf8mb4',
      icon: Globe,
    },
    {
      id: DbType.PostgreSQL,
      name: 'PostgreSQL',
      sub: 'Fortgeschrittenes RDBMS mit JSONB & UUIDs',
      icon: Cpu,
    },
  ];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#2b2b2b] border border-[#484848] rounded-xl shadow-2xl overflow-hidden text-neutral-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#232323] border-b border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm shadow-xs">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Neue Datenbank erstellen</h2>
              <p className="text-xs text-neutral-400">Neues Datenbankschema in DB Studio anlegen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Datenbankname
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="z. B. Kundenverwaltung"
                className="w-full bg-[#383838] border border-[#555555] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-white placeholder-neutral-500 outline-none pr-16 font-medium"
                autoFocus
              />
              <span className="absolute right-3 text-xs text-neutral-400 font-mono pointer-events-none select-none">
                .dbsp
              </span>
            </div>
          </div>

          {/* Project Type / Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Bereich & Typ (Klar zuordenbar)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStorageScope('private')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  storageScope === 'private'
                    ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-xs'
                    : 'bg-[#333333] border-[#444444] text-neutral-300 hover:bg-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Lock size={13} className="text-indigo-400" />
                    <span>Privat (IndexedDB)</span>
                  </div>
                  <span className="text-[9px] font-extrabold bg-indigo-600/80 text-indigo-100 px-1.5 py-0.5 rounded">
                    LOKAL
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  100% lokal im Browser gespeichert (Priorität), offline-fähig & privat.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStorageScope('cloud')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  storageScope === 'cloud'
                    ? 'bg-sky-950/60 border-sky-500 text-white shadow-xs'
                    : 'bg-[#333333] border-[#444444] text-neutral-300 hover:bg-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Cloud size={13} className="text-sky-400" />
                    <span>Cloud Workspace</span>
                  </div>
                  <span className="text-[9px] font-extrabold bg-sky-600/80 text-sky-100 px-1.5 py-0.5 rounded">
                    CLOUD
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  In der Cloud gesichert für Team-Kollaboration & Multi-Geräte Zugriff.
                </p>
              </button>
            </div>
          </div>

          {/* Database Storage Engine Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Speicher- & Datenbank-Engine (Priorität: IndexedDB)
            </label>
            <div className="space-y-1.5">
              {engines.map((eng) => {
                const Icon = eng.icon;
                const isSelected = selectedEngine === eng.id;
                return (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setSelectedEngine(eng.id)}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 text-white shadow-xs'
                        : 'bg-[#333333] border-[#444444] text-neutral-300 hover:bg-[#3a3a3a] hover:border-neutral-500'
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{eng.name}</span>
                        {eng.badge && (
                          <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                            {eng.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">{eng.sub}</p>
                    </div>
                    {isSelected && <Check size={15} className="text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backend Export Preset */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Ziel-Backend Architektur
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'typescript', label: 'Node / Express' },
                { id: 'csharp', label: '.NET 10 / C#' },
                { id: 'php', label: 'PHP / Laravel' },
                { id: 'python', label: 'Python / FastAPI' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setSelectedLang(lang.id as any)}
                  className={`py-1.5 px-2 rounded-md text-xs text-center border font-medium transition-colors ${
                    selectedLang === lang.id
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#333333] border-[#444444] text-neutral-300 hover:bg-[#3c3c3c]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#383838]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-md transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-md transition-colors"
            >
              <Plus size={15} />
              <span>Datenbank erstellen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
