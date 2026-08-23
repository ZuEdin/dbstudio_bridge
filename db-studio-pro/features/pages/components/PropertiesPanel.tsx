import React from 'react';
import { CustomPage, PageComponent } from '../../../types/index';
import { 
  Trash2, Layers, LayoutTemplate, Database 
} from 'lucide-react';
import { useProjectStore } from '../../../stores/useProjectStore';
import { PageExpectedParamsEditor } from './PageExpectedParamsEditor';
import { ApiInspector } from './ApiInspector';

// Modular properties components
import { ButtonProperties } from './properties/ButtonProperties';
import { DropdownProperties } from './properties/DropdownProperties';
import { TableAndRepeaterProperties } from './properties/TableAndRepeaterProperties';
import { FormViewProperties } from './properties/FormViewProperties';
import { SubpageContainerProperties } from './properties/SubpageContainerProperties';
import { SubformProperties } from './properties/SubformProperties';
import { TabsAndAccordionProperties } from './properties/TabsAndAccordionProperties';
import { StatCardProperties } from './properties/StatCardProperties';
import { WidgetProperties } from './properties/WidgetProperties';

interface PropertiesPanelProps {
  page: CustomPage;
  onPageChange: (page: CustomPage) => void;
  selectedNodeId: string | null;
  selectedNode: PageComponent | null;
  updateSelectedNodeProps: (newProps: any) => void;
  setShowDeleteConfirm: (show: boolean) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  page,
  onPageChange,
  selectedNodeId,
  selectedNode,
  updateSelectedNodeProps,
  setShowDeleteConfirm,
}) => {
  const { queries, tables, pages, forms, customComponents = [] } = useProjectStore();

  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

  return (
    <div className="w-[320px] bg-white border-l border-slate-300 flex flex-col shadow-[-2px_0_5px_rgba(0,0,0,0.05)] z-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eigenschaften</h3>
        {selectedNodeId && selectedNodeId !== 'root' && (
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="text-slate-400 hover:text-red-500 hidden sm:block delay-150 transition" 
            title="Löschen"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      {selectedNode ? (
        <div className="p-4 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Typ: {selectedNode.type}
            </div>
          </div>

          {/* Text component properties */}
          {selectedNode.type === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Text Inhalt</label>
              <textarea
                value={selectedNode.props.text || ''}
                onChange={(e) => updateSelectedNodeProps({ text: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-slate-300 rounded min-h-[80px]"
              />
            </div>
          )}

          {/* Button component properties */}
          {selectedNode.type === 'button' && (
            <ButtonProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              forms={forms}
              tables={tables}
              pages={pages}
            />
          )}
          
          {/* Dropdown component properties */}
          {selectedNode.type === 'dropdown' && (
            <DropdownProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              queries={queries}
              tables={tables}
            />
          )}

          {/* Table View / Repeater component properties */}
          {(selectedNode.type === 'table_view' || selectedNode.type === 'list_repeater' || selectedNode.type === 'container') && (
            <TableAndRepeaterProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              queries={queries}
              tables={tables}
              pages={pages}
              forms={forms}
            />
          )}

          {/* Subpage Container component properties */}
          {selectedNode.type === 'subpage_container' && (
            <SubpageContainerProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              pages={pages}
            />
          )}

          {/* Form View component properties */}
          {selectedNode.type === 'form_view' && (
            <FormViewProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              forms={forms}
              tables={tables}
            />
          )}

          {/* Subform component properties */}
          {selectedNode.type === 'subform' && (
            <SubformProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              tables={tables}
            />
          )}

          {/* Tabs & Accordion component properties */}
          {(selectedNode.type === 'tabs_container' || selectedNode.type === 'accordion') && (
            <TabsAndAccordionProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
            />
          )}

          {/* Stat Card & KPI Widget properties */}
          {(selectedNode.type === 'stat_card' || selectedNode.type === 'kpi_widget') && (
            <StatCardProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
            />
          )}

          {/* Alert, Badge, Action Group, Search Bar, Grid properties */}
          {['alert_box', 'badge_pill', 'action_group', 'search_filter_bar', 'grid_layout'].includes(selectedNode.type) && (
            <WidgetProperties
              selectedNode={selectedNode}
              updateSelectedNodeProps={updateSelectedNodeProps}
              tables={tables}
            />
          )}

          {/* Custom Component properties */}
          {selectedNode.type === 'custom_component' && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
                  <Layers size={13} /> Custom Component (SDUI)
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Verknüpfte Komponente</label>
                <select
                  value={selectedNode.props.customComponentId || ''}
                  onChange={(e) => updateSelectedNodeProps({ customComponentId: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Keine ausgewählt --</option>
                  {(customComponents || []).map((comp: any) => (
                    <option key={comp.id} value={comp.id}>{comp.name} ({comp.type.replace('_view', '')})</option>
                  ))}
                </select>
              </div>
              {(() => {
                const comp = (customComponents || []).find((c: any) => c.id === selectedNode.props.customComponentId);
                if (!comp) return null;
                return (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded p-2.5 space-y-2 text-[11px]">
                    <div className="text-emerald-800 font-bold">Metadata Specs</div>
                    <div><span className="text-slate-500 font-semibold">Typ:</span> <span className="font-mono text-[10px] font-bold bg-white px-1 py-0.5 border rounded uppercase text-emerald-700">{comp.type}</span></div>
                    {comp.description && <div><span className="text-slate-500 font-semibold">Beschreibung:</span> <p className="italic text-slate-600 mt-0.5">{comp.description}</p></div>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Row/Column layout properties */}
          {(selectedNode.type === 'row' || selectedNode.type === 'column') && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-600 mb-2">Layout Eigenschaften</h4>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Abstand (Gap)</label>
                <select 
                  value={selectedNode.props.gap || '4'}
                  onChange={(e) => updateSelectedNodeProps({ gap: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                >
                  <option value="0">Kein (0)</option>
                  <option value="1">Klein (4px)</option>
                  <option value="2">Mittel (8px)</option>
                  <option value="4">Standard (16px)</option>
                  <option value="6">Groß (24px)</option>
                  <option value="8">Sehr Groß (32px)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ausrichtung (Align)</label>
                  <select 
                    value={selectedNode.props.alignItems || (selectedNode.type === 'row' ? 'start' : 'stretch')}
                    onChange={(e) => updateSelectedNodeProps({ alignItems: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="start">Oben/Anfang (Start)</option>
                    <option value="center">Mittig (Center)</option>
                    <option value="end">Unten/Ende (End)</option>
                    <option value="stretch">Strecken (Stretch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Verteilung (Justify)</label>
                  <select 
                    value={selectedNode.props.justifyContent || 'start'}
                    onChange={(e) => updateSelectedNodeProps({ justifyContent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="start">Anfang (Start)</option>
                    <option value="center">Mittig (Center)</option>
                    <option value="end">Ende (End)</option>
                    <option value="between">Zwischen (Between)</option>
                  </select>
                </div>
              </div>

              {selectedNode.type === 'row' && (
                <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 cursor-pointer mt-2">
                  <input 
                    type="checkbox"
                    checked={!!selectedNode.props.wrap}
                    onChange={(e) => updateSelectedNodeProps({ wrap: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Zeilenumbruch erlauben (Wrap)
                </label>
              )}
            </div>
          )}

          {/* Card properties */}
          {selectedNode.type === 'card' && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-indigo-600 mb-2">Card Eigenschaften</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Titel</label>
                <input 
                  type="text"
                  value={selectedNode.props.title || ''}
                  onChange={(e) => updateSelectedNodeProps({ title: e.target.value })}
                  placeholder="Titel der Card (z.B. {name})"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                />
              </div>
            </div>
          )}

          {/* Visibility / ngIf Condition */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-indigo-600 mb-2">Anzeige-Bedingung (ngIf)</h4>
            <div className="space-y-2 text-slate-700">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500">Filter-Feld (Variable/Spalte)</label>
                <input
                  type="text"
                  value={selectedNode.props.visibilityField || ''}
                  onChange={(e) => updateSelectedNodeProps({ visibilityField: e.target.value })}
                  placeholder="z.B. STATUS oder id"
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">Operator</label>
                  <select
                    value={selectedNode.props.visibilityOperator || '=='}
                    onChange={(e) => updateSelectedNodeProps({ visibilityOperator: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                  >
                    <option value="==">=(gleich)</option>
                    <option value="!=">!=(ungleich)</option>
                    <option value=">">&gt; (größer)</option>
                    <option value="<">&lt; (kleiner)</option>
                    <option value="contains">enthält</option>
                    <option value="not_empty">ist gesetzt (nicht leer)</option>
                    <option value="empty">ist leer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500">Vergleichswert</label>
                  <input
                    type="text"
                    value={selectedNode.props.visibilityValue || ''}
                    onChange={(e) => updateSelectedNodeProps({ visibilityValue: e.target.value })}
                    placeholder="Wert..."
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">Bedingte Sichtbarkeit basierend auf dem aktuellen Loop- oder Datensatz-Kontext.</p>
            </div>
          </div>

          {/* Custom CSS Classes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Eigene CSS-Klassen (Tailwind)</label>
            <input
              type="text"
              value={selectedNode.props.className || ''}
              onChange={(e) => updateSelectedNodeProps({ className: e.target.value })}
              placeholder="z.B. mt-4 bg-red-100"
              className="w-full px-2 py-1 text-sm border font-mono text-xs border-slate-300 rounded"
            />
          </div>

          {/* RBAC (Allowed Roles) */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-emerald-600 mb-2 flex items-center gap-1">
              <Layers size={13} /> Rollen-Berechtigung (Userlevels)
            </h4>
            <p className="text-[10px] text-slate-400 mb-2">Wählen Sie aus, welche Benutzerrollen diese Komponente sehen dürfen. (Leer lassen für alle)</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded p-2 bg-slate-50">
              {availableRoles.map(role => {
                const currentAllowed = selectedNode.props.allowedRoles || [];
                const isChecked = currentAllowed.includes(role);
                return (
                  <label key={role} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const nextRoles = e.target.checked 
                          ? [...currentAllowed, role]
                          : currentAllowed.filter((r: string) => r !== role);
                        updateSelectedNodeProps({ allowedRoles: nextRoles });
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <span>{role}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <LayoutTemplate size={16} className="text-amber-500" />
              Seiten-Konfiguration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Seitenname</label>
                <input 
                  type="text" 
                  value={page.name} 
                  onChange={e => onPageChange({ ...page, name: e.target.value })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 select-none pt-2">
                <input 
                  type="checkbox"
                  id="isSubpageCheckboxSidebar"
                  checked={!!page.isSubpage}
                  onChange={e => onPageChange({ ...page, isSubpage: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <label htmlFor="isSubpageCheckboxSidebar" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                  <Layers size={13} className="text-emerald-600"/> Als Unterseite (Sub-Page) markieren
                </label>
              </div>

              {page.isSubpage && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hauptseite (Parent Page)</label>
                    <select
                      value={page.parentPageId || ''}
                      onChange={(e) => onPageChange({ ...page, parentPageId: e.target.value || undefined })}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                    >
                      <option value="">-- Keine Hauptseite --</option>
                      {pages.filter(p => p.id !== page.id && !p.isSubpage).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded p-2.5">
                    <h4 className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 uppercase tracking-wider mb-1">
                      <Layers size={10} /> Automatische Parameter
                    </h4>
                    {(() => {
                      const relevantParentId = page.parentPageId;
                      const parentPages = relevantParentId 
                        ? pages.filter(p => p.id === relevantParentId) 
                        : pages.filter(p => p.id !== page.id);
                        
                      const embeddingContainers: { pageName: string, mapping: any[] }[] = [];
                      
                      const findContainers = (node: PageComponent, pageName: string) => {
                        if (node.type === 'subpage_container' && node.props.subPageId === page.id) {
                          embeddingContainers.push({ pageName, mapping: node.props.parameterMappings || [] });
                        }
                        if (node.children) {
                          node.children.forEach(c => findContainers(c, pageName));
                        }
                      };
                      
                      parentPages.forEach(p => findContainers(p.layout, p.name));
                      
                      if (embeddingContainers.length === 0) {
                        return (
                          <p className="text-[10px] text-slate-500 italic leading-normal">
                            Auf der Hauptseite wurde noch kein Sub-Container für diese Seite platziert. Füge dort eine "Unterseite" Komponente ein.
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-emerald-700 leading-normal">
                            Aktive Einbindungs-Mappings gefunden:
                          </p>
                          {embeddingContainers.map((item, idx) => (
                            <div key={idx} className="bg-white border border-emerald-100 rounded p-1.5 text-[9px] font-mono">
                              <span className="font-bold text-slate-700 block mb-1">Seite: {item.pageName}</span>
                              {item.mapping.length === 0 ? (
                                <span className="text-slate-400 italic">Keine Mappings</span>
                              ) : (
                                item.mapping.map((m: any, mIdx: number) => (
                                  <div key={mIdx} className="flex justify-between border-b border-slate-50 py-0.5">
                                    <span className="text-slate-500">{m.sourceKey}</span>
                                    <span className="text-emerald-600 font-bold">➔ {m.targetKey}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-white border border-slate-200 rounded p-2.5">
                    <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Erwartete Parameter</h4>
                    <p className="text-[9px] text-slate-400 mb-2">Fügen Sie Parameter hinzu, die die URL oder Hauptseite übergibt.</p>
                    <PageExpectedParamsEditor page={page} onPageChange={onPageChange} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Database size={16} className="text-indigo-500" />
              Schnittstellen &amp; API-Inspector
            </h3>
            <p className="text-[10px] text-slate-400 mb-3">Abfragen und Datenquellen live einsehen und testen.</p>
            <ApiInspector queries={queries} tables={tables} />
          </div>
        </div>
      )}
    </div>
  );
};
