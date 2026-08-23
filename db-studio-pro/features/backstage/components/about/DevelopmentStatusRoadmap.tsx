import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  GitBranch, 
  UploadCloud, 
  Cpu, 
  Layers, 
  FileCode, 
  Wrench,
  Workflow,
  Server,
  Flame,
  HardDrive,
  Database
} from 'lucide-react';

export const DevelopmentStatusRoadmap: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Reifegrad Status Box */}
      <div className="bg-[#252525] border border-[#3e3e3e] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#383838]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 size={12} className="text-emerald-400" /> Produktionsreife Suite
              </span>
              <span className="text-xs text-neutral-400 font-medium">Reifegrad-Index:</span>
              <span className="text-xs font-black text-emerald-400">~95% Gesamt-Funktionsumfang</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Status &amp; Reifegrad der Software
            </h3>
            <p className="text-xs text-neutral-300 max-w-3xl leading-relaxed">
              Quellcode-Architektur-Review und Praxis-Status: Sowohl das <strong>visuelle Modellieren (100%)</strong>, die <strong>Code-Generierung inklusive ORM &amp; Migrations (100%)</strong> als auch die <strong>DevOps-, Local Bridge- und Deployment-Integration (100%)</strong> sind abgeschlossen.
            </p>
          </div>

          <div className="bg-[#1c1c1c] border border-emerald-500/40 rounded-xl p-4 min-w-[240px] shrink-0 text-center">
            <div className="text-xs text-neutral-400 font-semibold mb-1">Entwicklungsfortschritt</div>
            <div className="text-2xl font-black text-emerald-400">95%</div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-700 h-2.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 h-full rounded-full w-[95%]" />
            </div>
            <div className="text-[10px] text-neutral-400 mt-1.5 flex justify-between">
              <span>Core &amp; Code-Gen (100%)</span>
              <span>DevOps &amp; Bridge (100%)</span>
            </div>
          </div>
        </div>

        {/* 2-Column Comparison: Already Working vs Upcoming */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Working (100%) */}
          <div className="bg-[#1e1e1e] border border-emerald-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-emerald-950">
              <CheckCircle2 size={16} /> Vollständig implementiert &amp; einsatzfähig (~95%)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Relationale Tabellen &amp; Schema:</strong> AutoWert, Primär- &amp; Fremdschlüssel (1:1, 1:n, n:m), Validierungen, Indizes und ER-Diagramme.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Formular-Studio mit N-Ebenen Subforms:</strong> Drag-&amp;-Drop Masken, Formel-Engine, dynamische Sichtbarkeitsregeln und RBAC.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Target Code-Export:</strong> Vollständige Projekte für C# (.NET 10), Node.js / Express, Angular, PHP und React mit ORM &amp; Migrationen.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DB Studio Local Bridge (Port 5050):</strong> 1-Klick Ausführung auf dem lokalen PC, Live-Terminal-Logs und Prozess-Management mit sauberer Port-Freigabe.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>PHP Relay Gateway (Version 2.0.0):</strong> Sicheres 2-Wege HTTPS-Relay für Firewalls, Private Network Access und Remote-Steuerung.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Git Dual-Provider &amp; FTP Deployer:</strong> Direkter Push zu GitHub &amp; GitLab sowie FTP/FTPS Webserver-Upload mit Smart-Build Erkennung.</span>
              </li>
            </ul>
          </div>

          {/* Planned / In Progress (Phases 8-10) */}
          <div className="bg-[#1e1e1e] border border-amber-900/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider pb-2 border-b border-amber-950">
              <Flame size={16} className="text-amber-400" /> Zukünftige Roadmap (Phasen 8–10)
            </div>
            <ul className="space-y-2.5 text-xs text-neutral-300">
              <li className="flex items-start gap-2">
                <Database size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Phase 8: MS Access Migration Engine:</strong> Drag &amp; Drop von <code>.accdb</code> / <code>.mdb</code> Dateien mit automatischem Typen- &amp; SQL-Transpiler.</span>
              </li>
              <li className="flex items-start gap-2">
                <Workflow size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Phase 8: Access Beziehungs-Neumodellierung:</strong> Überführung gewachsener Access-Beziehungen in den visuellen DB Studio ER-Designer.</span>
              </li>
              <li className="flex items-start gap-2">
                <HardDrive size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <span><strong>Phase 9: Live Data-Sync &amp; Batch Migration:</strong> Import echter Datenzeilen in Ziel-Datenbanken mit Typkonvertierung &amp; Progress-Stream.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Phase 10: Visueller SQL Query-Builder:</strong> Grafischer Multi-Table Join-Graph &amp; synthetische Testdatengenerierung.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
