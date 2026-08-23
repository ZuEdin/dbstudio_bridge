import React, { useState } from 'react';
import { PageComponentType } from '../../../types/index';
import { 
  Square, Columns, Rows, CreditCard, LayoutTemplate, Layers, 
  Type, MousePointerClick, List, Table2, Layout, Image as ImageIcon, Plus,
  Rocket, Grid as GridIcon, MessageSquare, DollarSign, PanelBottom, Navigation,
  TrendingUp, AlertCircle, Tag, Sliders, Play, Search, FolderPlus, HelpCircle
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';

interface ComponentToolboxProps {
  onOpenTemplates?: () => void;
}

export const ComponentToolbox: React.FC<ComponentToolboxProps> = ({ onOpenTemplates }) => {
  const { queries, tables, customComponents = [] } = useProjectStore();
  const ui = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragStart = (e: React.DragEvent, type: PageComponentType, defaultProps?: Record<string, any>) => {
      e.dataTransfer.setData('componentType', type);
      e.dataTransfer.setData('text/plain', type);
      if (defaultProps) {
        e.dataTransfer.setData('defaultProps', JSON.stringify(defaultProps));
      }
      e.dataTransfer.effectAllowed = 'copy';
  };

  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div className="w-68 bg-white border-r border-slate-300 flex flex-col p-3.5 shadow-[2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto shrink-0 select-none">
      
      {/* Templates / Presets Quick Banner */}
      {onOpenTemplates && (
        <button
          type="button"
          onClick={onOpenTemplates}
          className="w-full mb-3 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-center justify-between text-left hover:border-indigo-400 hover:shadow-sm transition group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus size={15} />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950 group-hover:text-indigo-600 transition">Vorlagen & Presets</div>
              <div className="text-[10px] text-slate-500">Master-Detail, Dashboard, etc.</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-100">Neu</span>
        </button>
      )}

      {/* Search Input */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Komponenten suchen..."
          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-500 focus:outline-none transition"
        />
      </div>

      {/* Subforms & Subpages Category */}
      {(matchesSearch('Subform') || matchesSearch('Master-Detail') || matchesSearch('Unterseite') || matchesSearch('Tabs') || matchesSearch('Repeater') || matchesSearch('Akkordeon')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 bg-indigo-50/70 px-2 py-1 rounded">
            <Layers size={12} className="text-indigo-600"/> Subformulare & Subpages
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Subformular') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'subform')} 
                className="p-2 border border-indigo-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-indigo-50/60 text-xs text-indigo-900 font-semibold active:cursor-grabbing bg-indigo-50/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-indigo-100 text-indigo-700"><Layers size={14} /></div>
                <div>
                  <div>Subformular (Master-Detail)</div>
                  <div className="text-[9px] font-normal text-slate-500">Fremdschlüssel-gebundene Tabelle</div>
                </div>
              </div>
            )}

            {matchesSearch('Tabs') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'tabs_container')} 
                className="p-2 border border-indigo-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-indigo-50/60 text-xs text-indigo-900 font-semibold active:cursor-grabbing bg-indigo-50/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-indigo-100 text-indigo-700"><LayoutTemplate size={14} /></div>
                <div>
                  <div>Tabs Layout (Registerkarten)</div>
                  <div className="text-[9px] font-normal text-slate-500">Multi-Tab Unterseiten Container</div>
                </div>
              </div>
            )}

            {matchesSearch('Unterseite') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'subpage_container')} 
                className="p-2 border border-emerald-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-emerald-50/60 text-xs text-emerald-900 font-semibold active:cursor-grabbing bg-emerald-50/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-emerald-100 text-emerald-700"><Layers size={14} /></div>
                <div>
                  <div>Unterseite (Sub-Page)</div>
                  <div className="text-[9px] font-normal text-slate-500">Eingebettete Custom Page</div>
                </div>
              </div>
            )}

            {matchesSearch('List Repeater') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'list_repeater')} 
                className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 text-slate-600"><List size={14} /></div>
                <div>List-Repeater (Loop)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI & Modern Widgets Category */}
      {(matchesSearch('KPI') || matchesSearch('Stat') || matchesSearch('Alert') || matchesSearch('Suchleiste') || matchesSearch('Aktionsleiste') || matchesSearch('Badge')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5 bg-amber-50/70 px-2 py-1 rounded">
            <TrendingUp size={12} className="text-amber-600"/> KPI & Widgets
          </div>
          <div className="space-y-1.5">
            {matchesSearch('KPI') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'kpi_widget')} 
                className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50/60 text-xs text-amber-900 font-semibold active:cursor-grabbing bg-amber-50/20 shadow-2xs transition"
              >
                <div className="p-1 rounded bg-amber-100 text-amber-700"><TrendingUp size={14} /></div>
                <div>
                  <div>KPI Stat-Card</div>
                  <div className="text-[9px] font-normal text-slate-500">Große Zahl, Trend & Icon</div>
                </div>
              </div>
            )}

            {matchesSearch('Suchleiste') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'search_filter_bar')} 
                className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 text-slate-600"><Search size={14} /></div>
                <div>Such- & Filterleiste</div>
              </div>
            )}

            {matchesSearch('Aktionsleiste') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'action_group')} 
                className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 text-slate-600"><Play size={14} /></div>
                <div>Aktionsleiste / Buttons</div>
              </div>
            )}

            {matchesSearch('Alert') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'alert_box')} 
                className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 text-amber-600"><AlertCircle size={14} /></div>
                <div>Hinweis- / Alert-Box</div>
              </div>
            )}

            {matchesSearch('Badge') && (
              <div 
                draggable 
                onDragStart={(e) => handleDragStart(e, 'badge_pill')} 
                className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition"
              >
                <div className="p-1 rounded bg-slate-100 text-emerald-600"><Tag size={14} /></div>
                <div>Status-Badge / Pill</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Layout & Structure Category */}
      {(matchesSearch('Container') || matchesSearch('Row') || matchesSearch('Column') || matchesSearch('Card') || matchesSearch('Grid')) && (
        <div className="mb-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
            <Square size={12}/> Layout & Struktur
          </div>
          <div className="space-y-1.5">
            {matchesSearch('Grid') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'grid_layout')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 text-blue-600"><GridIcon size={14}/></div>
                <div>Responsive Grid (2/3/4 Spalten)</div>
              </div>
            )}
            {matchesSearch('Card') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'card')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 text-blue-600"><CreditCard size={14}/></div>
                <div>Card (Inhalts-Karte)</div>
              </div>
            )}
            {matchesSearch('Row') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'row')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 text-blue-600"><Columns size={14}/></div>
                <div>Row Layout (Zeile)</div>
              </div>
            )}
            {matchesSearch('Column') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'column')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 text-blue-600"><Rows size={14}/></div>
                <div>Column Layout (Spalte)</div>
              </div>
            )}
            {matchesSearch('Container') && (
              <div draggable onDragStart={(e) => handleDragStart(e, 'container')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
                <div className="p-1 rounded bg-slate-100 text-blue-600"><Square size={14}/></div>
                <div>Container (Box)</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Elements Category */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
          <Type size={12}/> Standard Elemente
        </div>
        <div className="space-y-1.5">
          {matchesSearch('Tabelle') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'table_view')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-emerald-50 text-emerald-600"><Table2 size={14}/></div>
              <div>Daten-Tabelle (Data Grid)</div>
            </div>
          )}
          {matchesSearch('Formular') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'form_view')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-blue-50 text-blue-600"><Layout size={14}/></div>
              <div>Formular (Embedded)</div>
            </div>
          )}
          {matchesSearch('Text') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'text')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-slate-100 text-slate-600"><Type size={14}/></div>
              <div>Text Block</div>
            </div>
          )}
          {matchesSearch('Button') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'button')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-indigo-50 text-indigo-600"><MousePointerClick size={14}/></div>
              <div>Button / Schaltfläche</div>
            </div>
          )}
          {matchesSearch('Dropdown') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'dropdown')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-orange-50 text-orange-600"><List size={14}/></div>
              <div>Dropdown Menu</div>
            </div>
          )}
          {matchesSearch('Bild') && (
            <div draggable onDragStart={(e) => handleDragStart(e, 'image')} className="p-2 border border-slate-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-slate-50 text-xs text-slate-700 font-medium active:cursor-grabbing transition">
              <div className="p-1 rounded bg-purple-50 text-purple-600"><ImageIcon size={14}/></div>
              <div>Bild / Medien</div>
            </div>
          )}
        </div>
      </div>

      {/* Landingpage Blocks */}
      <div className="mb-4">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
          <Rocket size={12}/> Landingpage Blöcke
        </div>
        <div className="space-y-1.5">
          <div draggable onDragStart={(e) => handleDragStart(e, 'navbar')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <Navigation size={14} className="text-amber-500"/> Navigation (Navbar)
          </div>
          <div draggable onDragStart={(e) => handleDragStart(e, 'hero_section')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <Rocket size={14} className="text-amber-600"/> Hero Section
          </div>
          <div draggable onDragStart={(e) => handleDragStart(e, 'feature_grid')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <GridIcon size={14} className="text-amber-600"/> Feature Grid
          </div>
          <div draggable onDragStart={(e) => handleDragStart(e, 'pricing_table')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <DollarSign size={14} className="text-amber-600"/> Pricing Table
          </div>
          <div draggable onDragStart={(e) => handleDragStart(e, 'testimonial')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <MessageSquare size={14} className="text-amber-600"/> Testimonials
          </div>
          <div draggable onDragStart={(e) => handleDragStart(e, 'footer')} className="p-2 border border-amber-200 rounded-lg flex items-center gap-2 cursor-grab hover:bg-amber-50 text-xs text-amber-800 font-semibold active:cursor-grabbing bg-amber-50/40">
              <PanelBottom size={14} className="text-amber-600"/> Footer
          </div>
        </div>
      </div>

      {/* Custom Components Registry */}
      <div className="pt-3 border-t border-slate-200 shrink-0">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Layout size={12} className="text-emerald-600" /> Custom (SDUI)
            </h3>
            <button 
                type="button"
                onClick={() => ui.setCurrentView({ type: 'custom_component_designer' })}
                className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5"
                title="Neue Custom Component erstellen"
            >
                <Plus size={10} /> Neu
            </button>
        </div>
        
        {customComponents.length > 0 ? (
            <div className="space-y-1.5">
                {customComponents.map(comp => (
                    <div 
                        key={comp.id}
                        draggable 
                        onDragStart={(e) => {
                            e.dataTransfer.setData('componentType', 'custom_component');
                            e.dataTransfer.setData('customComponentId', comp.id);
                            e.dataTransfer.setData('text/plain', 'custom_component');
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className="p-1.5 border border-slate-200 rounded-lg flex items-center justify-between cursor-grab hover:bg-emerald-50 text-xs text-slate-700 font-semibold active:cursor-grabbing border-emerald-100 bg-emerald-50/10 transition"
                        title={`${comp.name}: ${comp.description || ''}`}
                    >
                        <span className="truncate max-w-[120px]">{comp.name}</span>
                        <span className="text-[8px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1 rounded uppercase scale-90">{comp.type.replace('_view', '')}</span>
                    </div>
                ))}
            </div>
        ) : (
            <div className="p-2.5 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center space-y-1">
                <p className="text-[10px] text-slate-400 italic">
                    Keine Custom Components vorhanden.
                </p>
            </div>
        )}
      </div>

      {/* Database Tables & Fields */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Datenfelder</h3>
        <p className="text-[9px] text-slate-400 mb-2">Tabelle oder Felder auf die Seite ziehen:</p>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {tables.map(t => (
            <div key={t.id} className="border border-slate-200 rounded-lg p-1.5 bg-slate-50/50">
              <div 
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('componentType', 'table_view');
                  e.dataTransfer.setData('dataSourceType', 'table');
                  e.dataTransfer.setData('dataSourceId', t.id);
                  e.dataTransfer.setData('columns', t.fields.map(f => f.name).join(','));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="font-bold text-xs text-indigo-700 cursor-grab hover:underline flex items-center gap-1.5"
              >
                <Table2 size={12} /> {t.name}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {t.fields.map(f => (
                  <div
                    key={f.id || f.name}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('componentType', 'text');
                      e.dataTransfer.setData('templateText', `{{context.${f.name}}}`);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-600 cursor-grab hover:bg-indigo-50 hover:border-indigo-300 font-mono"
                  >
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
