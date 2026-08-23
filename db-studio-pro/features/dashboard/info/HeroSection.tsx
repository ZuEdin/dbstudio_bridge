import React from 'react';
import { Rocket, Code, Sparkles, Database, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (view: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <div className="bg-slate-950 text-white pt-16 pb-20 px-6 relative overflow-hidden border-b border-slate-800" id="hero-section">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <Database size={600} className="text-blue-200" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-bold">
            <Sparkles size={12} className="animate-pulse text-amber-400" />
            <span>Der moderne MS Access Nachfolger</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-full text-xs font-bold">
            <Layers size={12} className="text-blue-400" />
            <span>Full-Stack Generator: React &amp; Angular + .NET &amp; PHP</span>
          </div>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-5 tracking-tight leading-tight max-w-4xl text-white">
          Visuell modellieren. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300">
            Per Klick als vollwertigen Code exportieren.
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-lg text-slate-300 max-w-3xl mb-8 leading-relaxed font-normal">
          <strong>DB Studio Pro</strong> vereint die blitzschnelle Produktivität visueller Desktop-Datenbanken mit modernster Software-Architektur. Entwerfen Sie Tabellen, Relationen, Formulare und Workflows – und generieren Sie saubere, produktionsreife Web- und Desktop-Anwendungen <strong>ohne Vendor-Lock-in</strong>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          <button
            onClick={() => onNavigate('create_table')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-lg shadow-blue-900/30 hover:scale-[1.02]"
            id="btn-start-designer"
          >
            <Rocket size={17} />
            <span>Tabellen-Designer starten</span>
          </button>
          
          <button
            onClick={() => onNavigate('backend_generate')}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm hover:scale-[1.02]"
            id="btn-open-blueprints"
          >
            <Code size={17} className="text-indigo-400" />
            <span>Full-Stack Code-Center öffnen</span>
          </button>
        </div>

        {/* Trust & Feature Checklist */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>100% Quellcode-Eigentum</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>Zero Vendor-Lock-in</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>Tauri &amp; SQLite Offline-Sync</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>Lokale IndexedDB-Sicherheit</span>
          </div>
        </div>

      </div>
    </div>
  );
};
