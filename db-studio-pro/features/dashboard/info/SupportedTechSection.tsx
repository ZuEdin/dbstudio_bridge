import React from 'react';
import { Layers, Server, Monitor, Database } from 'lucide-react';

export const SupportedTechSection: React.FC = () => {
  const categories = [
    {
      title: 'Frontend Frameworks',
      icon: <Layers size={14} className="text-blue-500" />,
      items: ['React 18+ (Vite)', 'Angular 19+ (Standalones & Signals)', 'Tailwind CSS', 'TypeScript', 'Markdown Editor']
    },
    {
      title: 'Backend & APIs',
      icon: <Server size={14} className="text-emerald-500" />,
      items: ['.NET 8/9 C# (EF Core)', 'PHP (Native PDO)', 'PHP Laravel Eloquent', 'Node.js Express (TS)', 'Python FastAPI']
    },
    {
      title: 'Desktop & Offline Sync',
      icon: <Monitor size={14} className="text-amber-500" />,
      items: ['Tauri (Rust Native)', 'Electron Desktop', 'IndexedDB (Local-First)', 'SQLite Local DB', 'Delta Push/Pull Sync']
    },
    {
      title: 'Datenbank-Ziele',
      icon: <Database size={14} className="text-purple-500" />,
      items: ['MySQL & MariaDB', 'PostgreSQL', 'Microsoft SQL Server', 'SQLite', 'Docker Compose Container']
    }
  ];

  return (
    <div className="py-16 bg-white border-b border-slate-200" id="tech-stack-section">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Technologie-Ökosystem &amp; Code-Ziele
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900">
            Exportieren Sie in Ihren bevorzugten Stack
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                {cat.icon}
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">{cat.title}</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
