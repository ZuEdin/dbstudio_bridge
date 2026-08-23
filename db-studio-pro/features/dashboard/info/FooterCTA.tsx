import React from 'react';
import { GitBranch, Mail, MapPin, Database } from 'lucide-react';

interface FooterCTAProps {
  onNavigate: (view: string) => void;
}

export const FooterCTA: React.FC<FooterCTAProps> = ({ onNavigate }) => {
  return (
    <div id="footer-cta-container">
      {/* Footer CTA */}
      <div className="bg-slate-900 text-white py-16 px-6 text-center border-b border-slate-950">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Bereit, Zeit zu sparen?</h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
          Starten Sie jetzt mit DB Studio Pro Version 1.0. Vom ersten visuellen Entwurf über lauffähige UI-Eingaben bis hin zur fertigen App-Struktur in unter 5 Minuten.
        </p>
        <button
          onClick={() => onNavigate('create_table')}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold shadow-sm transition-transform hover:scale-105 text-sm"
          id="btn-cta-create"
        >
          <GitBranch size={16} />
          <span>Jetzt ersten Entwurf anlegen</span>
        </button>
      </div>

      {/* Contact & Imprint Section */}
      <div className="bg-slate-950 text-slate-400 py-12 text-xs" id="imprint-section">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-blue-500" />
              <span className="font-bold text-slate-200 text-sm">DB Studio Pro</span>
            </div>
            <p className="max-w-xs text-slate-500 leading-relaxed text-[11px]">
              Die professionelle Komplettlösung für schnelles Datenmodellierungs-Prototyping und native Anwendungsgenerierungen.
              Entworfen mit modernsten Blueprints.
            </p>
          </div>
          
          <div className="text-left md:text-right">
            <h4 className="font-bold text-slate-200 mb-1.5 uppercase tracking-wider text-[10px]">Kontakt &amp; Impressum</h4>
            <p className="font-medium text-slate-300">Edin Zubovic</p>
            <p className="flex items-center md:justify-end gap-1 text-slate-500 mt-0.5"><MapPin size={11} /> Birkenstraße 23, 4600 Wels</p>
            <a
              href="mailto:edin.zubovic@hotmail.de"
              className="flex items-center md:justify-end gap-1 text-blue-400 hover:text-blue-300 mt-1.5 transition-colors"
            >
              <Mail size={12} />
              <span>edin.zubovic@hotmail.de</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
