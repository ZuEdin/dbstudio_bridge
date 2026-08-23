import React from 'react';
import { Check, X, Sparkles, ShieldCheck, Code2, Database, Zap, Cpu } from 'lucide-react';

export const ComparisonSection: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white py-20 px-6 border-b border-slate-800" id="comparison-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-400/20 text-blue-300 rounded-full text-xs font-bold mb-4">
            <Sparkles size={13} className="text-blue-400" />
            <span>Der direkte Architektur-Vergleich</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Warum DB Studio Pro die moderne Alternative ist
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto mt-3 leading-relaxed">
            Vergleichen Sie traditionelle Desktop-Datenbanken, proprietäre No-Code-Plattformen und den modernen, code-basierten Ansatz von DB Studio Pro.
          </p>
        </div>

        {/* 3-Spalten Vergleichs-Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Spalte 1: Legacy (MS Access / FileMaker) */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-200">Klassische Desktop-DBs</h3>
                  <p className="text-xs text-slate-400">z. B. MS Access, FileMaker</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-700 text-slate-300 text-[10px] font-bold uppercase">
                  Legacy
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>An Windows gebunden &amp; proprietäre Binär-Dateien (`.accdb`)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Keine echte Web- oder moderne Cloud-Fähigkeit</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Brüchige Multi-User-Sperren bei Netzwerk-Laufwerken</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Kein Export in zeitgemäße Web-Frameworks (React/Angular)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Schnell visuell zusammengeklickt (Forms, Reports)</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700 text-[11px] text-slate-400">
              <span className="font-bold block text-slate-300">Fazit:</span>
              Hohes Sicherheitsrisiko und technologischer Stillstand in modernen Unternehmen.
            </div>
          </div>

          {/* Spalte 2: Proprietäre No-Code SaaS */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-slate-200">No-Code Cloud SaaS</h3>
                  <p className="text-xs text-slate-400">z. B. Airtable, Retool, Bubble</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold uppercase">
                  Vendor-Lock
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Extreme monatliche Lizenzkosten pro Benutzer (Per-Seat-Pricing)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span><strong>Kein Quellcode-Besitz</strong> – Sie sind gefangen in der Plattform</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>Zwang zur Cloud: Kein Offline-Betrieb vor Ort</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Moderne Web-Oberfläche im Browser</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <X size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>DSGVO-Hürden bei externem US-Hosting sensibler Firmendaten</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-700 text-[11px] text-slate-400">
              <span className="font-bold block text-slate-300">Fazit:</span>
              Skaliert bei wachsender Nutzerzahl finanziell extrem teuer.
            </div>
          </div>

          {/* Spalte 3: DB STUDIO PRO (Der Gewinner) */}
          <div className="bg-gradient-to-b from-blue-950/80 to-slate-900 border-2 border-blue-500/80 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
            <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles size={11} />
              <span>Die Zukunft</span>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-4 mb-5">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    DB Studio Pro
                  </h3>
                  <p className="text-xs text-blue-200">Visual Builder + Full-Stack Code Export</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase">
                  100% Freiheit
                </span>
              </div>

              <ul className="space-y-3.5 text-xs text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 font-bold shrink-0 mt-0.5" />
                  <span><strong>100% Code-Besitz:</strong> Reiner Quellcode in React, Angular, .NET C# &amp; PHP</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 font-bold shrink-0 mt-0.5" />
                  <span><strong>Zero Vendor-Lock-in:</strong> Keine monatlichen Lizenzkosten pro Endanwender</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 font-bold shrink-0 mt-0.5" />
                  <span><strong>Offline-First &amp; Desktop:</strong> Tauri (Rust) + SQLite mit intelligentem Remote-Sync</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 font-bold shrink-0 mt-0.5" />
                  <span><strong>Volle Suite:</strong> Tabellen mit Formeln &amp; ENUMs, ER-Diagramm, Forms, Reports &amp; Workflows</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 font-bold shrink-0 mt-0.5" />
                  <span><strong>Maximale Privatsphäre:</strong> Lokale IndexedDB-Persistenz, DSGVO-konform</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-blue-500/30 text-[11px] text-blue-200">
              <span className="font-bold block text-white">Fazit:</span>
              Maximale Entwicklungsgeschwindigkeit ohne Einschränkungen bei Skalierung oder Eigentum.
            </div>
          </div>

        </div>

        {/* Feature Highlights Quick Bar */}
        <div className="mt-12 bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="text-xl md:text-2xl font-black text-blue-400 mb-1">0 €</div>
            <div className="text-[11px] text-slate-300">Laufzeitgebühren / User</div>
          </div>
          <div className="p-2">
            <div className="text-xl md:text-2xl font-black text-emerald-400 mb-1">100%</div>
            <div className="text-[11px] text-slate-300">Quellcode-Eigentum</div>
          </div>
          <div className="p-2">
            <div className="text-xl md:text-2xl font-black text-purple-400 mb-1">Multi-Stack</div>
            <div className="text-[11px] text-slate-300">React, Angular, .NET, PHP</div>
          </div>
          <div className="p-2">
            <div className="text-xl md:text-2xl font-black text-amber-400 mb-1">Offline-First</div>
            <div className="text-[11px] text-slate-300">Tauri + SQLite Sync</div>
          </div>
        </div>

      </div>
    </div>
  );
};
