import React, { useState } from 'react';
import { Sliders, Plus, Trash2, Layout, Layers, Type, CreditCard, ChevronUp, ChevronDown } from 'lucide-react';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface LayoutContainerDesignerProps {
  configObj: any;
  updateVisualConfig: (newProps: any) => void;
}

export const LayoutContainerDesigner: React.FC<LayoutContainerDesignerProps> = ({
  configObj,
  updateVisualConfig,
}) => {
  const { customComponents = [], tables = [] } = useProjectStore();
  const [activeChildIdx, setActiveChildIdx] = useState<number | null>(null);

  const children = configObj.children || [];

  const handleAddChild = () => {
    const newChild = {
      id: `child-${Date.now()}`,
      type: 'text',
      width: 'flex-1',
      config: {
        text: 'Neues Element',
        fontSize: 'text-xs',
        fontWeight: 'font-normal',
        colorClass: 'text-slate-700 dark:text-slate-300',
        alignment: 'text-left'
      }
    };
    const nextChildren = [...children, newChild];
    updateVisualConfig({ children: nextChildren });
    setActiveChildIdx(nextChildren.length - 1);
  };

  const handleRemoveChild = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextChildren = children.filter((_: any, i: number) => i !== idx);
    updateVisualConfig({ children: nextChildren });
    if (activeChildIdx === idx) {
      setActiveChildIdx(null);
    } else if (activeChildIdx !== null && activeChildIdx > idx) {
      setActiveChildIdx(activeChildIdx - 1);
    }
  };

  const handleMoveChild = (idx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === children.length - 1) return;

    const nextChildren = [...children];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = nextChildren[idx];
    nextChildren[idx] = nextChildren[targetIdx];
    nextChildren[targetIdx] = temp;

    updateVisualConfig({ children: nextChildren });
    if (activeChildIdx === idx) {
      setActiveChildIdx(targetIdx);
    } else if (activeChildIdx === targetIdx) {
      setActiveChildIdx(idx);
    }
  };

  const updateChild = (idx: number, updates: any) => {
    const nextChildren = children.map((c: any, i: number) => {
      if (i === idx) {
        return { ...c, ...updates };
      }
      return c;
    });
    updateVisualConfig({ children: nextChildren });
  };

  const updateChildConfig = (idx: number, configUpdates: any) => {
    const child = children[idx];
    if (!child) return;
    updateChild(idx, {
      config: { ...(child.config || {}), ...configUpdates }
    });
  };

  const otherComponents = customComponents.filter(c => c.type !== 'layout_container');

  return (
    <div className="space-y-5">
      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
        <Layout size={13} /> Layout-Container konfigurieren
      </h4>

      {/* Basic Layout Properties */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div>
          <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Layout-Typ</label>
          <select
            value={configObj.layoutType || 'row'}
            onChange={(e) => updateVisualConfig({ layoutType: e.target.value })}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white font-semibold"
          >
            <option value="row">Zeile (Nebeneinander - Flex Row)</option>
            <option value="col">Spalte (Untereinander - Flex Column)</option>
            <option value="grid">Kachel-Grid (Gleichmäßige Spalten)</option>
          </select>
        </div>

        {configObj.layoutType === 'grid' && (
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Grid-Spalten (Desktop)</label>
            <select
              value={configObj.cols || 3}
              onChange={(e) => updateVisualConfig({ cols: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs dark:text-white"
            >
              <option value={1}>1 Spalte</option>
              <option value={2}>2 Spalten</option>
              <option value={3}>3 Spalten</option>
              <option value={4}>4 Spalten</option>
              <option value={6}>6 Spalten</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Abstand (Gap)</label>
            <select
              value={configObj.gap || 'gap-4'}
              onChange={(e) => updateVisualConfig({ gap: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
            >
              <option value="gap-0">Keiner (0)</option>
              <option value="gap-2">Klein (8px)</option>
              <option value="gap-4">Mittel (16px)</option>
              <option value="gap-6">Groß (24px)</option>
              <option value="gap-8">Sehr groß (32px)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Innenabstand (Padding)</label>
            <select
              value={configObj.padding || 'p-4'}
              onChange={(e) => updateVisualConfig({ padding: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
            >
              <option value="p-0">Keiner (0)</option>
              <option value="p-2">Klein (8px)</option>
              <option value="p-4">Mittel (16px)</option>
              <option value="p-6">Groß (24px)</option>
              <option value="p-8">Sehr groß (32px)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Hintergrund</label>
            <select
              value={configObj.bgStyle || 'bg-white dark:bg-slate-900'}
              onChange={(e) => updateVisualConfig({ bgStyle: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
            >
              <option value="bg-transparent">Transparent</option>
              <option value="bg-white dark:bg-slate-900">Weiß / Dunkel-Slate</option>
              <option value="bg-slate-50 dark:bg-slate-950/40">Hellgrau / Deep Black</option>
              <option value="bg-indigo-50/20 dark:bg-indigo-950/20">Zartes Indigo</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Schatten (Shadow)</label>
            <select
              value={configObj.shadow || 'shadow-sm'}
              onChange={(e) => updateVisualConfig({ shadow: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
            >
              <option value="shadow-none">Kein Schatten</option>
              <option value="shadow-sm">Subtil</option>
              <option value="shadow-md">Normal</option>
              <option value="shadow-lg">Ausgeprägt</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-slate-500 uppercase">
            <input
              type="checkbox"
              checked={!!configObj.borderStyle}
              onChange={(e) => {
                const borderStr = e.target.checked 
                  ? 'border border-slate-200 dark:border-slate-800 rounded-xl' 
                  : '';
                updateVisualConfig({ borderStyle: borderStr });
              }}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Rahmen anzeigen (Border + Rounded)</span>
          </label>
        </div>
      </div>

      {/* Children Components Management */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Inhaltselemente ({children.length})
          </label>
          <button
            type="button"
            onClick={handleAddChild}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded shadow-xs"
          >
            <Plus size={11} /> Element hinzufügen
          </button>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs italic">
            Noch keine Elemente hinzugefügt. Klicken Sie oben auf "Element hinzufügen"
          </div>
        ) : (
          <div className="space-y-2">
            {children.map((child: any, idx: number) => {
              const isActive = activeChildIdx === idx;
              return (
                <div 
                  key={child.id}
                  className={`border rounded-lg overflow-hidden transition-all ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <div 
                    onClick={() => setActiveChildIdx(isActive ? null : idx)}
                    className="p-3 bg-slate-50 dark:bg-slate-900/80 flex justify-between items-center cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                        {child.type === 'text' && '📝 Textblock'}
                        {child.type === 'button' && '🔘 Button'}
                        {child.type === 'metric_card' && '📊 Metrik'}
                        {child.type === 'component_ref' && '🧩 Custom Component'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleMoveChild(idx, 'up', e)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                        title="Nach oben verschieben"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={(e) => handleMoveChild(idx, 'down', e)}
                        disabled={idx === children.length - 1}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                        title="Nach unten verschieben"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        onClick={(e) => handleRemoveChild(idx, e)}
                        className="p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition"
                        title="Löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="p-3.5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 space-y-4 text-left animate-in slide-in-from-top-1 duration-150">
                      {/* Child type selection */}
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Element-Typ</label>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'text', label: 'Text', icon: Type },
                            { id: 'button', label: 'Button', icon: Sliders },
                            { id: 'metric_card', label: 'Metrik', icon: CreditCard },
                            { id: 'component_ref', label: 'Ref', icon: Layers }
                          ].map(t => {
                            const Icon = t.icon;
                            const isSel = child.type === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  let defaultConf = {};
                                  if (t.id === 'text') {
                                    defaultConf = { text: 'Inhalt', fontSize: 'text-xs', fontWeight: 'font-normal', colorClass: 'text-slate-700 dark:text-slate-300', alignment: 'text-left' };
                                  } else if (t.id === 'button') {
                                    defaultConf = { label: 'Aktion', actionType: 'submit', variant: 'primary' };
                                  } else if (t.id === 'metric_card') {
                                    defaultConf = { title: 'Umsatz', aggType: 'custom', customValue: '124,50', suffix: ' €', themeColor: 'indigo', iconName: 'TrendingUp' };
                                  } else if (t.id === 'component_ref') {
                                    defaultConf = { refComponentId: '' };
                                  }
                                  updateChild(idx, { type: t.id, config: defaultConf });
                                }}
                                className={`py-1.5 px-1 rounded border flex flex-col items-center justify-center gap-1 text-[9px] font-semibold transition-all ${isSel ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
                              >
                                <Icon size={12} />
                                <span>{t.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Element Width/Column Span (only relevant for row layouts) */}
                      {configObj.layoutType === 'row' && (
                        <div>
                          <label className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Breiten-Verhalten (Breiten-Anteil)</label>
                          <select
                            value={child.width || 'flex-1'}
                            onChange={(e) => updateChild(idx, { width: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                          >
                            <option value="flex-1">Gleichmäßig aufteilen (flex-1)</option>
                            <option value="w-full">Volle Breite (100%)</option>
                            <option value="w-1/2">Halbe Breite (50%)</option>
                            <option value="w-1/3">Ein Drittel (33%)</option>
                            <option value="w-1/4">Ein Viertel (25%)</option>
                            <option value="w-auto">Inhaltsgröße (auto)</option>
                          </select>
                        </div>
                      )}

                      {/* Config Form for Text */}
                      {child.type === 'text' && (
                        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border dark:border-slate-800">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Textinhalt</label>
                            <textarea
                              value={child.config?.text || ''}
                              onChange={(e) => updateChildConfig(idx, { text: e.target.value })}
                              placeholder="Inhalt schreiben..."
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white resize-none h-14"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Größe</label>
                              <select
                                value={child.config?.fontSize || 'text-xs'}
                                onChange={(e) => updateChildConfig(idx, { fontSize: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="text-[9px]">Winzig (9px)</option>
                                <option value="text-xs">Klein (xs)</option>
                                <option value="text-sm">Mittel (sm)</option>
                                <option value="text-base">Normal (base)</option>
                                <option value="text-lg">Groß (lg)</option>
                                <option value="text-2xl">Sehr groß (2xl)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Gewicht</label>
                              <select
                                value={child.config?.fontWeight || 'font-normal'}
                                onChange={(e) => updateChildConfig(idx, { fontWeight: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="font-normal">Normal</option>
                                <option value="font-medium">Medium</option>
                                <option value="font-semibold">Semibold</option>
                                <option value="font-bold">Bold</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Farbe</label>
                              <select
                                value={child.config?.colorClass || 'text-slate-700 dark:text-slate-300'}
                                onChange={(e) => updateChildConfig(idx, { colorClass: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="text-slate-700 dark:text-slate-300">Standard</option>
                                <option value="text-slate-500 dark:text-slate-400">Grau / Subtil</option>
                                <option value="text-indigo-600 dark:text-indigo-400">Indigo</option>
                                <option value="text-emerald-600 dark:text-emerald-400">Grün</option>
                                <option value="text-red-600 dark:text-red-400">Rot</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Ausrichtung</label>
                              <select
                                value={child.config?.alignment || 'text-left'}
                                onChange={(e) => updateChildConfig(idx, { alignment: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="text-left">Links</option>
                                <option value="text-center">Zentriert</option>
                                <option value="text-right">Rechts</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Config Form for Button */}
                      {child.type === 'button' && (
                        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border dark:border-slate-800">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Button Beschriftung</label>
                            <input
                              type="text"
                              value={child.config?.label || ''}
                              onChange={(e) => updateChildConfig(idx, { label: e.target.value })}
                              placeholder="Beschriftung..."
                              className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white font-medium"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Aktionstyp</label>
                              <select
                                value={child.config?.actionType || 'submit'}
                                onChange={(e) => updateChildConfig(idx, { actionType: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="submit">Absenden / Submit</option>
                                <option value="navigate">Navigieren</option>
                                <option value="toast">Hinweis anzeigen</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Variante</label>
                              <select
                                value={child.config?.variant || 'primary'}
                                onChange={(e) => updateChildConfig(idx, { variant: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="primary">Primär (Indigo)</option>
                                <option value="secondary">Sekundär (Grau)</option>
                                <option value="danger">Gefahr (Rot)</option>
                                <option value="outline">Rahmen (Outline)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Config Form for Metric Card */}
                      {child.type === 'metric_card' && (
                        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border dark:border-slate-800">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Metrik-Titel</label>
                              <input
                                type="text"
                                value={child.config?.title || ''}
                                onChange={(e) => updateChildConfig(idx, { title: e.target.value })}
                                placeholder="z.B. Umsatz"
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Festwert (Zahl/Text)</label>
                              <input
                                type="text"
                                value={child.config?.customValue || ''}
                                onChange={(e) => updateChildConfig(idx, { customValue: e.target.value, aggType: 'custom' })}
                                placeholder="z.B. 120"
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Suffix (z.B. €)</label>
                              <input
                                type="text"
                                value={child.config?.suffix || ''}
                                onChange={(e) => updateChildConfig(idx, { suffix: e.target.value })}
                                placeholder="z.B. € oder Stk."
                                className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Farbthema</label>
                              <select
                                value={child.config?.themeColor || 'indigo'}
                                onChange={(e) => updateChildConfig(idx, { themeColor: e.target.value })}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1 text-xs dark:text-white"
                              >
                                <option value="indigo">Indigo / Blau</option>
                                <option value="emerald">Grün</option>
                                <option value="rose">Rot</option>
                                <option value="amber">Gelb/Orange</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Config Form for Custom Component Reference */}
                      {child.type === 'component_ref' && (
                        <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border dark:border-slate-800">
                          <div>
                            <label className="block text-[9px] text-slate-400 font-bold uppercase mb-0.5">Referenzierte Custom Component</label>
                            <select
                              value={child.config?.refComponentId || ''}
                              onChange={(e) => updateChildConfig(idx, { refComponentId: e.target.value })}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1.5 text-xs dark:text-white"
                            >
                              <option value="">-- Komponente wählen --</option>
                              {otherComponents.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                              ))}
                            </select>
                            <p className="text-[9px] text-slate-400 mt-1">
                              Bettet eine andere registrierte Custom Component direkt an dieser Position ein. Perfekt für nesterfähige Baukastensysteme!
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
