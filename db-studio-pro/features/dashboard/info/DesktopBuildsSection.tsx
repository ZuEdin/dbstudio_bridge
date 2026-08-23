import React from 'react';
import { Monitor, Terminal, Cpu } from 'lucide-react';

export const DesktopBuildsSection: React.FC = () => {
  return (
    <div className="bg-slate-50 py-16 px-6 border-b border-slate-200" id="desktop-builds-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
            Native Desktop Targets
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3">
            Vollwertige native Desktop-Applikation
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto mt-3">
            Generieren Sie schlüsselfertige Desktop-Pakete. Wählen Sie im Export-Center Ihre bevorzugte Desktop-Laufzeitumgebung aus:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Electron Builder */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between" id="electron-card">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Electron Ecosystem Build</h3>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">NodeJS Wrapper</p>
                </div>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Generiert ein sofort einsatzbereites Desktop-Projekt auf Basis von NodeJS. Perfekt geeignet für plattformübergreifende Anwendungen, die eine tiefe Integration in das NPM-Ökosystem und bestehende Bibliotheken erfordern.
              </p>
              <ul className="space-y-2 text-xs text-slate-500 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Voller Zugriff auf das gesamte NPM-Ecosystem</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Einfacher Einstieg ohne Rust- oder C++ Compiler</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-600 font-bold">✓</span>
                  <span>Reife API für Menüs, Tray-Icons und Dateizugriff</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Paketgröße: ~85 MB</span>
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] font-bold">Electron & Node</span>
            </div>
          </div>

          {/* Tauri & Rust */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col justify-between" id="tauri-card">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
                  <Terminal size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Tauri (Rust-Powered)</h3>
                  <p className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">Maximum Performance</p>
                </div>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed mb-4">
                Nutzt ein ressourcenschonendes Rust-Backend und die native Webview des Betriebssystems. Das sorgt für rasend schnelle Startzeiten, minimale Dateigrößen und unübertroffene Systemsicherheit.
              </p>
              <ul className="space-y-2 text-xs text-slate-400 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Extrem kleiner Arbeitsspeicher-Verbrauch (&lt;40MB)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Winzige App-Größe (&lt;15MB) dank OS-Webview</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Kompiliertes, sicheres Rust-Binary im Kern</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Paketgröße: &lt;15 MB</span>
              <span className="bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded font-mono text-[10px] font-bold">Rust Native</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
