import React from 'react';
import { 
  Database, 
  FormInput, 
  Filter, 
  Printer, 
  LayoutDashboard, 
  Code2, 
  ShieldCheck, 
  TableProperties,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface FeatureCapabilitiesGridProps {
  onNavigateAction?: (target: 'table_create' | 'query_designer' | 'create_report' | 'create_form') => void;
}

export const FeatureCapabilitiesGrid: React.FC<FeatureCapabilitiesGridProps> = ({ onNavigateAction }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <TableProperties className="text-indigo-400" size={20} /> Was kann man mit DB Studio alles machen?
        </h2>
        <p className="text-xs text-neutral-400">
          Vom einfachen Adressverzeichnis bis zur komplexen ERP- &amp; Baustellen-Management-Software – DB Studio deckt den gesamten Lebenszyklus ab:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Datenbank- & Tabellenentwurf */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <Database size={17} /> 1. Datenmodell &amp; Tabellen
            </div>
            <h3 className="text-sm font-bold text-white">Visueller Tabellen- &amp; Schema-Designer</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Erstellen Sie relationale Tabellen wie in MS Access oder SQL Server. Definieren Sie Spaltentypen, Pflichtfelder, Standardwerte und 1:n-Beziehungen mit Fremdschlüsseln.
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• AutoWert-Primärschlüssel &amp; Datentyp-Validierung</div>
              <div>• Integrierter Mock-Daten-Generator (10–500 Datensätze)</div>
              <div>• CSV- &amp; Excel-Import/Export per Klick</div>
            </div>
          </div>
          {onNavigateAction && (
            <button
              onClick={() => onNavigateAction('table_create')}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-[#303030] hover:bg-orange-600/20 hover:text-orange-300 text-xs font-semibold text-neutral-200 border border-[#444444] transition-all flex items-center justify-center gap-1.5"
            >
              Tabelle entwerfen <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 2. Drag-&-Drop Formular-Studio */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <FormInput size={17} /> 2. Formular-Studio &amp; RBAC
            </div>
            <h3 className="text-sm font-bold text-white">Eingabemasken mit Rollensicherheit</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Gestalten Sie benutzerfreundliche Formulare mit 1–4 Spalten, Subformularen, Lookup-Dropdowns und feldspezifischen Rollenrechten (Admin, Sachbearbeiter, Gast).
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• Automatische Berechnungsformeln (z.B. Brutto = Netto * 1.19)</div>
              <div>• Lookup-Werte aus verknüpften Nachschlagetabellen</div>
              <div>• Vollständiger Dark- &amp; Light-Mode Support</div>
            </div>
          </div>
          {onNavigateAction && (
            <button
              onClick={() => onNavigateAction('create_form')}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-[#303030] hover:bg-indigo-600/20 hover:text-indigo-300 text-xs font-semibold text-neutral-200 border border-[#444444] transition-all flex items-center justify-center gap-1.5"
            >
              Formular erstellen <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 3. Visueller SQL- & Abfrage-Designer */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Filter size={17} /> 3. SQL &amp; Abfragen
            </div>
            <h3 className="text-sm font-bold text-white">Visuelle Abfragen &amp; Sichten</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Verknüpfen Sie mehrere Tabellen per JOIN, setzen Sie dynamische Filter, Sortierungen und Aggregationen (SUM, AVG, COUNT) ohne manuelle SQL-Befehle schreiben zu müssen.
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• Visueller Kriterien-Raster wie im Access Abfrageentwurf</div>
              <div>• Live SQL-Syntax-Vorschau (SELECT ... WHERE)</div>
              <div>• Sofortige Datenblatt-Vorschau in Echtzeit</div>
            </div>
          </div>
          {onNavigateAction && (
            <button
              onClick={() => onNavigateAction('query_designer')}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-[#303030] hover:bg-cyan-600/20 hover:text-cyan-300 text-xs font-semibold text-neutral-200 border border-[#444444] transition-all flex items-center justify-center gap-1.5"
            >
              Abfrage gestalten <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 4. Berichte & Rechnungsdruck */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Printer size={17} /> 4. Berichte &amp; Rechnungen
            </div>
            <h3 className="text-sm font-bold text-white">Druckreife PDF- &amp; Dokumenten-Engine</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Erstellen Sie Angebote, Rechnungen, Lieferscheine oder tabellarische Bestandsberichte mit Kopf-, Detail- und Fußzeilen sowie automatischen Zwischensummen.
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• Vorlagen für Rechnungen, Inventarlisten &amp; Adressetiketten</div>
              <div>• 1-Klick Druckansicht &amp; A4-Seitenumbruch</div>
              <div>• Automatische Währungs- &amp; Datumsformatierung</div>
            </div>
          </div>
          {onNavigateAction && (
            <button
              onClick={() => onNavigateAction('create_report')}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-[#303030] hover:bg-emerald-600/20 hover:text-emerald-300 text-xs font-semibold text-neutral-200 border border-[#444444] transition-all flex items-center justify-center gap-1.5"
            >
              Bericht anlegen <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 5. SDUI Pages, Dashboards & Kanban */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <LayoutDashboard size={17} /> 5. Pages &amp; Dashboards
            </div>
            <h3 className="text-sm font-bold text-white">Server-Driven UI (SDUI) &amp; Kanban</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Bauen Sie frei konfigurierbare Dashboards mit interaktiven Kanban-Boards, Terminkalendern, KPI-Statistikkarten und Diagrammen für maximale Übersicht.
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• Drag-&amp;-Drop Aufgabenverschiebung in Kanban-Spalten</div>
              <div>• Visuelle Filterung nach Status, Benutzer oder Priorität</div>
              <div>• Live KPI-Metriken (Umsatz, offene Posten, Durchlaufzeit)</div>
            </div>
          </div>
          <div className="w-full py-2 px-3 rounded-lg bg-[#1c1c1c] text-xs font-semibold text-purple-300 border border-purple-900/40 text-center">
            Integrierter SDUI Page Builder
          </div>
        </div>

        {/* 6. Multi-Target Code-Export */}
        <div className="bg-[#242424] border border-[#383838] rounded-xl p-4.5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Code2 size={17} /> 6. Code-Generierung
            </div>
            <h3 className="text-sm font-bold text-white">100% Echter, kompilierbarer Quellcode</h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Generieren Sie auf Knopfdruck vollständige, deploybare Anwendungen. Kein proprietärer Viewer nötig – der Code gehört zu 100% Ihnen.
            </p>
            <div className="bg-[#1c1c1c] p-2.5 rounded-lg border border-[#333333] space-y-1 text-[11px] text-neutral-400">
              <div className="text-neutral-200 font-medium">Highlights:</div>
              <div>• C# ASP.NET Core (.NET 10) &amp; Node.js Express APIs</div>
              <div>• React &amp; Angular SPA Frontends mit Tailwind CSS</div>
              <div>• PHP 8.x PDO Backend für universelles Webhosting</div>
            </div>
          </div>
          <div className="w-full py-2 px-3 rounded-lg bg-[#1c1c1c] text-xs font-semibold text-amber-300 border border-amber-900/40 text-center">
            Code-Export über Backstage &amp; Export-Menü
          </div>
        </div>
      </div>
    </div>
  );
};
