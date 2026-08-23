import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, LayoutTemplate, FolderPlus, TrendingUp, Sparkles, 
  Search, Play, AlertCircle, Tag, Square, Columns, Rows, CreditCard, 
  Grid, Table2, Layout, Type, MousePointerClick, Image as ImageIcon,
  Rocket, Navigation, DollarSign, MessageSquare, PanelBottom, ChevronDown,
  Eye, Maximize2, Sidebar, Sliders, Trash2, Plus, Box, PlusCircle
} from 'lucide-react';
import { RibbonButton } from '../RibbonButton';
import { RibbonGroup } from '../RibbonGroup';
import { PagePresetsSplitButton } from '../PagePresetsSplitButton';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useUIStore } from '../../../stores/useUIStore';
import { PagePreset } from '../../../features/pages/components/templates/pagePresets';
import { PageComponentType } from '../../../types/index';

interface PageDesignTabProps {
  onAction: (action: string, payload?: any) => void;
}

export const PageDesignTab: React.FC<PageDesignTabProps> = ({ onAction }) => {
  const { customComponents = [] } = useProjectStore();
  const ui = useUIStore();
  const { isPageToolboxOpen, setIsPageToolboxOpen, isPagePropertiesOpen, setIsPagePropertiesOpen } = ui;

  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [showLandingDropdown, setShowLandingDropdown] = useState(false);
  const [showCustomDropdown, setShowCustomDropdown] = useState(false);
  const [showWidgetsDropdown, setShowWidgetsDropdown] = useState(false);

  const layoutDropdownRef = useRef<HTMLDivElement>(null);
  const landingDropdownRef = useRef<HTMLDivElement>(null);
  const customDropdownRef = useRef<HTMLDivElement>(null);
  const widgetsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (layoutDropdownRef.current && !layoutDropdownRef.current.contains(e.target as Node)) {
        setShowLayoutDropdown(false);
      }
      if (landingDropdownRef.current && !landingDropdownRef.current.contains(e.target as Node)) {
        setShowLandingDropdown(false);
      }
      if (customDropdownRef.current && !customDropdownRef.current.contains(e.target as Node)) {
        setShowCustomDropdown(false);
      }
      if (widgetsDropdownRef.current && !widgetsDropdownRef.current.contains(e.target as Node)) {
        setShowWidgetsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addComponent = (type: PageComponentType, defaultProps?: Record<string, any>) => {
    onAction('page_add_component', { type, defaultProps });
  };

  return (
    <div className="flex gap-1 h-full select-none items-center overflow-visible">
      
      {/* 1. Gruppe: Vorlagen & Presets (Dropdown wie bei Tabellen) */}
      <RibbonGroup label="Vorlagen & Presets">
        <PagePresetsSplitButton 
          label="Vorlagen & Presets"
          onApplyPreset={(preset: PagePreset) => onAction('page_apply_preset', preset.layout)}
          onOpenModal={() => onAction('page_open_presets_modal')}
          onClearLayout={() => onAction('page_clear_layout')}
        />
        <RibbonButton 
          icon={<Sparkles className="text-purple-600 dark:text-purple-400" />} 
          label="Katalog" 
          onClick={() => onAction('page_open_presets_modal')} 
        />
      </RibbonGroup>

      {/* 2. Gruppe: Subformulare & Subpages */}
      <RibbonGroup label="Subformulare & Subpages">
        <RibbonButton 
          icon={<Layers className="text-indigo-600 dark:text-indigo-400" />} 
          label="Subformular (Master-Detail)" 
          onClick={() => addComponent('subform', {
            title: 'Untergeordnete Positionen',
            foreignKeyField: 'parent_id',
            allowAdd: true,
            allowDelete: true,
            allowEdit: true,
            showTotalRow: true
          })} 
        />
        <RibbonButton 
          icon={<LayoutTemplate className="text-indigo-600 dark:text-indigo-400" />} 
          label="Tabs (Register)" 
          onClick={() => addComponent('tabs_container', {
            tabs: [
              { id: 'tab1', label: 'Übersicht' },
              { id: 'tab2', label: 'Details & Positionen' },
              { id: 'tab3', label: 'Dokumente' }
            ],
            defaultTab: 'tab1'
          })} 
        />
        <RibbonButton 
          icon={<Layers className="text-emerald-600 dark:text-emerald-400" />} 
          label="Sub-Page Container" 
          onClick={() => addComponent('subpage_container', {
            subpageId: '',
            syncParams: true
          })} 
        />
        <RibbonButton 
          icon={<div className="p-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">LOOP</div>} 
          label="List-Repeater" 
          onClick={() => addComponent('list_repeater')} 
        />
      </RibbonGroup>

      {/* 3. Gruppe: KPI & Widgets */}
      <RibbonGroup label="KPI & Widgets">
        <RibbonButton 
          icon={<TrendingUp className="text-amber-600 dark:text-amber-400" />} 
          label="KPI Stat-Card" 
          onClick={() => addComponent('kpi_widget', {
            label: 'Monatsumsatz',
            value: '48.500,00',
            unit: '€',
            trend: '+14.2%',
            trendDirection: 'up',
            accentColor: 'indigo'
          })} 
        />
        <RibbonButton 
          icon={<Search className="text-sky-600 dark:text-sky-400" />} 
          label="Suchleiste" 
          onClick={() => addComponent('search_filter_bar', {
            placeholder: 'Suche nach Positionen, Kunden, etc...'
          })} 
        />
        <RibbonButton 
          icon={<Play className="text-emerald-600 dark:text-emerald-400" />} 
          label="Aktionsleiste" 
          onClick={() => addComponent('action_group')} 
        />

        {/* Mehr Widgets Dropdown */}
        <div className="relative" ref={widgetsDropdownRef}>
          <RibbonButton 
            icon={<div className="flex items-center gap-0.5"><AlertCircle size={14} className="text-amber-500" /><ChevronDown size={11} className="text-slate-500" /></div>} 
            label="Hinweis / Pill" 
            onClick={() => setShowWidgetsDropdown(p => !p)} 
          />
          {showWidgetsDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-[100] p-1.5 w-48 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  addComponent('alert_box', {
                    title: 'Hinweis',
                    message: 'Dies ist eine anpassbare Hinweis-Box.',
                    alertType: 'info'
                  });
                  setShowWidgetsDropdown(false);
                }}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <AlertCircle size={14} className="text-amber-500" /> Hinweis / Alert-Box
              </button>
              <button
                onClick={() => {
                  addComponent('badge_pill', {
                    label: 'Status: In Bearbeitung',
                    colorScheme: 'emerald'
                  });
                  setShowWidgetsDropdown(false);
                }}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Tag size={14} className="text-emerald-500" /> Status-Badge / Pill
              </button>
            </div>
          )}
        </div>
      </RibbonGroup>

      {/* 4. Gruppe: Layout & Struktur */}
      <RibbonGroup label="Layout & Struktur">
        <RibbonButton 
          icon={<Grid className="text-blue-600 dark:text-blue-400" />} 
          label="Grid (Spalten)" 
          onClick={() => addComponent('grid_layout', { columns: 3, gap: 4 })} 
        />
        <RibbonButton 
          icon={<CreditCard className="text-blue-600 dark:text-blue-400" />} 
          label="Card (Karte)" 
          onClick={() => addComponent('card')} 
        />

        <div className="relative" ref={layoutDropdownRef}>
          <RibbonButton 
            icon={<div className="flex items-center gap-0.5"><Columns size={14} className="text-blue-600" /><ChevronDown size={11} className="text-slate-500" /></div>} 
            label="Zeile / Spalte" 
            onClick={() => setShowLayoutDropdown(p => !p)} 
          />
          {showLayoutDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-[100] p-1.5 w-44 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  addComponent('row');
                  setShowLayoutDropdown(false);
                }}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Columns size={14} className="text-blue-600" /> Zeile (Row Layout)
              </button>
              <button
                onClick={() => {
                  addComponent('column');
                  setShowLayoutDropdown(false);
                }}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Rows size={14} className="text-blue-600" /> Spalte (Column Layout)
              </button>
              <button
                onClick={() => {
                  addComponent('container');
                  setShowLayoutDropdown(false);
                }}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Square size={14} className="text-blue-600" /> Container (Box)
              </button>
            </div>
          )}
        </div>
      </RibbonGroup>

      {/* 5. Gruppe: Standard & SDUI */}
      <RibbonGroup label="Standard & SDUI">
        <RibbonButton 
          icon={<Table2 className="text-emerald-600 dark:text-emerald-400" />} 
          label="Daten-Tabelle" 
          onClick={() => addComponent('table_view')} 
        />
        <RibbonButton 
          icon={<Layout className="text-indigo-600 dark:text-indigo-400" />} 
          label="Formular" 
          onClick={() => addComponent('form_view')} 
        />
        <RibbonButton 
          icon={<Type className="text-slate-600 dark:text-slate-400" />} 
          label="Textblock" 
          onClick={() => addComponent('text', { text: 'Text Block' })} 
        />
        <RibbonButton 
          icon={<MousePointerClick className="text-indigo-600 dark:text-indigo-400" />} 
          label="Button" 
          onClick={() => addComponent('button', { label: 'Aktion' })} 
        />

        {/* Custom SDUI Dropdown */}
        <div className="relative" ref={customDropdownRef}>
          <RibbonButton 
            icon={<div className="flex items-center gap-0.5"><Box size={14} className="text-emerald-600" /><ChevronDown size={11} className="text-slate-500" /></div>} 
            label="Custom (SDUI)" 
            onClick={() => setShowCustomDropdown(p => !p)} 
          />
          {showCustomDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-[100] p-2 w-56 max-h-60 overflow-y-auto text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
                <span>Eigene Komponenten</span>
                <button
                  onClick={() => {
                    ui.setCurrentView({ type: 'custom_component_designer' });
                    setShowCustomDropdown(false);
                  }}
                  className="text-emerald-600 hover:underline flex items-center gap-0.5"
                >
                  <Plus size={10} /> Neu
                </button>
              </div>
              {customComponents.length > 0 ? (
                customComponents.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      addComponent('custom_component', { customComponentId: c.id });
                      setShowCustomDropdown(false);
                    }}
                    className="flex items-center justify-between w-full p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left text-slate-700 dark:text-slate-200"
                  >
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="text-[9px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-1 rounded uppercase scale-90">{c.type.replace('_view', '')}</span>
                  </button>
                ))
              ) : (
                <div className="p-2 text-center text-slate-400 text-[11px] italic">
                  Keine Custom Components vorhanden.
                </div>
              )}
            </div>
          )}
        </div>
      </RibbonGroup>

      {/* 6. Gruppe: Landingpage Sektionen */}
      <RibbonGroup label="Landingpage Blöcke">
        <div className="relative" ref={landingDropdownRef}>
          <RibbonButton 
            icon={<div className="flex items-center gap-0.5"><Rocket size={14} className="text-amber-500" /><ChevronDown size={11} className="text-slate-500" /></div>} 
            label="Sektionen" 
            onClick={() => setShowLandingDropdown(p => !p)} 
          />
          {showLandingDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl z-50 p-1.5 w-48 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => { addComponent('navbar'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Navigation size={13} className="text-amber-500" /> Navigation (Navbar)
              </button>
              <button
                onClick={() => { addComponent('hero_section'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Rocket size={13} className="text-amber-600" /> Hero Section
              </button>
              <button
                onClick={() => { addComponent('feature_grid'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <Grid size={13} className="text-amber-600" /> Feature Grid
              </button>
              <button
                onClick={() => { addComponent('pricing_table'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <DollarSign size={13} className="text-amber-600" /> Pricing Table
              </button>
              <button
                onClick={() => { addComponent('testimonial'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <MessageSquare size={13} className="text-amber-600" /> Testimonials
              </button>
              <button
                onClick={() => { addComponent('footer'); setShowLandingDropdown(false); }}
                className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-slate-700 dark:text-slate-200"
              >
                <PanelBottom size={13} className="text-amber-600" /> Footer
              </button>
            </div>
          )}
        </div>
      </RibbonGroup>

      {/* 7. Gruppe: Canvas & Platz-Optimierung */}
      <RibbonGroup label="Ansicht & Platz" isLast>
        <RibbonButton 
          icon={<Sidebar className={isPageToolboxOpen ? "text-indigo-600 font-bold" : "text-slate-400"} />} 
          label={isPageToolboxOpen ? "Toolbox (Ein)" : "Toolbox (Aus)"} 
          onClick={() => setIsPageToolboxOpen(!isPageToolboxOpen)} 
          className={isPageToolboxOpen ? "bg-indigo-50 dark:bg-indigo-950/50" : ""}
        />
        <RibbonButton 
          icon={<Sliders className={isPagePropertiesOpen ? "text-indigo-600 font-bold" : "text-slate-400"} />} 
          label={isPagePropertiesOpen ? "Eigenschaften" : "Eigenschaften (Aus)"} 
          onClick={() => setIsPagePropertiesOpen(!isPagePropertiesOpen)} 
          className={isPagePropertiesOpen ? "bg-indigo-50 dark:bg-indigo-950/50" : ""}
        />
        <RibbonButton 
          icon={<Eye className="text-emerald-600" />} 
          label="Live Vorschau" 
          onClick={() => onAction('page_live_preview')} 
        />
      </RibbonGroup>

    </div>
  );
};
