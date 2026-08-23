import React from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useUIStore } from '../../../stores/useUIStore';
import { 
  User, 
  Shield, 
  Palette, 
  Info, 
  Key, 
  LogOut,
  Building,
  CheckCircle2,
  Layers
} from 'lucide-react';

export const KontoTab: React.FC = () => {
  const { user, logout, isAdmin } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Konto
        </h1>
        <p className="text-xs text-neutral-400">
          Benutzerprofil, Active Directory Anbindung und Benutzeroberflächen-Design
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* User Information */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
            <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-4">
              Benutzerinformationen
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-xs">
                {(user?.displayName || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {user?.displayName || user?.name || 'Lokaler Administrator'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {user?.email || 'admin@firma.local'}
                </p>
                {user?.isAdUser && (
                  <span className="inline-block mt-1 text-[10px] bg-indigo-900/60 text-indigo-300 font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
                    Active Directory Verifiziert
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-[#444444] pt-3">
              <div className="flex justify-between">
                <span className="text-neutral-400">Rolle:</span>
                <span className="font-semibold text-white">{user?.role || 'Administrator'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Domäne:</span>
                <span className="font-semibold text-white">CORP.LOCAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Berechtigungsstufe:</span>
                <span className="font-semibold text-emerald-400">Vollzugriff (Schema & Daten)</span>
              </div>
            </div>

            {user?.isAuthenticated && (
              <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 rounded-md text-xs font-semibold text-red-300 transition-colors"
              >
                <LogOut size={14} />
                <span>Abmelden</span>
              </button>
            )}
          </div>

          {/* Theme */}
          <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-indigo-400" />
              <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Design-Farbschema
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Wählen Sie das visuelle Design für DB Studio Pro
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { if (!darkMode) toggleDarkMode(); }}
                className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                  darkMode
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-[#383838] border-[#444444] text-neutral-300 hover:bg-[#3d3d3d]'
                }`}
              >
                <div className="font-semibold">Dunkelgrau (Standard)</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">DB Studio Charcoal</div>
              </button>

              <button
                onClick={() => { if (darkMode) toggleDarkMode(); }}
                className={`p-3 rounded-lg border text-left text-xs font-medium transition-colors ${
                  !darkMode
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-[#383838] border-[#444444] text-neutral-300 hover:bg-[#3d3d3d]'
                }`}
              >
                <div className="font-semibold">Bunt / Hell</div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Klassischer Kontrast</div>
              </button>
            </div>
          </div>
        </div>

        {/* Product Info & Version */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#333333] border border-[#444444]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs border border-indigo-400/40">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  DB Studio Pro
                </h3>
                <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Aktiviert & lizenziert</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs border-t border-[#444444] pt-3 text-neutral-300">
              <p>
                <strong>Version:</strong> 2026.4 (Build 18420.20000)
              </p>
              <p>
                <strong>Architektur:</strong> 64-Bit WebAssembly / IndexedDB Core
              </p>
              <p>
                <strong>Unterstützte Engines:</strong> IndexedDB (Standard), SQLite WASM, MySQL, PostgreSQL, MSSQL, MariaDB
              </p>
              <p className="text-neutral-400 text-[11px] pt-2">
                Enthält: Tabellen-Designer, Abfrage-Entwurf (SQL & QBE), Formular-Generator, Berichts-Assistent, Workflow-Engine, Backend-Generator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
