import React, { useState } from 'react';
import { 
  Server, 
  Terminal, 
  GitBranch, 
  UploadCloud, 
  Cpu, 
  Layers, 
  Box, 
  ShieldCheck, 
  CheckCircle2, 
  Laptop, 
  Workflow, 
  FolderTree, 
  HardDrive, 
  Zap, 
  RefreshCw, 
  Play, 
  Square, 
  RotateCw, 
  Download,
  Copy,
  Check,
  ExternalLink,
  Flame
} from 'lucide-react';

export const DevOpsAndBridgeShowcase: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-[#242432] border border-indigo-500/40 rounded-2xl p-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={13} className="text-emerald-400" /> 100% Implementiert &amp; Einsatzbereit
            </span>
            <span className="text-xs text-neutral-400 font-medium">Local Bridge &amp; DevOps Engine</span>
          </div>
          <div className="text-xs font-black px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Version 3.0.0 (Master-Spezifikation)
          </div>
        </div>

        <h2 className="text-xl font-black text-white flex items-center gap-2.5">
          <Server className="text-indigo-400" size={22} /> DB Studio Local Bridge &amp; DevOps Ökosystem
        </h2>
        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">
          Die <strong>DB Studio Local Bridge</strong> verbindet die webbasierte Studio-Oberfläche nahtlos mit Ihrem lokalen PC (Windows, macOS, Linux). Sie ermöglicht echte 1-Klick-Ausführung, Paket-Management, Git-Sync, Webserver-Deployments und native MSI/EXE-Builds.
        </p>
      </div>

      {/* Dual-Path Architecture Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Weg A: Direkte Verbindung */}
        <div className="bg-[#222222] border border-indigo-500/30 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={15} /> Weg A: Direkte REST/WS Verbindung
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Port 5050
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Ultra-Low-Latency auf Localhost</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Standard-Weg für die lokale Entwicklung. DB Studio sendet Payloads direkt via <code>http://127.0.0.1:5050/api/deploy</code> und streamt Terminal-Logs live über WebSockets.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Echtzeit-Streaming von stdout/stderr via <code>ws://127.0.0.1:5050/logs</code></span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Automatisches Private Network Access (PNA) &amp; CORS Header Handling</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Interaktive Swagger / OpenAPI Dokumentation unter <code>/api-docs</code></span>
              </li>
            </ul>
          </div>
          <div className="text-[11px] text-indigo-300 bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-900/40">
            Modus: <strong>Direkte Browser-zu-Bridge Kommunikation</strong>
          </div>
        </div>

        {/* Weg B: PHP Relay Gateway */}
        <div className="bg-[#222222] border border-emerald-500/30 rounded-xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={15} /> Weg B: PHP Relay Gateway (2.0.0)
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                HTTPS Fallback
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Sicherer Tunnel hinter Firewalls &amp; NAT</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Universelle Lösung, wenn Browser-Sicherheitsrichtlinien (CORS, Mixed-Content HTTPS/HTTP) direkte Requests blockieren oder der Entwickler-PC hinter einer Unternehmens-Firewall steht.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Zwei-Wege-Polling: Bridge holt Jobs ab (<code>pull_jobs</code>) und meldet Status</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>Live-Logs Streaming &amp; Prozess-Befehle (<code>stop</code>, <code>restart</code>) via HTTPS</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                <span>1-Klick Download &amp; Copy des <code>bridge_relay.php</code> Skripts</span>
              </li>
            </ul>
          </div>
          <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
            Modus: <strong>Zuverlässige HTTPS-Übertragung ohne Portweiterleitung</strong>
          </div>
        </div>
      </div>

      {/* 6 Core Completed DevOps Features Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="text-indigo-400" size={17} /> Die 6 Säulen der DB Studio DevOps Suite
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Manuelles Prozessmanagement & Port-Befreiung */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <RefreshCw size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">Prozess- &amp; Port-Koordination</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Manuelle Ausführungskontrolle (Play/Stop/Neustart). Beim Stoppen oder Neustart werden Unterprozesse via <code>killProcessTree</code> restlos beendet und Ports (5000, 3000, 5050) sofort freigegeben.
            </p>
          </div>

          {/* 2. Shared Dependencies */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <HardDrive size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">Shared Dependencies Modul-Speicher</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Zentraler Paket-Speicher in <code>Shared_Dependencies</code>. NPM- und NuGet-Module werden per Symlink verknüpft – spart Gigabytes an Speicherplatz und beschleunigt Builds auf wenige Sekunden.
            </p>
          </div>

          {/* 3. Native Installers (MSI/EXE) */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Laptop size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">Native Installer Packages</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Generiert schlüsselfertige Installationspakete: <strong>Tauri MSI &amp; NSIS Installer</strong>, <strong>Electron Setup.exe</strong> und <strong>.NET 10 Single-File Releases</strong> mit 1-Klick-Start.
            </p>
          </div>

          {/* 4. Git Dual-Provider */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <GitBranch size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">Git Dual-Provider (GitHub &amp; GitLab)</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Zwei getrennte Switches für GitHub und GitLab (Cloud &amp; On-Premise). Live-Verbindungstest mit Avatar-Anzeige, automatischem <code>git init</code>, Remote-Repo-Erstellung und Push.
            </p>
          </div>

          {/* 5. FTP / FTPS / SFTP Deployer */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UploadCloud size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">FTP / FTPS / SFTP Control Center</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Intelligente Build-Erkennung (lädt automatisch kompilierte <code>dist/</code>-Assets oder <code>publish/</code>-Ordner hoch). Inklusive Ping-Latenzmessung und Remote-Dateibrowser.
            </p>
          </div>

          {/* 6. Docker Compose & CI/CD */}
          <div className="bg-[#1e1e24] border border-[#383848] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Workflow size={17} />
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">100% FERTIG</span>
            </div>
            <h4 className="text-xs font-bold text-white">Docker Compose &amp; CI/CD Actions</h4>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Vorkonfigurierte Presets für MySQL 8.0, PostgreSQL 16, Redis 7 &amp; Mailpit. Automatische Erstellung von GitHub Actions (<code>.github/workflows</code>) und GitLab CI Pipelines.
            </p>
          </div>
        </div>
      </div>

      {/* Future Roadmap Highlight: Phase 8 MS Access Engine */}
      <div className="bg-gradient-to-r from-amber-950/30 via-[#26221c] to-[#1c1c1c] border border-amber-500/40 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-amber-900/40">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
            <Flame size={16} className="text-amber-400" /> Zukünftige Roadmap: Phase 8 (Höchste Priorität)
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            In Vorbereitung
          </span>
        </div>

        <h3 className="text-sm font-bold text-white">
          🗃️ Microsoft Access Migration Engine (.accdb / .mdb Schema &amp; Query Transpiler)
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Ermöglicht das direkte Ablegen von <strong>.accdb- und .mdb-Dateien per Drag &amp; Drop</strong>. Die Bridge analysiert Tabellenstrukturen, transipiliert Access-VBA-Funktionen (<code>NZ()</code> ➔ <code>COALESCE</code>, <code>IIF()</code> ➔ <code>CASE WHEN</code>, <code>Format()</code> ➔ <code>DATE_FORMAT</code>) in Standard-SQL und importiert das Modell in DB Studio zur visuellen Neumodellierung der Beziehungen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-neutral-300">
          <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#383838]">
            <strong className="text-amber-300 block mb-0.5">1. Datentyp-Transpiler</strong>
            AutoWert ➔ AutoIncrement / Serial / Identity, Währung ➔ Decimal, OLE ➔ BLOB.
          </div>
          <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#383838]">
            <strong className="text-amber-300 block mb-0.5">2. SQL Query Transpiler</strong>
            Übersetzt Access-VBA-Funktionen &amp; Parameterabfragen in sauberes ANSI SQL.
          </div>
          <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#383838]">
            <strong className="text-amber-300 block mb-0.5">3. Beziehungs-Neumodellierung</strong>
            Überführt gewachsene Access-Fremdschlüssel sauber in den visuellen DB Studio ER-Designer.
          </div>
        </div>
      </div>
    </div>
  );
};
