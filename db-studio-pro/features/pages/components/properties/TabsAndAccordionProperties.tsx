import React from 'react';
import { PageComponent } from '../../../../types';
import { Layers, Plus, Trash2, LayoutGrid } from 'lucide-react';

interface TabsAndAccordionPropertiesProps {
  selectedNode: PageComponent;
  updateSelectedNodeProps: (newProps: any) => void;
}

export const TabsAndAccordionProperties: React.FC<TabsAndAccordionPropertiesProps> = ({
  selectedNode,
  updateSelectedNodeProps,
}) => {
  const props = selectedNode.props || {};
  const isTabs = selectedNode.type === 'tabs_container';
  const tabs = props.tabs || [
    { id: 'tab1', label: 'Tab 1', icon: 'FileText' },
    { id: 'tab2', label: 'Tab 2', icon: 'List' }
  ];

  const handleAddTab = () => {
    const newId = `tab_${Date.now()}`;
    const nextTabs = [...tabs, { id: newId, label: `Neuer Tab ${tabs.length + 1}`, icon: 'Layers' }];
    updateSelectedNodeProps({ tabs: nextTabs });
  };

  const handleRemoveTab = (idx: number) => {
    if (tabs.length <= 1) return;
    const nextTabs = [...tabs];
    nextTabs.splice(idx, 1);
    updateSelectedNodeProps({ 
      tabs: nextTabs,
      defaultTab: props.defaultTab === tabs[idx].id ? nextTabs[0].id : props.defaultTab
    });
  };

  const handleUpdateTab = (idx: number, field: string, value: string) => {
    const nextTabs = [...tabs];
    nextTabs[idx] = { ...nextTabs[idx], [field]: value };
    updateSelectedNodeProps({ tabs: nextTabs });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-bold text-indigo-600 mb-2 flex items-center gap-1.5">
          <Layers size={14} /> {isTabs ? 'Registerkarten (Tabs Layout)' : 'Akkordeon (Accordion)'}
        </h4>
        <p className="text-[10px] text-slate-500 mb-3">
          Strukturiert komplexe Seiten in übersichtliche Bereiche, Subformulare oder Unterseiten.
        </p>
      </div>

      {isTabs && (
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Design-Stil</label>
          <select
            value={props.tabStyle || 'underline'}
            onChange={(e) => updateSelectedNodeProps({ tabStyle: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs mb-3"
          >
            <option value="underline">Klassisch mit Underline</option>
            <option value="pills">Pills / Abgerundete Badges</option>
            <option value="boxed">Segmented Boxen</option>
            <option value="cards">Card-Header Tabs</option>
          </select>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-700">
            {isTabs ? 'Definierte Tabs' : 'Abschnitte'} ({tabs.length})
          </label>
          <button
            type="button"
            onClick={handleAddTab}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded"
          >
            <Plus size={12} /> Hinzufügen
          </button>
        </div>

        <div className="space-y-2">
          {tabs.map((tab: any, idx: number) => (
            <div key={tab.id || idx} className="p-2 border border-slate-200 rounded-md bg-slate-50/50 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <input
                  type="text"
                  value={tab.label}
                  onChange={(e) => handleUpdateTab(idx, 'label', e.target.value)}
                  placeholder="Tab Name"
                  className="flex-1 px-1.5 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTab(idx)}
                  disabled={tabs.length <= 1}
                  className={`p-1 text-slate-400 hover:text-red-500 rounded ${tabs.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="Tab entfernen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono">ID: {tab.id}</span>
                <label className="ml-auto flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="defaultTabRadio"
                    checked={(props.defaultTab || tabs[0].id) === tab.id}
                    onChange={() => updateSelectedNodeProps({ defaultTab: tab.id })}
                    className="text-indigo-600 text-xs"
                  />
                  Standard
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
