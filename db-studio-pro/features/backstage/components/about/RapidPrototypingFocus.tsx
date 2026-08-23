import React from 'react';
import { 
  Zap, 
  Rocket, 
  Clock, 
  Presentation, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Code2, 
  Users, 
  FolderKanban,
  Target,
  ArrowRight
} from 'lucide-react';

export const RapidPrototypingFocus: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* High-Impact Rapid Prototyping Hero Box */}
      <div className="bg-gradient-to-r from-amber-950/40 via-[#27241e] to-[#1e1e1e] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
            <Rocket size={13} className="text-amber-400" /> Kernphilosophie: Rapid Prototyping &amp; Zero Setup
          </span>
          <span className="text-xs text-neutral-500">|</span>
          <span className="text-xs text-neutral-300 font-medium">
            Entworfen für Schnelligkeit, Präsentationen und minimale Einrichtungszeit
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Zap className="text-amber-400" size={24} /> Blitzschnell präsentieren statt tagelang Setup konfigurieren
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">
            DB Studio ist <strong>keine schwerfällige Enterprise-Entwicklungsumgebung</strong>, bei der man erst Stunden mit Docker-Containern, Datenbank-Treibern, Portweiterleitungen und Build-Pipelines verbringt. Es ist ein <strong>hochproduktives RAD-Werkzeug für schnelles Prototyping</strong>: Sie modellieren Fachanwendungen in Minuten, führen sie sofort live vor und exportieren am Ende echten Quellcode als sauberes Fundament.
          </p>
        </div>

        {/* 3 Core Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#1b1b1b]/80 border border-[#383838] p-4 rounded-xl space-y-2">
            <div className="text-amber-400 font-bold text-xs flex items-center gap-2">
              <Clock size={16} /> 1. In 30 Min. zum klickbaren MVP
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Kunde, Chef oder Team wollen morgen ein funktionierendes System sehen? Tabellen anlegen, Formulare per Drag-&-Drop gestalten, Beispieldaten generieren – fertig.
            </p>
          </div>

          <div className="bg-[#1b1b1b]/80 border border-[#383838] p-4 rounded-xl space-y-2">
            <div className="text-indigo-400 font-bold text-xs flex items-center gap-2">
              <Presentation size={16} /> 2. Null Setup-Aufwand (Zero Setup)
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Läuft direkt im Browser. Keine lokalen Datenbank-Dienste starten, keine Node/Python-Versionen verwalten. URL öffnen und sofort interaktiv loslegen.
            </p>
          </div>

          <div className="bg-[#1b1b1b]/80 border border-[#383838] p-4 rounded-xl space-y-2">
            <div className="text-emerald-400 font-bold text-xs flex items-center gap-2">
              <Code2 size={16} /> 3. Kein Wegwerf-Prototyp
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Anders als reine Grafik-Mockups (wie Figma) enthält DB Studio echte Datenstrukturen und exportiert 100% sauberen C#-, Node.js-, PHP- oder React-Code.
            </p>
          </div>
        </div>
      </div>

      {/* Comparison: Rapid Prototyping vs. Full Heavy Development */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Why DB Studio for Prototyping */}
        <div className="bg-[#242424] border border-emerald-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm pb-2 border-b border-emerald-950">
            <CheckCircle2 size={18} /> Wo DB Studio die perfekte Lösung ist (Use Cases)
          </div>
          <div className="space-y-3 text-xs text-neutral-300">
            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <Users size={14} className="text-emerald-400" /> Kunden- &amp; Stakeholder-Präsentationen
              </div>
              <p className="text-[11px] text-neutral-400">
                Sie können Fachkonzepte (CRM, Zeiterfassung, Rechnungen) live im Meeting mit Fachabteilungen anpassen und direkt ausprobieren.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <FolderKanban size={14} className="text-emerald-400" /> Machbarkeitsstudien &amp; MVPs
              </div>
              <p className="text-[11px] text-neutral-400">
                Validieren Sie Geschäftslogik, Datenbeziehungen (1:n) und Rollenrechte in Stunden statt in Wochen Entwicklungszeit.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <Rocket size={14} className="text-emerald-400" /> Die ersten 70% der Anwendungsentwicklung
              </div>
              <p className="text-[11px] text-neutral-400">
                Standard-CRUD, Formular-Layouts, SQL-DDL-Skripte und REST-Controller werden automatisch generiert – spart mühsame Fleißarbeit.
              </p>
            </div>
          </div>
        </div>

        {/* What DB Studio is NOT trying to be */}
        <div className="bg-[#242424] border border-amber-900/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pb-2 border-b border-amber-950">
            <Target size={18} /> Was DB Studio bewusst NICHT ist (Grenzen &amp; Realismus)
          </div>
          <div className="space-y-3 text-xs text-neutral-300">
            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <XCircle size={14} className="text-amber-400" /> Kein 100% "Fertig-auf-Anschlag" Produktiv-Deployment
              </div>
              <p className="text-[11px] text-neutral-400">
                DB Studio ersetzt nicht die finale Feinabstimmung von Produktions-Sicherheit, Microservice-Orchestrierung oder spezifische Edge-Case-Logik.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <XCircle size={14} className="text-amber-400" /> Kein geschlossenes All-in-One Backend-Hosting
              </div>
              <p className="text-[11px] text-neutral-400">
                Sie betreiben die Anwendung nach dem Export auf Ihrer eigenen Infrastruktur (.NET Server, Node Container, Apache/PHP Webspace) ohne Monatsgebühr.
              </p>
            </div>

            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-[#333333] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <XCircle size={14} className="text-amber-400" /> Kein Ersatz für Custom-Code
              </div>
              <p className="text-[11px] text-neutral-400">
                Komplexe Business-Algorithmen oder Third-Party-APIs (Stripe, SAP) werden nach dem ZIP-Export direkt im generierten Code weiterentwickelt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
