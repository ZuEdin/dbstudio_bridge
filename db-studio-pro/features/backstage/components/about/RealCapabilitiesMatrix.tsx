import React from 'react';
import { 
  CheckCircle2, 
  Flame, 
  Sparkles,
  Database,
  FormInput,
  Filter,
  Printer,
  Code2,
  GitBranch,
  UploadCloud,
  Layers,
  Laptop,
  Server,
  Workflow,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export const RealCapabilitiesMatrix: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="text-emerald-400" size={20} /> Leistungs-Matrix: Implementierter Stand vs. Zukünftige Roadmap
        </h2>
        <p className="text-xs text-neutral-400">
          Vollständige und transparente Übersicht aller Module, Laufzeiten und DevOps-Fähigkeiten:
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WORKING NOW (100%) */}
        <div className="bg-[#242424] border border-emerald-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 size={18} /> Vollständig implementiert &amp; einsatzbereit (100%)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Produktionsreif
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Database size={15} className="text-emerald-400" /> Relationales Schema &amp; Tabelleneditor
              </div>
              <p className="text-[11px] text-neutral-400">
                Spaltendefinition mit AutoWert/PK, 1:1, 1:n &amp; n:m Fremdschlüsseln, Indizes, Validierungen und automatischer SQL-Schema-Migration (Flyway, Liquibase, Drizzle, EF Core).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <FormInput size={15} className="text-emerald-400" /> Formular-Studio &amp; N-Ebenen Subforms
              </div>
              <p className="text-[11px] text-neutral-400">
                Drag-&amp;-Drop Layouts (1–4 Spalten), berechnete Formeln, dynamische Sichtbarkeits-Regeln, Lookup-Dropdowns und rollenbasierte Feldrechte (RBAC).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Filter size={15} className="text-emerald-400" /> Visueller SQL- &amp; Abfrage-Designer
              </div>
              <p className="text-[11px] text-neutral-400">
                JOIN-Verknüpfungen, grafische Kriterien-Definition, Sortierung, SQL-Text-Vorschau und Echtzeit-Ergebnisraster.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Code2 size={15} className="text-emerald-400" /> Fullstack Code-Generatoren
              </div>
              <p className="text-[11px] text-neutral-400">
                Generiert sauberen Quellcode für ASP.NET Core (.NET 10), Express (Node.js), PHP 8 (PDO), React und Angular inklusive n:m Junction-Tables und EF Core <code>.UsingEntity&lt;T&gt;()</code>.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Server size={15} className="text-emerald-400" /> DB Studio Local Bridge &amp; PHP Relay (2.0.0)
              </div>
              <p className="text-[11px] text-neutral-400">
                Direkte Ausführung auf dem PC (Port 5050) oder via sicherem PHP Relay Gateway bei Firewalls. Live-Logs, Prozess-Management (Start, Stop, Neustart mit `killProcessTree` &amp; Port-Freigabe).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <GitBranch size={15} className="text-emerald-400" /> Git Dual-Provider &amp; FTP Deployer
              </div>
              <p className="text-[11px] text-neutral-400">
                Direkter Push zu GitHub &amp; GitLab (Cloud &amp; On-Premise) mit Auto-Repo-Erstellung sowie FTP/FTPS Webserver-Deployer mit Smart-Build Erkennung (<code>dist/</code>, <code>publish/</code>).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Laptop size={15} className="text-emerald-400" /> Native Desktop Installer (MSI, EXE, Setup)
              </div>
              <p className="text-[11px] text-neutral-400">
                1-Klick Erstellung von Tauri MSI/NSIS-Installern, Electron Setup.exe und eigenständigen .NET 10 Single-File Releases.
              </p>
            </div>
          </div>
        </div>

        {/* FUTURE ROADMAP (PHASES 8-10) */}
        <div className="bg-[#242424] border border-amber-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-amber-950">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Flame size={18} /> Zukünftige Roadmap (Phasen 8–10)
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              In Entwicklung
            </span>
          </div>

          <div className="space-y-3.5 text-xs text-neutral-300">
            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-amber-900/40">
              <div className="font-bold text-amber-300 flex items-center gap-2">
                <Database size={15} className="text-amber-400" /> Phase 8: Microsoft Access Migration Engine
              </div>
              <p className="text-[11px] text-neutral-300">
                Direktes Drag &amp; Drop von <code>.accdb</code> und <code>.mdb</code> Dateien. Automatischer Datentyp-Transpiler (AutoWert ➔ AutoIncrement / Serial / Identity, OLE ➔ BLOB) und SQL-Funktions-Transpiler (<code>NZ</code> ➔ <code>COALESCE</code>, <code>IIF</code> ➔ <code>CASE WHEN</code>).
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-amber-900/40">
              <div className="font-bold text-amber-300 flex items-center gap-2">
                <Workflow size={15} className="text-amber-400" /> Phase 8 (Forts.): Beziehungs-Neumodellierung in DB Studio
              </div>
              <p className="text-[11px] text-neutral-300">
                Historisch gewachsene Access-Fremdschlüssel werden analysiert und im visuellen DB Studio ER-Designer als saubere relationale Architektur (1:1, 1:n, n:m) neu geschärft.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <HardDrive size={15} className="text-indigo-400" /> Phase 9: Live Data-Sync &amp; Batch Migration
              </div>
              <p className="text-[11px] text-neutral-400">
                Automatisierte Übertragung der echten Datenzeilen (Rows) aus Access-Tabellen in MySQL, PostgreSQL oder SQLite mit Typ-Normalisierung und Progress-Bar.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <Sparkles size={15} className="text-cyan-400" /> Phase 10: Visueller Join-Graph &amp; Mock-Generator
              </div>
              <p className="text-[11px] text-neutral-400">
                Grafisches Zusammenklicken komplexer SQL-Queries mit Join-Matrix und KI-gestützte Erzeugung realistischer Testdaten.
              </p>
            </div>

            <div className="space-y-1 bg-[#1d1d1d] p-3 rounded-xl border border-[#333333]">
              <div className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400" /> Lokale SQLite &amp; Schema Inspektion
              </div>
              <p className="text-[11px] text-neutral-400">
                Integrierter SQLite-Explorer liest <code>.db</code> / <code>.sqlite</code> Dateien auf dem Entwicklerrechner direkt aus und ermöglicht SELECT-Abfragen im Daten-Grid.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
