import React from 'react';
import { 
  Cpu, 
  Database, 
  Code2, 
  FileJson, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive,
  Terminal
} from 'lucide-react';

export const HonestArchitectureOverview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="text-indigo-400" size={20} /> Technische Realität: Wie DB Studio intern funktioniert
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Transparenz ohne Marketing-Floskeln: DB Studio Pro ist eine hochgradig modulare Single-Page-Applikation (SPA) auf Basis von React 18, TypeScript, Tailwind CSS und Zustand.
        </p>
      </div>

      {/* Core Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Client-Side Metamodel */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <FileJson size={16} /> 1. JSON-Metamodell
          </div>
          <h3 className="text-sm font-bold text-white">Zentrales Schema als JSON</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Sämtliche Tabellenstrukturen, Spaltendefinitionen, Relationen, Formularlayouts, Abfragen und Berichte werden in einem einheitlichen, serialisierbaren <strong>JSON-Datenmodell</strong> verwaltet.
          </p>
          <div className="text-[11px] text-neutral-400 bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1">
            <div>• Kein proprietäres Binärformat (.accdb/.mdb)</div>
            <div>• Vollständig versionskompatibel und exportierbar</div>
            <div>• Zustand-Store mit LocalStorage / IndexedDB Sync</div>
          </div>
        </div>

        {/* 2. In-Memory Relational Engine */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
            <Database size={16} /> 2. Lokale Relationale Engine
          </div>
          <h3 className="text-sm font-bold text-white">Clientseitige Datenhaltung</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Im Browser läuft eine JavaScript/TypeScript-Engine, die relationale Integrität (Primärschlüssel, Foreign Keys, 1:n Kaskaden, AutoWert-Inkremente und Filter) zur Entwurfszeit direkt im Speicher simuliert.
          </p>
          <div className="text-[11px] text-neutral-400 bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1">
            <div>• Schnelle, latenzfreie Vorschau aller Daten</div>
            <div>• Integrierter Mock-Datengenerator</div>
            <div>• Daten bleiben lokal im Browser des Nutzers</div>
          </div>
        </div>

        {/* 3. Deterministic Code Generators */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Code2 size={16} /> 3. Code-Generatoren
          </div>
          <h3 className="text-sm font-bold text-white">AST- &amp; String-Templating</h3>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Spezifische Generator-Module übersetzen das JSON-Metamodell in echten, sauberen Quellcode für Backends (C#, Express, PHP) und Frontends (React, Angular) inklusive SQL-DDL-Skripten.
          </p>
          <div className="text-[11px] text-neutral-400 bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1">
            <div>• Echter Quellcode, kein verschlüsselter Bytecode</div>
            <div>• ZIP-Export mit fertiger Ordnerstruktur</div>
            <div>• Vollständig außerhalb von DB Studio kompilierbar</div>
          </div>
        </div>
      </div>

      {/* Honest Summary Callout */}
      <div className="bg-[#222222] border border-[#3a3a3a] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle size={16} /> Was bedeutet das in der Praxis?
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          DB Studio ist <strong>kein installierter Datenbankserver</strong> und <strong>kein schwerfälliges Full-Development-Tool</strong>, das ein stundenlanges Setup erfordert. Es ist ein <strong>visuelles Rapid-Prototyping-Werkzeug</strong>: Sie erstellen in kürzester Zeit ein klickbares, relationales Modell zur Präsentation (für Kunden, Fachabteilungen oder das Team) – und exportieren bei Bedarf sauberen Standard-Quellcode (.NET, Express, PHP, React, Angular) als solides Fundament für die spätere Full-Scale-Entwicklung.
        </p>
      </div>
    </div>
  );
};
