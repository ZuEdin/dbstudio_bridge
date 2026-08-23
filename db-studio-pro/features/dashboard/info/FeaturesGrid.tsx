import React from 'react';
import { Database, Sparkles, Terminal, Layout, FileSpreadsheet, Zap, Code, Users, ClipboardList, Monitor, TableProperties, FileUp, RefreshCw, Layers } from 'lucide-react';

export const FeaturesGrid: React.FC = () => {
  return (
    <div className="bg-white py-20 px-6 border-b border-slate-200" id="features-grid-container">
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Leistungsumfang &amp; Module
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-950 mt-3 mb-4 tracking-tight">
            Alles, was Sie für vollwertige Datenbank-Anwendungen brauchen
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            DB Studio Pro vereint Tabellenarchitektur, intuitive Benutzeroberflächen, Druckberichte und echte Full-Stack-Codegenerierung in einem einzigen, kohärenten Werkzeug.
          </p>
        </div>

        <div className="space-y-12">
          
          {/* Pillar 1: Datenarchitektur & Modellierung */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Database size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">1. Datenarchitektur</h3>
              </div>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Das Fundament jeder robusten Applikation. Entwerfen Sie Schemata visuell oder lassen Sie sich durch den integrierten KI-Assistenten unterstützen.
              </p>
            </div>
            
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors" id="feat-erd">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database size={16} className="text-blue-600" />
                  <span>ERD &amp; Relationales Design</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Modellieren Sie Tabellen und Verknüpfungen (1:n, n:m) interaktiv per Drag &amp; Drop. Fremdschlüssel, Indizes und Kaskadierungen werden automatisch synchronisiert.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-colors" id="feat-table-designer">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TableProperties size={16} className="text-amber-600" />
                  <span>Tabellenentwurf &amp; Formeln</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Mit berechneten Spalten (z. B. <code className="bg-slate-200 px-1 rounded text-[10px] font-mono">[Preis]*[Menge]</code>), Nummernkreisen (<code className="bg-slate-200 px-1 rounded text-[10px] font-mono">LIF-00010</code>) und interaktivem ENUM-Manager.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors" id="feat-query">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Terminal size={16} className="text-indigo-600" />
                  <span>Visueller Abfrage-Designer</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Abfragen visuell zusammenstellen mit Joins, Aggregationen, Live-SQL-Vorschau und sofortiger Datenblatt-Ausführung.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-colors" id="feat-ai">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-600" />
                  <span>KI-Schema-Assistent</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Beschreiben Sie Ihre Fachlogik in natürlicher Sprache. Der KI-Assistent erstellt fertige Tabellen samt Feldern, Typen und Verknüpfungen.
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 2: UI-Builder, Formulare & Druckberichte */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Layout size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">2. UI-Builder &amp; Berichte</h3>
              </div>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Bringen Sie Daten auf den Bildschirm und ins Dokument. Erstellen Sie intuitive Benutzeroberflächen und druckfertige Dokumente ohne Programmierung.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-colors" id="feat-forms">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layout size={16} className="text-emerald-600" />
                  <span>Formular-Designer</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Eingabemasken mit Drag &amp; Drop erstellen. Inklusive Markdown-Editor, Lookup-Dropdowns, Unterformularen (Subforms) und Validierungsregeln.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-purple-300 transition-colors" id="feat-reports">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-purple-600" />
                  <span>Berichts- &amp; PDF-Drucker</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Druckfertige Berichte und Rechnungen generieren: Gruppierungen, Zwischensummen, Kopf-/Fußzeilen und Live-Vorschau im Browser.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-amber-300 transition-colors" id="feat-workflows">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  <span>Makros &amp; Workflows</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Automatisieren Sie Geschäftsabläufe mit visuellen Trigger-Aktionen: Datensätze erstellen, Werte aktualisieren, E-Mails vorbereiten oder Dialoge öffnen.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors" id="feat-excel">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileUp size={16} className="text-blue-600" />
                  <span>Intelligenter Excel-Import</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Mehrere Mappenblätter auswählen, automatische Erkennung von ENUM-Auswahllisten und KI-gestützte SVERWEIS-Beziehungsvorschläge.
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 3: Full-Stack Code-Export & Offline-Sync */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start border-t border-slate-100 pt-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Code size={20} />
                </div>
                <h3 className="font-bold text-lg text-slate-900">3. Full-Stack Code-Export</h3>
              </div>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
                Der Clou: Sie sind niemals in DB Studio Pro gefangen. Exportieren Sie mit 1 Klick echten Quellcode für Ihr Lieblings-Ökosystem.
              </p>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 transition-colors" id="feat-react-angular">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Layers size={16} className="text-indigo-600" />
                  <span>React 18+ &amp; Angular 19+ Frontends</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Moderne Single-Page-Apps mit TypeScript, Tailwind CSS, Signals, Reactive Forms und Markdown-Editor-Unterstützung.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors" id="feat-dotnet-php">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Code size={16} className="text-blue-600" />
                  <span>.NET 8/9 C# &amp; PHP / Laravel Backends</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Produktionsreife REST-APIs, Entity Framework Core / Eloquent ORM Modelle, Validierungen und Controller auf Enterprise-Niveau.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-emerald-300 transition-colors" id="feat-offline-sync">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <RefreshCw size={16} className="text-emerald-600" />
                  <span>Offline-First Sync Engine</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Lokale SQLite/IndexedDB mit automatischem Delta-Push/Pull gegen den generierten SyncController (.NET C# oder PHP) für unterbrechungsfreies Arbeiten.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-purple-300 transition-colors" id="feat-desktop">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Monitor size={16} className="text-purple-600" />
                  <span>Tauri (Rust) &amp; Electron Desktop</span>
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Native Desktop-Installationsdateien für Windows, macOS und Linux mit minimalem Speicher-Footprint und nativer Dateisystem-Integration.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
