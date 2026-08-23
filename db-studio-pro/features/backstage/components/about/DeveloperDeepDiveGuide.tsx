import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Code2, 
  Layers, 
  Database, 
  FileCode, 
  Copy, 
  Check, 
  HelpCircle, 
  FileText,
  FolderTree,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const DeveloperDeepDiveGuide: React.FC = () => {
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const schemaExampleJson = `{
  "projectId": "crm_demo_app",
  "name": "Kunden & Auftragsverwaltung",
  "tables": [
    {
      "id": "tbl_customers",
      "name": "Kunden",
      "fields": [
        { "name": "id", "type": "number", "isPrimaryKey": true, "isAutoIncrement": true },
        { "name": "firma", "type": "text", "isRequired": true },
        { "name": "email", "type": "email", "isRequired": true },
        { "name": "status", "type": "text", "defaultValue": "Aktiv" }
      ]
    },
    {
      "id": "tbl_orders",
      "name": "Auftraege",
      "fields": [
        { "name": "id", "type": "number", "isPrimaryKey": true, "isAutoIncrement": true },
        { "name": "kundenId", "type": "number", "isForeignKey": true, "foreignTable": "tbl_customers" },
        { "name": "betragNetto", "type": "number" },
        { "name": "bestelldatum", "type": "date" }
      ]
    }
  ]
}`;

  const nodeRunCommand = `# 1. Exportiertes ZIP-Archiv entpacken
unzip mein_db_studio_projekt.zip
cd mein_db_studio_projekt

# 2. Abhängigkeiten installieren
npm install

# 3. MySQL / SQLite DDL Skript in deine Datenbank importieren
mysql -u root -p meine_db < database/schema.sql

# 4. Backend-Server starten
npm run dev`;

  const dotnetRunCommand = `# 1. Im Backend-Verzeichnis
cd backend_dotnet

# 2. .NET Tools wiederherstellen und kompilieren
dotnet restore
dotnet build

# 3. Datenbank-Migrations oder DDL anwenden
dotnet run`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="text-indigo-400" size={20} /> Entwickler-Handbuch &amp; Praktischer Einstieg
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Praktische Schritt-für-Schritt-Anleitungen, Codebeispiele und Workflows: Nutzen Sie DB Studio für <strong>schnelles Prototyping mit Zero-Setup</strong> – und überführen Sie den exportierten Code nahtlos in Ihre bestehende Entwicklungsumgebung.
        </p>
      </div>

      {/* 4 Step Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4 space-y-2 relative">
          <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 flex items-center justify-center text-xs font-bold">1</span>
          <h3 className="text-xs font-bold text-white">Datenmodell entwerfen</h3>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Erstelle Tabellen, definiere Primär- und Fremdschlüssel (1:n) und generiere Testdatensätze.
          </p>
        </div>

        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4 space-y-2 relative">
          <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 flex items-center justify-center text-xs font-bold">2</span>
          <h3 className="text-xs font-bold text-white">UI &amp; Formulare bauen</h3>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Platziere Felder im Drag-&amp;-Drop Designer, vergebe Berechnungsformeln und setze Rollenrechte.
          </p>
        </div>

        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4 space-y-2 relative">
          <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 flex items-center justify-center text-xs font-bold">3</span>
          <h3 className="text-xs font-bold text-white">Code exportieren (ZIP)</h3>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Wähle dein Zielsystem (.NET 10, Express, PHP, React, Angular) und lade das fertige Projekt herunter.
          </p>
        </div>

        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4 space-y-2 relative">
          <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 flex items-center justify-center text-xs font-bold">4</span>
          <h3 className="text-xs font-bold text-white">Lokal starten &amp; erweitern</h3>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Führe `npm install` oder `dotnet run` aus. Der Code ist 100% sauberer Standard-Code ohne Lock-in.
          </p>
        </div>
      </div>

      {/* Code / JSON Metamodel Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON Metamodel */}
        <div className="bg-[#242424] border border-[#383838] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <FileCode size={16} /> Das JSON-Metamodell verstehen
              </div>
              <button 
                onClick={() => copyToClipboard(schemaExampleJson, 'schema_json')}
                className="px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-[11px] text-neutral-300 flex items-center gap-1 transition-colors"
              >
                {copiedSnippet === 'schema_json' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copiedSnippet === 'schema_json' ? 'Kopiert' : 'JSON kopieren'}
              </button>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Jedes DB Studio Projekt wird als deklaratives JSON gespeichert. Dies ermöglicht automatische Versionierung, Backups und einfache CI/CD-Pipelines.
            </p>
            <pre className="bg-[#181818] p-3 rounded-xl border border-[#333333] text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
              {schemaExampleJson}
            </pre>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-[#333333]">
            💡 <strong>Tipp:</strong> Sie können Projekte im Menü <em>Datei -&gt; Export</em> jederzeit als JSON sichern oder in ein anderes System importieren.
          </div>
        </div>

        {/* Project Folder Structure */}
        <div className="bg-[#242424] border border-[#383838] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <FolderTree size={16} /> Aufbau des exportierten ZIP-Projekts
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Wenn Sie ein Projekt für Node.js + React exportieren, erhalten Sie eine saubere, standardkonforme Verzeichnisstruktur:
            </p>
            <div className="bg-[#181818] p-3 rounded-xl border border-[#333333] text-[11px] font-mono text-neutral-300 space-y-1">
              <div className="text-indigo-300 font-bold">📁 mein_projekt/</div>
              <div className="pl-4 text-neutral-400">├── 📁 src/</div>
              <div className="pl-8 text-neutral-300">├── 📁 components/ <span className="text-neutral-500">(Generierte Formulare &amp; Tabellen)</span></div>
              <div className="pl-8 text-neutral-300">├── 📁 pages/ <span className="text-neutral-500">(Routen &amp; Dashboards)</span></div>
              <div className="pl-8 text-neutral-300">└── 📄 App.tsx</div>
              <div className="pl-4 text-neutral-400">├── 📁 backend/</div>
              <div className="pl-8 text-neutral-300">├── 📁 routes/ <span className="text-neutral-500">(REST API Endpunkte je Tabelle)</span></div>
              <div className="pl-8 text-neutral-300">├── 📁 db/ <span className="text-neutral-500">(SQL DDL &amp; Verbindungs-Pool)</span></div>
              <div className="pl-8 text-neutral-300">└── 📄 server.ts <span className="text-neutral-500">(Express Server)</span></div>
              <div className="pl-4 text-neutral-400">├── 📄 package.json</div>
              <div className="pl-4 text-neutral-400">└── 📄 README.md</div>
            </div>
          </div>
          <div className="text-[11px] text-neutral-400 pt-2 border-t border-[#333333]">
            🚀 <strong>Keine versteckten Runtimes:</strong> Der Code lässt sich direkt in VS Code, Rider oder WebStorm öffnen.
          </div>
        </div>
      </div>

      {/* Terminal Command Quickstart */}
      <div className="bg-[#222222] border border-[#383838] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Terminal size={16} /> Schnellstart im Terminal nach dem ZIP-Export
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-200 flex items-center justify-between">
              <span>Node.js / Express &amp; React Stack</span>
              <button
                onClick={() => copyToClipboard(nodeRunCommand, 'node_cmd')}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                {copiedSnippet === 'node_cmd' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} Kopieren
              </button>
            </div>
            <pre className="bg-[#181818] p-3 rounded-xl border border-[#333333] text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
              {nodeRunCommand}
            </pre>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-200 flex items-center justify-between">
              <span>C# / ASP.NET Core (.NET 10) Stack</span>
              <button
                onClick={() => copyToClipboard(dotnetRunCommand, 'dotnet_cmd')}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                {copiedSnippet === 'dotnet_cmd' ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />} Kopieren
              </button>
            </div>
            <pre className="bg-[#181818] p-3 rounded-xl border border-[#333333] text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
              {dotnetRunCommand}
            </pre>
          </div>
        </div>
      </div>

      {/* FAQ & Power-User Insights */}
      <div className="bg-[#242424] border border-[#383838] rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lightbulb className="text-amber-400" size={17} /> Häufige Fragen &amp; Entwickler-Tipps (FAQ)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-neutral-300">
          <div className="p-3.5 rounded-xl bg-[#1d1d1d] border border-[#333333] space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">Q:</span> Kann ich meine eigene Datenbank anbinden?
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ja. Exportieren Sie das generierte Backend (z.B. Node.js oder .NET). In der Datei <code className="text-neutral-200 bg-[#141414] px-1 py-0.5 rounded">.env</code> oder <code className="text-neutral-200 bg-[#141414] px-1 py-0.5 rounded">appsettings.json</code> tragen Sie Ihren Connection-String zu Ihrer MySQL-, MariaDB- oder PostgreSQL-Instanz ein.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1d1d1d] border border-[#333333] space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">Q:</span> Wie binde ich Tauri für eine Desktop `.exe` ein?
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Das exportierte Frontend enthält bereits ein <code className="text-neutral-200 bg-[#141414] px-1 py-0.5 rounded">src-tauri</code> Verzeichnis. Führen Sie im Projektverzeichnis einfach <code className="text-neutral-200 bg-[#141414] px-1 py-0.5 rounded">cargo tauri build</code> aus, um ein natives Windows-Setup oder macOS DMG zu kompilieren.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1d1d1d] border border-[#333333] space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">Q:</span> Werden benutzerdefinierte Validierungen unterstützt?
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ja. Im Tabellendesigner können Sie Pflichtfelder, Grenzwerte (Min/Max), reguläre Ausdrücke (RegEx) und Auto-Inkremente konfigurieren, die sowohl im Formular-UI als auch im generierten Backend validiert werden.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#1d1d1d] border border-[#333333] space-y-1.5">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span className="text-indigo-400">Q:</span> Kann ich den Code nach dem Export manuell verändern?
            </h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Absolut. Der exportierte Code ist sauberer, modularer TypeScript/C#-Code mit getrennten Layern (Controller, Service, DB-Access). Sie können problemlos eigene Endpunkte, Middleware oder Business-Logik ergänzen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
