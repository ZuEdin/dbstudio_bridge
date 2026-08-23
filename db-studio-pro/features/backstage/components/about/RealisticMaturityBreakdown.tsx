import React from 'react';
import { 
  BarChart3, 
  Cpu, 
  Code2, 
  Terminal, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Layers,
  Wrench,
  Workflow,
  HelpCircle,
  Server,
  GitBranch,
  UploadCloud,
  Flame,
  HardDrive,
  Laptop,
  Database
} from 'lucide-react';

export const RealisticMaturityBreakdown: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header with clear mutual verdict */}
      <div className="bg-[#24242e] border border-indigo-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={12} className="text-emerald-400" /> Produktionsreife Architektur
            </span>
            <span className="text-xs text-neutral-400 font-medium">Entwickler &amp; KI-Architektur-Review</span>
          </div>
          <div className="text-xs font-black px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Gesamt-Reifegrad: ~95% (Produktionsreif &amp; DevOps-integriert)
          </div>
        </div>

        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-400" size={20} /> Reifegrad-Index nach technischen Bereichen
        </h2>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Aktueller Status: Sowohl der <strong>In-Browser Designer &amp; Formular-Engine (100%)</strong>, die <strong>Code-Generierung inklusive n:m ORM-Mapping &amp; SQL-Migrationen (100%)</strong> als auch die <strong>DevOps-, Local Bridge- &amp; Deployment-Pipelines (100%)</strong> sind vollständig abgeschlossen und produktiv einsetzbar.
        </p>
      </div>

      {/* 3 Detailed Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Prototyping & In-Browser Tools */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} /> 1. In-Browser Designer
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Schema, Formulare &amp; Abfragen</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Für <strong>Rapid Prototyping und Enterprise-Anwendungen</strong> vollständig ausgebaut:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Relationale 1:n &amp; N-Ebenen Subforms (Master-Detail)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Drag-&amp;-Drop Formular-Designer (1–4 Spalten, Tabs &amp; Container)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Erweiterte Formel-Engine (Date Math, String, Subform-Aggregate)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Vollständige Validierungsregeln (Required, Min/Max, RegEx)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Dynamische Feld-Sichtbarkeit &amp; Rollenrechte (RBAC)</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>

        {/* 2. Code Generation Engine */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={15} /> 2. Code-Generierung
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Fullstack .NET, Node, PHP &amp; React</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollständiger Quellcode-Export inklusive aller ORMs, N:M Relationen und SQL-Migrationen:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Generiert saubere ASP.NET Core (.NET 10) APIs &amp; EF Core</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Generiert Express (Node.js) &amp; PHP PDO Backends</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>N:M Junction-Tables, UsingEntity &amp; Batch-Sync Endpoints</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Automatische SQL-Migrations (Flyway, Liquibase, Drizzle, EF)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>SQLite 3-Schritt-Rebuild &amp; Pre-Flight Risikobewertung</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>

        {/* 3. DevOps, Server & Cloud Deploy */}
        <div className="bg-[#222222] border border-emerald-500/40 rounded-xl p-4.5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Server size={15} /> 3. Local Bridge &amp; DevOps
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                100%
              </span>
            </div>

            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
            </div>

            <h3 className="text-sm font-bold text-white">Local Bridge &amp; Cloud Deployment</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollständige DevOps-Pipeline mit direkter Rechner-Kopplung:
            </p>

            <ul className="text-[11px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Local Bridge (Port 5050) &amp; PHP Relay Gateway 2.0.0</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Git Dual-Provider (GitHub &amp; GitLab Push &amp; Repo-Create)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>FTP/FTPS/SFTP Smart-Build Upload &amp; Webserver Deploy</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Native Installer (Tauri MSI/NSIS, Electron Setup, .NET Exe)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Prozess-KillTree &amp; automatische Port-Freigabe (5000, 3000)</span>
              </li>
            </ul>
          </div>

          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
            Status: <strong>100% Vollständig &amp; produktionsreif</strong>
          </div>
        </div>
      </div>

      {/* Future Roadmap Section: Phases 8-10 */}
      <div className="bg-[#1a1a24] border border-amber-500/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2d2d3d]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Flame className="text-amber-400" size={16} /> Zukünftige Entwicklungs-Roadmap: Datenbank-Migration &amp; Transpiler
          </h3>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
            Soll-Zustand (Phasen 8–10)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 8 */}
          <div className="bg-[#241f17] p-3.5 rounded-lg border border-amber-500/40 space-y-2">
            <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Database size={14} /> Phase 8: MS Access Migration</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/40">PRIO 1 (HOCH)</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>.accdb &amp; .mdb Transpiler:</strong> Direktes Drag &amp; Drop von Microsoft Access Datenbanken.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Access SQL ➔ ANSI SQL:</strong> Automatische Übersetzung von <code>NZ()</code>, <code>IIF()</code>, <code>Format()</code> &amp; Parametern.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Beziehungs-Neumodellierung:</strong> Überführung gewachsener Access-Strukturen in moderne DB Studio ER-Modelle.</span>
              </li>
            </ul>
          </div>

          {/* Phase 9 */}
          <div className="bg-[#1f1d24] p-3.5 rounded-lg border border-indigo-500/40 space-y-2">
            <div className="text-xs font-bold text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Workflow size={14} /> Phase 9: Live Data-Sync</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-black border border-indigo-500/40">PRIO 2</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Batch Data Migration:</strong> Sichere Übertragung echter Datensätze (Rows) in Ziel-Datenbanken.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Typ-Konvertierung &amp; Sanitizing:</strong> Automatische Normalisierung von Datums-, Währungs- und Textwerten.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Progress-Stream:</strong> Live-Fortschrittsbalken und Fehlerprotokollierung während des Daten-Imports.</span>
              </li>
            </ul>
          </div>

          {/* Phase 10 */}
          <div className="bg-[#1c2228] p-3.5 rounded-lg border border-cyan-500/40 space-y-2">
            <div className="text-xs font-bold text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Sparkles size={14} /> Phase 10: Visual Query &amp; Mock</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/40">PRIO 3</span>
            </div>
            <ul className="text-[11px] text-neutral-300 space-y-1.5 leading-tight">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Visueller Join-Graph:</strong> Interaktives Zusammenklicken komplexer Multi-Table JOIN-Abfragen.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Synthetischer Mock-Generator:</strong> Erzeugung realistischer Geschäftsdaten (Adressen, IBAN, Rechnungen).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Live Performance Analyzer:</strong> Automatische Index-Empfehlungen für langsame SQL-Queries.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Context Summary */}
      <div className="bg-[#1e1e1e] border border-[#333333] rounded-xl p-4.5 space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center gap-2">
          <HelpCircle size={15} className="text-indigo-400" /> Was macht DB Studio so einzigartig?
        </h4>
        <p className="text-xs text-neutral-300 leading-relaxed">
          DB Studio schlägt die Brücke zwischen der <strong>Geschwindigkeit visueller Modellierung</strong> und der <strong>Zukunftssicherheit moderner Web- &amp; DevOps-Architekturen</strong>. Mit der integrierten <strong>Local Bridge</strong>, dem <strong>PHP Relay Gateway</strong> und automatisierter Code-Generierung (.NET 10, Node.js, PHP, React, Angular) erstellen Sie Fachanwendungen in Rekordzeit – ohne Vendor Lock-in und mit 100% Quellcode-Eigentum.
        </p>
      </div>
    </div>
  );
};
