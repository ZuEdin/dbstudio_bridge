import React from 'react';
import { Users, ClipboardList, Monitor, Search, Check } from 'lucide-react';

export const LiveCollaborationSection: React.FC = () => {
  return (
    <div className="bg-slate-50 py-16 px-6 border-b border-slate-200" id="live-collaboration-section">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
            Zusammenarbeit & Produktivität
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3">
            Entwickelt für agile, produktive Teams
          </h2>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto mt-3">
            DB Studio Pro ist mehr als ein Solo-Werkzeug. Es bietet integrierte Funktionen für Team-Kollaboration und Höchstgeschwindigkeit im Entwicklungs-Alltag.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Collaboration Box */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4" id="collab-box-info">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Live-Kollaboration in Echtzeit</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Arbeiten Sie mit Ihren Kollegen gleichzeitig am selben Datenmodell. Die integrierte Collaboration Bar zeigt an, welche Teammitglieder gerade online sind und an welchen Tabellen sie arbeiten.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Präsenzanzeige</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Sofort-Synchronisation</span>
              </div>
            </div>
          </div>

          {/* Kanban Ticket-Board Box */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4" id="kanban-box-info">
            <div className="p-3 bg-red-50 text-red-500 rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Integriertes Kanban Ticket-Board</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Verwalten Sie Entwicklungsaufgaben, Feature-Wünsche und Schema-Anpassungen direkt in DB Studio. Ein vollwertiges Ticket-Board ermöglicht schnelles Verschieben von Aufgaben per Drag & Drop.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Drag & Drop</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Integrierte Workflows</span>
              </div>
            </div>
          </div>

          {/* Virtual High-Performance Table Grid */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4" id="virtual-grid-info">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Monitor size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Hochleistungs-Datengitter (Virtual Grid)</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Das Datengitter nutzt eine hochoptimierte Virtualisierungs-Engine. Bearbeiten Sie Tausende von Zeilen direkt per Inline-Editing, sortieren und filtern Sie ohne spürbare Ladezeiten.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Inline-Edit</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Sub-Millisekunden Render</span>
              </div>
            </div>
          </div>

          {/* Command Palette (Ctrl+K) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4" id="command-palette-info">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 h-12 w-12 flex items-center justify-center">
              <Search size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Globale Tastatur-Suchkonsole</h3>
              <p className="text-slate-600 text-xs leading-relaxed mb-4">
                Steuern Sie die gesamte Anwendung blitzschnell mit Ihrer Tastatur. Drücken Sie einfach <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 font-mono text-xs">Strg + K</kbd>, um nach Tabellen zu suchen, Makros auszuführen oder Sichten zu wechseln.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Keyboard Shortcuts</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Mausfreie Bedienung</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
