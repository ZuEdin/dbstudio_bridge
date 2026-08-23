import React, { useState, useEffect, useRef } from 'react';
import { CustomPage, PageComponent, PageComponentType } from '../../types/index';
import { 
  LayoutTemplate, Trash2, Layers, FolderPlus, Sparkles, X, Check, 
  ArrowLeft, RefreshCw, Sidebar, Sliders, ChevronLeft, ChevronRight, 
  Plus, Eye, Maximize2, Minimize2, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import { ComponentToolbox } from './components/ComponentToolbox';
import { RenderNode } from './components/RenderNode';
import { PropertiesPanel } from './components/PropertiesPanel';
import { 
  findNodeAndAdd, 
  findNodeAndUpdateProps, 
  findNodeAndDelete, 
  findNode,
  findNodeAndDuplicate,
  findNodeAndMove,
  findParentNode
} from './utils/treeUtils';
import { pagePresets } from './components/templates/pagePresets';
import { useUIStore } from '../../stores/useUIStore';

interface PageDesignerProps {
  page: CustomPage;
  onPageChange: (page: CustomPage) => void;
  onSetView: (v: any) => void;
}

export const PageDesigner: React.FC<PageDesignerProps> = ({ page, onPageChange, onSetView }) => {
  const ui = useUIStore();
  const { 
    isPageToolboxOpen, setIsPageToolboxOpen, 
    isPagePropertiesOpen, setIsPagePropertiesOpen,
    pageActionTrigger, addToast
  } = ui;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [canvasWidthMode, setCanvasWidthMode] = useState<'standard' | 'wide' | 'full'>('full');

  // Handle Ribbon Actions via pageActionTrigger
  const lastProcessedTrigger = useRef<number>(0);
  useEffect(() => {
    if (!pageActionTrigger || pageActionTrigger.timestamp <= lastProcessedTrigger.current) {
      return;
    }
    lastProcessedTrigger.current = pageActionTrigger.timestamp;

    const { action, payload } = pageActionTrigger;

    if (action === 'page_open_presets_modal') {
      setShowPresetsModal(true);
    } else if (action === 'page_apply_preset' && payload) {
      handleApplyPreset(payload);
    } else if (action === 'page_clear_layout') {
      ui.setConfirmationModal({
        title: "Seitenlayout leeren",
        message: "Möchten Sie das gesamte Seitenlayout wirklich zurücksetzen? Alle Elemente werden gelöscht.",
        onConfirm: () => {
          const emptyRoot: PageComponent = {
            id: 'root',
            type: 'container',
            props: { className: 'p-6 max-w-7xl mx-auto space-y-6 min-h-[400px]' },
            children: []
          };
          onPageChange({ ...page, layout: emptyRoot });
          setSelectedNodeId(null);
          addToast("Layout wurde geleert.", "info");
        }
      });
    } else if (action === 'page_add_component' && payload?.type) {
      insertComponentFromRibbon(payload.type, payload.defaultProps);
    }
  }, [pageActionTrigger, page, selectedNodeId]);

  const insertComponentFromRibbon = (type: PageComponentType, defaultProps?: Record<string, any>) => {
    const newNode: PageComponent = {
      id: 'node_' + crypto.randomUUID(),
      type,
      props: { ...(defaultProps || {}) },
      children: (type === 'container' || type === 'list_repeater' || type === 'row' || type === 'column' || type === 'card' || type === 'grid_layout' || type === 'tabs_container') ? [] : undefined
    };

    if (type === 'text' && !newNode.props.text) newNode.props.text = 'Text Block';
    if (type === 'button' && !newNode.props.label) newNode.props.label = 'Button';
    if ((type === 'kpi_widget' || type === 'stat_card') && !newNode.props.label) {
      newNode.props.label = 'Monatsumsatz';
      newNode.props.value = '48.500,00';
      newNode.props.unit = '€';
      newNode.props.trend = '+14.2%';
      newNode.props.trendDirection = 'up';
      newNode.props.accentColor = 'indigo';
    }
    if (type === 'subform' && !newNode.props.title) {
      newNode.props.title = 'Untergeordnete Positionen';
      newNode.props.foreignKeyField = 'parent_id';
      newNode.props.allowAdd = true;
      newNode.props.allowDelete = true;
      newNode.props.allowEdit = true;
      newNode.props.showTotalRow = true;
    }
    if (type === 'tabs_container' && !newNode.props.tabs) {
      newNode.props.tabs = [
        { id: 'tab1', label: 'Übersicht' },
        { id: 'tab2', label: 'Details & Positionen' },
        { id: 'tab3', label: 'Dokumente' }
      ];
      newNode.props.defaultTab = 'tab1';
    }
    if (type === 'grid_layout' && !newNode.props.columns) {
      newNode.props.columns = 3;
      newNode.props.gap = 4;
    }
    if (type === 'alert_box' && !newNode.props.title) {
      newNode.props.title = 'Hinweis';
      newNode.props.message = 'Dies ist eine anpassbare Hinweis-Box.';
      newNode.props.alertType = 'info';
    }
    if (type === 'badge_pill' && !newNode.props.label) {
      newNode.props.label = 'Status: In Bearbeitung';
      newNode.props.colorScheme = 'emerald';
    }
    if (type === 'search_filter_bar' && !newNode.props.placeholder) {
      newNode.props.placeholder = 'Suche nach Positionen, Kunden, etc...';
    }

    // Determine target container
    let targetParentId = 'root';
    if (selectedNodeId && selectedNodeId !== 'root') {
      const selected = findNode(page.layout, selectedNodeId);
      if (selected && selected.children !== undefined) {
        targetParentId = selected.id;
      } else {
        const parent = findParentNode(page.layout, selectedNodeId);
        if (parent) targetParentId = parent.id;
      }
    }

    const newLayout = findNodeAndAdd(page.layout, targetParentId, newNode);
    onPageChange({ ...page, layout: newLayout });
    setSelectedNodeId(newNode.id);
    addToast(`Element "${type}" hinzugefügt.`, 'success');
  };

  const handleDropElement = (e: React.DragEvent, parentId: string) => {
      let type = e.dataTransfer.getData('componentType') as PageComponentType;
      if (!type) {
          type = e.dataTransfer.getData('text/plain') as PageComponentType;
      }
      if (!type) return;

      const templateText = e.dataTransfer.getData('templateText');
      const dataSourceType = e.dataTransfer.getData('dataSourceType');
      const dataSourceId = e.dataTransfer.getData('dataSourceId');
      const columns = e.dataTransfer.getData('columns');
      const customComponentId = e.dataTransfer.getData('customComponentId');
      const defaultPropsRaw = e.dataTransfer.getData('defaultProps');

      let parsedDefaultProps = {};
      if (defaultPropsRaw) {
        try { parsedDefaultProps = JSON.parse(defaultPropsRaw); } catch {}
      }

      const newNode: PageComponent = {
          id: 'node_' + crypto.randomUUID(),
          type,
          props: { ...parsedDefaultProps },
          children: (type === 'container' || type === 'list_repeater' || type === 'row' || type === 'column' || type === 'card' || type === 'grid_layout' || type === 'tabs_container') ? [] : undefined
      };

      if (type === 'text') newNode.props.text = templateText || 'Text Block';
      if (type === 'button') newNode.props.label = 'Button';
      if (type === 'kpi_widget' || type === 'stat_card') {
          newNode.props.label = 'Monatsumsatz';
          newNode.props.value = '48.500,00';
          newNode.props.unit = '€';
          newNode.props.trend = '+14.2%';
          newNode.props.trendDirection = 'up';
          newNode.props.accentColor = 'indigo';
      }
      if (type === 'subform') {
          newNode.props.title = 'Untergeordnete Positionen';
          newNode.props.foreignKeyField = 'parent_id';
          newNode.props.allowAdd = true;
          newNode.props.allowDelete = true;
          newNode.props.allowEdit = true;
          newNode.props.showTotalRow = true;
      }
      if (type === 'tabs_container') {
          newNode.props.tabs = [
              { id: 'tab1', label: 'Übersicht' },
              { id: 'tab2', label: 'Details & Positionen' },
              { id: 'tab3', label: 'Dokumente' }
          ];
          newNode.props.defaultTab = 'tab1';
      }
      if (type === 'grid_layout') {
          newNode.props.columns = 3;
          newNode.props.gap = 4;
      }
      if (type === 'alert_box') {
          newNode.props.title = 'Hinweis';
          newNode.props.message = 'Dies ist eine anpassbare Hinweis-Box.';
          newNode.props.alertType = 'info';
      }
      if (type === 'badge_pill') {
          newNode.props.label = 'Status: In Bearbeitung';
          newNode.props.colorScheme = 'emerald';
      }
      if (type === 'search_filter_bar') {
          newNode.props.placeholder = 'Suche nach Positionen, Kunden, etc...';
      }
      if (type === 'custom_component' && customComponentId) {
          newNode.props.customComponentId = customComponentId;
      }
      
      if (dataSourceType && dataSourceId) {
          newNode.props.dataSourceType = dataSourceType;
          newNode.props.dataSourceId = dataSourceId;
          if (columns) {
              newNode.props.columns = columns;
          }
      }

      const newLayout = findNodeAndAdd(page.layout, parentId, newNode);
      onPageChange({ ...page, layout: newLayout });
      setSelectedNodeId(newNode.id);
  };

  const selectedNode = selectedNodeId ? findNode(page.layout, selectedNodeId) : null;

  const updateSelectedNodeProps = (newProps: any) => {
      if (!selectedNodeId) return;
      const newLayout = findNodeAndUpdateProps(page.layout, selectedNodeId, newProps);
      onPageChange({ ...page, layout: newLayout });
  };

  const deleteSelectedNode = () => {
      if (!selectedNodeId || selectedNodeId === 'root') return;
      const newLayout = findNodeAndDelete(page.layout, selectedNodeId);
      if (newLayout) {
          onPageChange({ ...page, layout: newLayout });
          setSelectedNodeId(null);
      }
      setShowDeleteConfirm(false);
  };

  const handleDuplicateNode = (nodeId: string) => {
      const newLayout = findNodeAndDuplicate(page.layout, nodeId);
      onPageChange({ ...page, layout: newLayout });
  };

  const handleMoveNode = (nodeId: string, direction: 'up' | 'down') => {
      const newLayout = findNodeAndMove(page.layout, nodeId, direction);
      onPageChange({ ...page, layout: newLayout });
  };

  const handleSelectParentNode = (nodeId: string) => {
      const parent = findParentNode(page.layout, nodeId);
      if (parent) {
          setSelectedNodeId(parent.id);
      }
  };

  const handleApplyPreset = (presetLayout: PageComponent) => {
      onPageChange({ ...page, layout: JSON.parse(JSON.stringify(presetLayout)) });
      setShowPresetsModal(false);
      setSelectedNodeId(null);
      addToast("Vorlage erfolgreich geladen.", "success");
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                  return;
              }
              if (selectedNodeId && selectedNodeId !== 'root') {
                  setShowDeleteConfirm(true);
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const getCanvasMaxWidthClass = () => {
    switch (canvasWidthMode) {
      case 'standard': return 'max-w-5xl';
      case 'wide': return 'max-w-7xl';
      case 'full': return 'w-full max-w-[1600px]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950 font-sans relative select-none">
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Trash2 className="text-red-500" size={18} />
                    Element löschen
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-5 text-xs leading-relaxed">
                    Möchten Sie dieses Element und dessen untergeordnete Elemente wirklich aus dem Seitenlayout entfernen?
                </p>
                <div className="flex justify-end gap-2.5">
                    <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        Abbrechen
                    </button>
                    <button 
                        onClick={deleteSelectedNode}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-xs"
                    >
                        Löschen
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Page Presets / Templates Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150 border border-slate-200 dark:border-slate-800">
                <div className="p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Seiten-Vorlagen & Preset-Architektur</h2>
                            <p className="text-xs text-indigo-200">Wählen Sie ein vorgefertigtes, hochprofessionelles UI-Layout aus</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPresetsModal(false)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pagePresets.map((preset) => (
                        <div 
                            key={preset.id}
                            className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-500 hover:shadow-md transition bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                        {preset.name}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                        {preset.category}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                    {preset.description}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleApplyPreset(preset.layout)}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                            >
                                <Check size={14} /> Diese Vorlage laden
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span>Hinweis: Das Laden einer Vorlage ersetzt das aktuelle Seitenlayout.</span>
                    <button 
                        onClick={() => setShowPresetsModal(false)}
                        className="px-4 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* Top Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 px-4 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
            <LayoutTemplate size={16} />
            Page Designer
          </div>
          
          <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
          
          <div>
            <input 
              type="text" 
              value={page.name} 
              onChange={e => onPageChange({ ...page, name: e.target.value })}
              placeholder="Name der Seite..."
              className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold w-52 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 ml-2 select-none">
            <input 
              type="checkbox"
              id="isSubpageCheckbox"
              checked={!!page.isSubpage}
              onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
            />
            <label htmlFor="isSubpageCheckbox" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1">
              <Layers size={12} className="text-emerald-600"/> Sub-Page
            </label>
          </div>
        </div>

        {/* Canvas Controls & Space Helpers */}
        <div className="flex items-center gap-2">
            {/* Canvas Width Selector */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium">
              <button
                onClick={() => setCanvasWidthMode('standard')}
                className={`px-2 py-0.5 rounded-md transition ${canvasWidthMode === 'standard' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                title="Kompakte Canvas-Breite (1024px)"
              >
                1024px
              </button>
              <button
                onClick={() => setCanvasWidthMode('wide')}
                className={`px-2 py-0.5 rounded-md transition ${canvasWidthMode === 'wide' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                title="Breite Canvas-Breite (1280px)"
              >
                1280px
              </button>
              <button
                onClick={() => setCanvasWidthMode('full')}
                className={`px-2 py-0.5 rounded-md transition ${canvasWidthMode === 'full' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                title="Maximale Canvas-Breite (Fluid)"
              >
                Maximal
              </button>
            </div>

            {/* Sidebar toggle buttons */}
            <button
              onClick={() => setIsPageToolboxOpen(!isPageToolboxOpen)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
                isPageToolboxOpen 
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Toolbox Leiste ein-/ausblenden"
            >
              <Sidebar size={13} />
              <span className="hidden md:inline">Toolbox</span>
            </button>

            <button
              onClick={() => setIsPagePropertiesOpen(!isPagePropertiesOpen)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
                isPagePropertiesOpen 
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Eigenschaften-Panel ein-/ausblenden"
            >
              <Sliders size={13} />
              <span className="hidden md:inline">Eigenschaften</span>
            </button>

            <button 
                onClick={() => onSetView({ type: 'page_view', pageId: page.id })} 
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs transition"
            >
                <Eye size={13}/> Vorschau
            </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Collapsible Component Toolbox */}
        {isPageToolboxOpen && (
          <div className="relative z-20 flex shrink-0 animate-in slide-in-from-left duration-150">
            <ComponentToolbox onOpenTemplates={() => setShowPresetsModal(true)} />
          </div>
        )}

        {/* Floating Toggle handle for Toolbox */}
        <button
          onClick={() => setIsPageToolboxOpen(!isPageToolboxOpen)}
          className={`absolute top-4 ${isPageToolboxOpen ? 'left-72' : 'left-2'} z-30 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:scale-110 transition duration-150 flex items-center justify-center`}
          title={isPageToolboxOpen ? "Toolbox einklappen (Mehr Platz auf Canvas)" : "Toolbox ausklappen"}
        >
          {isPageToolboxOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Center: Canvas Workspace - Maximized & Roomy */}
        <div 
          className="flex-1 p-6 md:p-8 overflow-auto flex justify-center bg-slate-100/70 dark:bg-slate-950/70 relative transition-all duration-200"
          onClick={() => setSelectedNodeId(null)}
        >
           {/* Subtle Canvas Dot Grid */}
           <div 
             className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none opacity-40 dark:opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#94a3b8 1.2px, transparent 1.2px)', backgroundSize: '24px 24px' }}
           ></div>
           
           <div className={`w-full ${getCanvasMaxWidthClass()} relative z-10 flex flex-col items-center transition-all duration-200`}>
             <RenderNode 
                node={page.layout} 
                selectedNodeId={selectedNodeId} 
                onSelect={(id) => setSelectedNodeId(id)}
                onDrop={handleDropElement}
                onDuplicate={handleDuplicateNode}
                onMove={handleMoveNode}
                onDelete={(id) => { setSelectedNodeId(id); setShowDeleteConfirm(true); }}
                onSelectParent={handleSelectParentNode}
             />
           </div>
        </div>

        {/* Floating Toggle handle for Properties Panel */}
        <button
          onClick={() => setIsPagePropertiesOpen(!isPagePropertiesOpen)}
          className={`absolute top-4 ${isPagePropertiesOpen ? 'right-76' : 'right-2'} z-30 p-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:scale-110 transition duration-150 flex items-center justify-center`}
          title={isPagePropertiesOpen ? "Eigenschaften einklappen (Mehr Platz auf Canvas)" : "Eigenschaften ausklappen"}
        >
          {isPagePropertiesOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Right Sidebar: Collapsible Properties and Page Configuration */}
        {isPagePropertiesOpen && (
          <div className="relative z-20 flex shrink-0 animate-in slide-in-from-right duration-150">
            <PropertiesPanel 
              page={page}
              onPageChange={onPageChange}
              selectedNodeId={selectedNodeId}
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              setShowDeleteConfirm={setShowDeleteConfirm}
            />
          </div>
        )}
      </div>
    </div>
  );
};

