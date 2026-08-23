import React from 'react';
import { AccessDatabaseCard } from './AccessDatabaseCard';
import { 
  Users, 
  Package, 
  CheckSquare, 
  FileText, 
  LifeBuoy, 
  Briefcase,
  HardDrive,
  ArrowRight,
  Receipt,
  Coffee,
  Database
} from 'lucide-react';
import { getTemplates } from '../../../data/templates/index';

interface NeuTabProps {
  onOpenNewModal: () => void;
  onApplyTemplate: (templateId: string, templateName: string) => void;
}

export const NeuTab: React.FC<NeuTabProps> = ({
  onOpenNewModal,
  onApplyTemplate,
}) => {
  const fullTemplates = getTemplates('de');

  // Custom UI styling metadata for templates
  const templateMeta: Record<string, { badge?: string; color: string; icon: any }> = {
    fakturierung_suite: {
      badge: 'NEU & EMPFOHLEN',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
      icon: Receipt
    },
    crm_suite: {
      badge: 'BELIEBT',
      color: 'border-blue-500/40 text-blue-400 bg-blue-950/30',
      icon: Users
    },
    inventory_app: {
      badge: 'TOP',
      color: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
      icon: Package
    },
    cms_template: {
      color: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
      icon: FileText
    },
    coffee_fund: {
      color: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
      icon: Coffee
    },
    dbstudio_selfhost: {
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
      icon: Database
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2b2b2b] text-neutral-100 overflow-y-auto px-10 py-6 select-none">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Neu
        </h1>
        <p className="text-xs text-neutral-400">
          Erstellen Sie eine neue leere Datenbank oder wählen Sie eine betriebliche Vorlage
        </p>
      </div>

      {/* Featured / Blank Database Creation */}
      <div className="mb-8">
        <div className="flex items-center gap-6 p-6 rounded-xl bg-[#333333] border border-[#444444] shadow-sm">
          <AccessDatabaseCard
            title="Leere Datenbank"
            subtitle="Standard (IndexedDB)"
            onClick={onOpenNewModal}
          />
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <HardDrive size={11} />
              <span>DB Studio Engine</span>
            </div>
            <h2 className="text-base font-semibold text-white mb-1">
              Benutzerdefinierte leere Datenbank
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">
              Erstellen Sie ein neues Schema von Grund auf mit vollem Tabellen-Designer, Abfragen, Formularen, Berichten und SQL-Unterstützung.
              Als primäre Speicher-Engine ist standardmäßig <strong>IndexedDB (Browser-Datenbank)</strong> aktiv.
            </p>
            <button
              onClick={onOpenNewModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Jetzt erstellen
            </button>
          </div>
        </div>
      </div>

      {/* Template Catalog */}
      <div>
        <div className="flex items-center justify-between border-b border-[#3d3d3d] pb-2 mb-4">
          <h2 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Geschäftsvorlagen & Suite-Schemas
          </h2>
          <span className="text-xs text-neutral-400">
            {fullTemplates.length} Vollständige Vorlagen verfügbar
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fullTemplates.map((tpl) => {
            const meta = templateMeta[tpl.id] || {
              color: 'border-slate-500/40 text-slate-300 bg-slate-900/40',
              icon: FileText
            };
            const Icon = meta.icon;

            return (
              <div
                key={tpl.id}
                onClick={() => onApplyTemplate(tpl.id, tpl.name)}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-[#333333] hover:bg-[#3d3d3d] border border-[#444444] hover:border-indigo-500/60 transition-all cursor-pointer shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg border ${meta.color}`}>
                      <Icon size={20} />
                    </div>
                    {meta.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider">
                        {meta.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mb-1">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#444444] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-neutral-400">{tpl.category || 'Business'}</span>
                  <span className="text-xs font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Vorlage nutzen <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

