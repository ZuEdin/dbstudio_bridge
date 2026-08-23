import React from 'react';
import { 
  Database, 
  Server, 
  Laptop, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Terminal,
  FileCode2,
  Box
} from 'lucide-react';

export const TechStackShowcase: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="text-amber-400" size={20} /> Unterstützte Technologien &amp; Ziel-Ökosysteme
        </h2>
        <p className="text-xs text-neutral-400">
          DB Studio wurde von Grund auf so konzipiert, dass Datenmodelle und Benutzeroberflächen in moderne, offene Industriestandards übersetzt werden – völlig unabhängig von proprietären Laufzeitumgebungen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. SQL & Relationale Datenbanken */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Database size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
                SQL &amp; Schema
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">SQL, SQLite &amp; MySQL / Postgres</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Vollwertige relationale Datenmodellierung mit <strong>AutoWert-Primärschlüsseln</strong>, Fremdschlüsseln (1:1, 1:n), Kaskaden, Indizes und Datentyp-Prüfung.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>SQLite:</strong> Ideal für lokale Desktop-, Embedded- &amp; Offline-Apps als eigenständige Datei.</li>
              <li>• <strong>MySQL / MariaDB:</strong> Der Klassiker für skalierbare Multi-User Webhostings.</li>
              <li>• <strong>SQL DDL Export:</strong> Erzeugt saubere `CREATE TABLE`- und `ALTER TABLE`-Skripte.</li>
            </ul>
          </div>
        </div>

        {/* 2. Desktop Runtimes: Tauri & Electron */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Laptop size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Desktop Runtimes
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Tauri (Rust) &amp; Electron</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Verpacken Sie jede in DB Studio gestaltete Applikation als native Windows-, macOS- oder Linux-Desktop-Software.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>Tauri:</strong> Winzige Dateigrößen (&lt; 10 MB), minimaler RAM-Verbrauch und Rust-Sicherheit.</li>
              <li>• <strong>Electron:</strong> Umfassender OS-Zugriff, Druckerdialoge und Windows-Integration.</li>
              <li>• <strong>Offline First:</strong> Lokale Datenverarbeitung ohne zwingende Cloud-Verbindung.</li>
            </ul>
          </div>
        </div>

        {/* 3. .NET 10 / C# */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileCode2 size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                .NET 10 / C#
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">C# (.NET 10) Enterprise Backend</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generiert saubere ASP.NET Core Web APIs mit C#-Modellen, Dependency Injection, Controller-Routen und DTOs.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>Typensicherheit:</strong> C# Records &amp; Models für jedes DB-Studio-Schema.</li>
              <li>• <strong>EF Core &amp; Dapper Ready:</strong> Strukturierte Repositories für maximale Performance.</li>
              <li>• <strong>Enterprise Standard:</strong> Direkte Integration in bestehende Windows-Server &amp; Azure.</li>
            </ul>
          </div>
        </div>

        {/* 4. Node.js & Express */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Server size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Node.js &amp; TS
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Node.js, Express &amp; TypeScript</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Schlanke, asynchrone REST-APIs mit automatischer Request-Validierung, JWT-Rollenprüfung und JSON-Endpoints.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>TypeScript Native:</strong> Strikte Typen für Tabellen, Abfragen und Formularwerte.</li>
              <li>• <strong>Microservices &amp; Docker:</strong> Sofort containerisierbar für Cloud Run oder Kubernetes.</li>
              <li>• <strong>Modulares Routing:</strong> Saubere Trennung von Controllern, Routen und Services.</li>
            </ul>
          </div>
        </div>

        {/* 5. PHP 8.x & PDO */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Globe size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                PHP 8 &amp; PDO
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Modernes PHP (8.x) &amp; Webhosting</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Läuft auf praktisch jedem Standard-Webspace (Apache, Nginx, cPanel) ohne aufwändige Node- oder .NET-Server.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>PDO Prepared Statements:</strong> 100% Schutz vor SQL-Injection Angriffsvektoren.</li>
              <li>• <strong>Zero Config Hosting:</strong> Einfach per FTP hochladen und sofort loslegen.</li>
              <li>• <strong>JSON REST API:</strong> Nahtlose Kommunikation mit Frontend &amp; mobilen Clients.</li>
            </ul>
          </div>
        </div>

        {/* 6. Frontend: React, Angular & SDUI */}
        <div className="bg-[#242424] border border-[#3a3a3a] rounded-xl p-4.5 flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Layers size={20} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                React &amp; Angular
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">React, Angular &amp; SDUI Engine</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generiert saubere Single-Page-Apps mit Tailwind CSS, interaktiven Komponenten und dynamischem JSON-Rendering.
            </p>
            <ul className="text-[11px] text-neutral-400 space-y-1 pt-1 border-t border-[#333333]">
              <li>• <strong>Kein Vendor Lock-in:</strong> Echter, lesbarer Quellcode ohne proprietäre Laufzeitbibliotheken.</li>
              <li>• <strong>Dark- &amp; Light-Mode:</strong> Vollständiges Theming für alle Widgets und Dashboards.</li>
              <li>• <strong>Responsive Layouts:</strong> Automatische Optimierung für Desktop, Tablet und Mobilgeräte.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
