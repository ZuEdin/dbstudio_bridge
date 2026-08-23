
import React, { useState } from 'react';
import { Form, Table, Query, FormElement, Relationship, getWidthClasses } from '../../types/index';
import { Layout, Eye, Edit3, Monitor, GripVertical, Type, Box, List, Columns, Plus, ChevronDown, Zap, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { LinkSubformModal } from './components/LinkSubformModal';
import { LookupConfigModal } from './components/LookupConfigModal';
import { PropertiesPanel } from './designer/PropertiesPanel';

interface FormDesignerViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  queries: Query[];
  relationships: Relationship[];
  onFormChange: (form: Form) => void;
  actionTrigger?: { action: string, timestamp: number }; 
}

export const FormDesignerView: React.FC<FormDesignerViewProps> = ({ form, allForms, allTables, queries, relationships, onFormChange, actionTrigger }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [linkingSubform, setLinkingSubform] = useState<Form | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layout' | 'validation'>('layout');
  const [activeDesignerTabs, setActiveDesignerTabs] = useState<Record<string, string>>({});
  
  const mainFormTable = allTables.find(t => t.id === form.sourceId);

  // Dynamically compute the displayed fields to ensure newly-added table fields are immediately available
  const displayedFields = React.useMemo(() => {
    if (!mainFormTable) return form.fields || [];
    const tableFields = mainFormTable.fields || [];
    const currentFields = form.fields || [];
    const existingFieldIds = new Set(currentFields.map(f => f.fieldId));
    const missing = tableFields.filter(f => !existingFieldIds.has(f.id));
    if (missing.length === 0) return currentFields;
    return [
      ...currentFields,
      ...missing.map(f => ({ fieldId: f.id, label: f.name }))
    ];
  }, [form.fields, mainFormTable?.fields]);

  // Synchronize the newly-added table fields back to the form object
  const tableFieldIdsString = JSON.stringify(mainFormTable?.fields?.map(f => f.id) || []);
  const formFieldIdsString = JSON.stringify(form.fields?.map(f => f.fieldId) || []);

  React.useEffect(() => {
    if (!mainFormTable) return;
    const tableFields = mainFormTable.fields || [];
    const currentFields = form.fields || [];
    const existingFieldIds = new Set(currentFields.map(f => f.fieldId));
    
    const missing = tableFields.filter(f => !existingFieldIds.has(f.id));
    if (missing.length > 0) {
      const merged = [
        ...currentFields,
        ...missing.map(f => ({ fieldId: f.id, label: f.name }))
      ];
      onFormChange({ ...form, fields: merged });
    }
  }, [tableFieldIdsString, formFieldIdsString, form.id]);

  // --- Helper Functions ---
  const findElement = (root: FormElement, id: string): FormElement | null => {
    if (root.id === id) return root;
    if (root.children) {
      for (const child of root.children) {
        const found = findElement(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateFormLayout = (updater: (layout: FormElement) => void) => {
      const newLayout = JSON.parse(JSON.stringify(form.layout));
      updater(newLayout);
      onFormChange({ ...form, layout: newLayout });
  };

  const handleMoveElementDirect = (id: string, direction: 'up' | 'down') => {
      updateFormLayout((layout) => {
          const moveInTree = (parent: FormElement, elementId: string): boolean => {
              if (!parent.children) return false;
              const idx = parent.children.findIndex(c => c.id === elementId);
              if (idx > -1) {
                  if (direction === 'up' && idx > 0) {
                      const temp = parent.children[idx];
                      parent.children[idx] = parent.children[idx - 1];
                      parent.children[idx - 1] = temp;
                      return true;
                  } else if (direction === 'down' && idx < parent.children.length - 1) {
                      const temp = parent.children[idx];
                      parent.children[idx] = parent.children[idx + 1];
                      parent.children[idx + 1] = temp;
                      return true;
                  }
                  return false;
              }
              return parent.children.some(c => moveInTree(c, elementId));
          };
          moveInTree(layout, id);
      });
  };

  // --- Event Handlers ---
  const handlePropertyChange = (key: keyof FormElement, value: any) => {
      if (!selectedElementId) return;
      updateFormLayout((layout) => {
          const el = findElement(layout, selectedElementId);
          if (el) {
              (el as any)[key] = value;
              // Auto-init lookup if needed
              if (key === 'widgetType' && value === 'select' && !el.lookup) {
                  el.lookup = { tableId: allTables[0]?.id || '', valueFieldId: '', labelFields: [] };
              }
          }
      });
  };

  const handleLookupSave = (newLookup: any) => {
      if (!selectedElementId) return;
      updateFormLayout((layout) => {
          const el = findElement(layout, selectedElementId);
          if (el) el.lookup = { ...el.lookup, ...newLookup };
      });
  };

  const deleteSelected = () => {
      if (!selectedElementId || selectedElementId === form.layout?.id) return;
      updateFormLayout((layout) => {
          const removeNode = (parent: FormElement, id: string): boolean => {
              if (!parent.children) return false;
              const idx = parent.children.findIndex(c => c.id === id);
              if (idx > -1) {
                  parent.children.splice(idx, 1);
                  return true;
              }
              return parent.children.some(c => removeNode(c, id));
          };
          removeNode(layout, selectedElementId);
      });
      setSelectedElementId(null);
  };

  // --- Action Trigger Handling (From Ribbon) ---
  React.useEffect(() => {
    if (!actionTrigger) return;
    if (actionTrigger.action === 'export_form') {
        // ... export logic ...
        return;
    }
    
    // Add Elements logic
    updateFormLayout((layout) => {
        let target = selectedElementId ? findElement(layout, selectedElementId) : layout;
        // If selected is a field, go to parent container
        if (target && target.type !== 'container') {
             // Basic finding of parent would be better, for now fallback to root if not container
             // Ideally we traverse to find parent, but for simplicity:
             target = layout; 
        }
        if (!target) target = layout;
        
        const newId = crypto.randomUUID();
        const newEl: FormElement = { id: newId, type: 'container', children: [] }; // Default placeholder

        if (actionTrigger.action === 'form_add_label') {
            newEl.type = 'label'; newEl.label = 'Neues Label'; newEl.className = 'font-bold text-lg mb-2';
        } else if (actionTrigger.action === 'form_add_button') {
            newEl.type = 'button'; 
            newEl.label = '⚡ Makro ausführen'; 
            newEl.className = 'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2';
            newEl.actions = [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }];
        } else if (actionTrigger.action === 'form_add_dropdown_button') {
            newEl.type = 'dropdown_button';
            newEl.label = 'Aktionen';
            newEl.className = 'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4';
            newEl.dropdownItems = [
                { id: crypto.randomUUID(), label: '⚡ Makro 1 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] },
                { id: crypto.randomUUID(), label: '⚡ Makro 2 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] }
            ];
        } else if (actionTrigger.action === 'form_add_container') {
            newEl.type = 'container'; newEl.className = 'p-4 border border-dashed border-slate-300 rounded bg-slate-50 min-h-[60px]';
        } else if (actionTrigger.action === 'form_add_2col') {
            newEl.type = 'container'; newEl.className = 'grid grid-cols-12 gap-4';
            newEl.children = [
                { id: crypto.randomUUID(), type: 'container', width: '1/2', className: 'border border-dashed border-slate-300 p-2 min-h-[60px] rounded bg-slate-50/50', children: [] },
                { id: crypto.randomUUID(), type: 'container', width: '1/2', className: 'border border-dashed border-slate-300 p-2 min-h-[60px] rounded bg-slate-50/50', children: [] }
            ];
        } else if (actionTrigger.action === 'form_add_tabs') {
            newEl.type = 'tabs';
            newEl.className = 'my-4';
            newEl.children = [
                { id: 'tabpage_' + crypto.randomUUID(), type: 'tab_page', label: 'Registerkarte 1', children: [] },
                { id: 'tabpage_' + crypto.randomUUID(), type: 'tab_page', label: 'Registerkarte 2', children: [] }
            ];
        }

        if (target && target.children) target.children.push(newEl);
    });
  }, [actionTrigger]);

  // --- Drag & Drop Logic ---

  // 1. Start Dragging an existing element
  const handleDragStart = (e: React.DragEvent, elementId: string) => {
      e.stopPropagation();
      setDraggedElementId(elementId);
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'move_element', id: elementId }));
      e.dataTransfer.effectAllowed = 'move';
  };

  // 2. Drop on Container (Append to end)
  const handleDropOnContainer = (e: React.DragEvent, containerId: string) => {
      e.preventDefault(); e.stopPropagation();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;
      
      try {
        const data = JSON.parse(json);
        updateFormLayout((layout) => {
            let container = findElement(layout, containerId);
            if (!container) return;

            // If user drops onto a 'tabs' element directly, target the active tab page!
            if (container.type === 'tabs') {
                const activePageId = activeDesignerTabs[container.id] || container.children?.[0]?.id;
                const activePage = (container.children || []).find(p => p.id === activePageId) || container.children?.[0];
                if (activePage) {
                    container = activePage;
                }
            }

            if (!container.children) container.children = [];

            if (data.type === 'move_element') {
                if (data.id === containerId) return; // Can't drop into self
                // Remove from old pos
                let itemToMove: FormElement | null = null;
                
                const removeAndFind = (parent: FormElement): boolean => {
                    if (!parent.children) return false;
                    const idx = parent.children.findIndex(c => c.id === data.id);
                    if (idx > -1) {
                        itemToMove = parent.children[idx];
                        parent.children.splice(idx, 1);
                        return true;
                    }
                    return parent.children.some(c => removeAndFind(c));
                };
                
                // If drop target is inside the dragged item (recursion check), abort
                const isChild = (parent: FormElement, childId: string): boolean => {
                    return parent.id === childId || (parent.children || []).some(c => isChild(c, childId));
                };
                const draggedItem = findElement(layout, data.id);
                if (draggedItem && isChild(draggedItem, containerId)) return;

                removeAndFind(layout);
                if (itemToMove) container.children.push(itemToMove);

            } else if (data.type === 'container') {
                container.children.push({
                    id: 'container_' + crypto.randomUUID(),
                    type: 'container',
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-4 border border-dashed border-slate-200 p-4 rounded-lg my-2',
                    children: []
                });
            } else if (data.type === 'tabs') {
                container.children.push({
                    id: 'tabs_' + crypto.randomUUID(),
                    type: 'tabs',
                    className: 'my-4',
                    children: [
                        {
                            id: 'tabpage_' + crypto.randomUUID(),
                            type: 'tab_page',
                            label: 'Registerkarte 1',
                            children: []
                        },
                        {
                            id: 'tabpage_' + crypto.randomUUID(),
                            type: 'tab_page',
                            label: 'Registerkarte 2',
                            children: []
                        }
                    ]
                });
            } else if (data.type === 'field') {
                // New Field
                container.children.push({ id: crypto.randomUUID(), type: 'field', fieldId: data.fieldId, label: data.label, className: 'mb-4' });
            } else if (data.type === 'button') {
                // New Macro Button
                container.children.push({ 
                    id: crypto.randomUUID(), 
                    type: 'button', 
                    label: data.label || '⚡ Makro ausführen', 
                    className: 'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                    actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                });
            } else if (data.type === 'dropdown_button') {
                // New Dropdown Button
                container.children.push({
                    id: crypto.randomUUID(),
                    type: 'dropdown_button',
                    label: data.label || 'Aktionen',
                    className: 'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                    dropdownItems: [
                        { id: crypto.randomUUID(), label: '⚡ Makro 1 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] },
                        { id: crypto.randomUUID(), label: '⚡ Makro 2 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] }
                    ]
                });
            } else if (data.type === 'form') {
                // New Subform
                setLinkingSubform(allForms.find(f => f.id === data.formId) || null);
                (window as any).__tempContainerId = container.id;
            }
        });
      } catch (e) { console.error(e); }
      setDraggedElementId(null);
  };

  // 3. Drop on Element (Insert Before) - For Reordering & Inserting new items
  const handleDropOnElement = (e: React.DragEvent, targetElementId: string) => {
      e.preventDefault(); e.stopPropagation();
      const json = e.dataTransfer.getData('application/json');
      if (!json) return;

      try {
          const data = JSON.parse(json);
          // If moving self, do nothing
          if (data.type === 'move_element' && data.id === targetElementId) return;

          updateFormLayout((layout) => {
              let itemToInsert: FormElement | null = null;

              // CASE A: Moving existing element
              if (data.type === 'move_element') {
                  const removeAndFind = (parent: FormElement): boolean => {
                      if (!parent.children) return false;
                      const idx = parent.children.findIndex(c => c.id === data.id);
                      if (idx > -1) {
                          itemToInsert = parent.children[idx];
                          parent.children.splice(idx, 1);
                          return true;
                      }
                      return parent.children.some(c => removeAndFind(c));
                  };
                  
                  const draggedEl = findElement(layout, data.id);
                  const targetEl = findElement(layout, targetElementId);
                  
                  // Check recursion (dropping parent into child)
                  if(draggedEl && targetEl) {
                      const isChild = (parent: FormElement, childId: string): boolean => {
                          return parent.id === childId || (parent.children || []).some(c => isChild(c, childId));
                      };
                      if (!isChild(draggedEl, targetElementId)) {
                          removeAndFind(layout);
                      }
                  }
              } 
              // CASE B: Dropping new Field
              else if (data.type === 'field') {
                  const targetField = mainFormTable?.fields.find(f => f.id === data.fieldId);
                  const isMd = targetField?.rendererType === 'markdown' || targetField?.type === 'TEXT' || (data.label || '').toLowerCase().includes('markdown') || (data.label || '').toLowerCase().includes('beschreibung') || (data.label || '').toLowerCase().includes('notiz');
                  itemToInsert = { 
                      id: crypto.randomUUID(), 
                      type: 'field', 
                      fieldId: data.fieldId, 
                      label: data.label, 
                      widgetType: isMd ? 'markdown' : undefined,
                      className: 'mb-4' 
                  };
              }
              // CASE C: Dropping container
              else if (data.type === 'container') {
                  itemToInsert = {
                      id: 'container_' + crypto.randomUUID(),
                      type: 'container',
                      className: 'grid grid-cols-1 md:grid-cols-2 gap-4 border border-dashed border-slate-200 p-4 rounded-lg my-2',
                      children: []
                  };
              }
              // CASE D: Dropping tabs
              else if (data.type === 'tabs') {
                  itemToInsert = {
                      id: 'tabs_' + crypto.randomUUID(),
                      type: 'tabs',
                      className: 'my-4',
                      children: [
                          {
                              id: 'tabpage_' + crypto.randomUUID(),
                              type: 'tab_page',
                              label: 'Registerkarte 1',
                              children: []
                          },
                          {
                              id: 'tabpage_' + crypto.randomUUID(),
                              type: 'tab_page',
                              label: 'Registerkarte 2',
                              children: []
                          }
                      ]
                  };
              }
              // CASE E: Dropping button
              else if (data.type === 'button') {
                  itemToInsert = { 
                      id: crypto.randomUUID(), 
                      type: 'button', 
                      label: data.label || '⚡ Makro ausführen', 
                      className: 'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                      actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                  };
              }
              // CASE F: Dropping dropdown_button
              else if (data.type === 'dropdown_button') {
                  itemToInsert = {
                      id: crypto.randomUUID(),
                      type: 'dropdown_button',
                      label: data.label || 'Aktionen',
                      className: 'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                      dropdownItems: [
                          { id: crypto.randomUUID(), label: '⚡ Makro 1 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] },
                          { id: crypto.randomUUID(), label: '⚡ Makro 2 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] }
                      ]
                  };
              }
              
              // Perform Insertion
              if (itemToInsert) {
                  const insertBefore = (parent: FormElement): boolean => {
                      if (!parent.children) return false;
                      const idx = parent.children.findIndex(c => c.id === targetElementId);
                      if (idx > -1) {
                          parent.children.splice(idx, 0, itemToInsert!);
                          return true;
                      }
                      return parent.children.some(c => insertBefore(c));
                  };
                  insertBefore(layout);
              }
          });
      } catch (e) { console.error(e); }
      setDraggedElementId(null);
  };

  const handleLinkSubform = (m: string, c: string) => {
      const containerId = (window as any).__tempContainerId;
      if (linkingSubform && containerId) {
          updateFormLayout((layout) => {
              const container = findElement(layout, containerId);
              if (container && container.children) {
                  container.children.push({
                      id: crypto.randomUUID(), type: 'subform', label: linkingSubform.name,
                      subform: { formId: linkingSubform.id, masterLinkFieldId: m, childLinkFieldId: c, canAdd: true, canEdit: true, canDelete: true },
                      className: 'border p-2 rounded bg-indigo-50'
                  });
              }
          });
      }
      setLinkingSubform(null);
  };

  // --- Recursive Renderer ---
  const renderElement = (el: FormElement) => {
      const isSelected = el.id === selectedElementId;
      const isDragging = el.id === draggedElementId;
      
      const commonProps = {
          onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedElementId(el.id); },
          draggable: true,
          onDragStart: (e: React.DragEvent) => handleDragStart(e, el.id),
          onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, // Allow Drop
          onDrop: (e: React.DragEvent) => handleDropOnElement(e, el.id)
      };

      const widthClass = getWidthClasses(el.width);
      const baseClass = `relative border transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 z-10' : 'border-transparent hover:border-blue-300'} ${isDragging ? 'opacity-40' : 'opacity-100'} ${widthClass}`.trim();

      // Floating Action overlay on selected element
      const SelectionOverlayActions = () => {
          if (!isSelected || el.id === form.layout?.id) return null;
          return (
              <div className="absolute -top-3 right-1.5 bg-blue-600 text-white text-[10px] rounded flex items-center shadow-md z-30 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <button 
                      onClick={(e) => { e.preventDefault(); handleMoveElementDirect(el.id, 'up'); }}
                      className="p-1 hover:bg-blue-700 transition-colors border-r border-blue-500/50"
                      title="Nach oben verschieben"
                  >
                      <ArrowUp size={10} />
                  </button>
                  <button 
                      onClick={(e) => { e.preventDefault(); handleMoveElementDirect(el.id, 'down'); }}
                      className="p-1 hover:bg-blue-700 transition-colors border-r border-blue-500/50"
                      title="Nach unten verschieben"
                  >
                      <ArrowDown size={10} />
                  </button>
                  <button 
                      onClick={(e) => { e.preventDefault(); deleteSelected(); }}
                      className="p-1 hover:bg-red-600 transition-colors"
                      title="Element löschen"
                  >
                      <Trash2 size={10} />
                  </button>
              </div>
          );
      };

      // Grip Handle for Items
      const GripHandle = () => (
          <div className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center cursor-move text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <GripVertical size={12} />
          </div>
      );

      if (el.type === 'container') {
          return (
              <div 
                key={el.id} 
                className={`${baseClass} ${el.className} min-h-[40px] group/container relative`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropOnContainer(e, el.id)}
                draggable // Containers are draggable too
                onDragStart={(e) => handleDragStart(e, el.id)}
              >
                  <SelectionOverlayActions />
                  {/* Container Grip - Top Right */}
                  <div className="absolute right-0 top-0 p-1 cursor-move text-slate-300 hover:text-blue-500 opacity-0 group-hover/container:opacity-100 z-20 bg-white/50 rounded">
                      <GripVertical size={14} />
                  </div>
                  {el.children?.length === 0 && <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded pointer-events-none">Hier Elemente ablegen</div>}
                  {el.children?.map(renderElement)}
              </div>
          );
      }

      if (el.type === 'tabs') {
          const tabPages = el.children || [];
          const activeTabPageId = activeDesignerTabs[el.id] || tabPages[0]?.id || '';
          const activePage = tabPages.find(p => p.id === activeTabPageId) || tabPages[0];

          return (
              <div 
                key={el.id} 
                className={`${baseClass} bg-slate-50 dark:bg-slate-900/40 p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl group relative`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropOnContainer(e, el.id)}
                draggable
                onDragStart={(e) => handleDragStart(e, el.id)}
              >
                  <SelectionOverlayActions />
                  <div className="absolute right-0 top-0 p-1 cursor-move text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 z-20 bg-white/50 dark:bg-slate-800/50 rounded">
                      <GripVertical size={14} />
                  </div>

                  {/* Tab Headers in Designer */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 px-2 rounded-t-lg items-center justify-between">
                      <div className="flex overflow-x-auto whitespace-nowrap">
                          {tabPages.map((tab, idx) => {
                              const isActive = tab.id === activeTabPageId;
                              return (
                                  <button
                                    key={tab.id}
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setActiveDesignerTabs(prev => ({ ...prev, [el.id]: tab.id })); setSelectedElementId(tab.id); }}
                                    className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-all ${
                                      isActive
                                        ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-900 shadow-sm'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                  >
                                      {tab.label || `Registerkarte ${idx + 1}`}
                                  </button>
                              );
                          })}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Add a new tab page
                            const newTabPage: FormElement = {
                                id: 'tabpage_' + crypto.randomUUID(),
                                type: 'tab_page',
                                label: 'Neue Registerkarte',
                                children: []
                            };
                            const updatedLayout = JSON.parse(JSON.stringify(form.layout));
                            const foundTabs = findElement(updatedLayout, el.id);
                            if (foundTabs) {
                                if (!foundTabs.children) foundTabs.children = [];
                                foundTabs.children.push(newTabPage);
                                onFormChange({ ...form, layout: updatedLayout });
                                setActiveDesignerTabs(prev => ({ ...prev, [el.id]: newTabPage.id }));
                                setSelectedElementId(newTabPage.id);
                            }
                        }}
                        className="m-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                          <Plus size={10} strokeWidth={3} /> Tab hinzufügen
                      </button>
                  </div>

                  {/* Active Tab Page Content */}
                  <div className="p-2 border-x border-b border-slate-200 dark:border-slate-800 rounded-b-lg bg-white dark:bg-slate-900/20 min-h-[80px]">
                      {activePage ? renderElement(activePage) : <div className="text-xs text-slate-400 text-center py-4">Keine Registerkarten vorhanden</div>}
                  </div>
              </div>
          );
      }

      if (el.type === 'tab_page') {
          return (
              <div 
                key={el.id} 
                className={`${baseClass} bg-slate-50/50 p-2 border border-dashed border-slate-200 dark:border-slate-800 rounded min-h-[60px] group relative`}
                onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => handleDropOnContainer(e, el.id)}
              >
                  <SelectionOverlayActions />
                  <div className="text-[10px] text-slate-400 font-semibold mb-2 flex items-center justify-between border-b border-slate-100 pb-1">
                      <span>Registerkarte: {el.label}</span>
                  </div>
                  {el.children?.length === 0 && <div className="text-xs text-slate-400 text-center py-2 pointer-events-none">Hier Elemente ablegen</div>}
                  {el.children?.map(renderElement)}
              </div>
          );
      }
      
      if (el.type === 'field') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} bg-white p-3 pr-4 pl-8 rounded-lg border border-slate-200 group shadow-sm hover:shadow transition-shadow`} {...commonProps}>
                  <SelectionOverlayActions />
                  <GripHandle />
                  {!el.hideLabel ? (
                      <label className="block text-sm font-medium text-slate-700 mb-1.5 pointer-events-none">{el.label}</label>
                  ) : (
                      <span className="block text-[10px] text-slate-400 italic mb-1.5 pointer-events-none">{el.label} (Beschriftung ausgeblendet)</span>
                  )}
                  <div className="flex gap-2 relative pointer-events-none">
                    {el.widgetType === 'select' ? (
                         <div className="w-full relative pointer-events-none">
                             <select className="w-full appearance-none bg-white border border-slate-300 text-slate-600 text-sm rounded px-3 py-2 shadow-sm pointer-events-none" disabled>
                                  <option>Auswählen...</option>
                             </select>
                             <div className="absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                                <ChevronDown size={14} />
                             </div>
                         </div>
                    ) : el.widgetType === 'markdown' ? (
                         <div className="w-full bg-slate-50 border border-slate-300 rounded-lg overflow-hidden shadow-2xs pointer-events-none">
                             <div className="bg-slate-100 px-2.5 py-1 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                                 <div className="flex items-center gap-1.5 font-semibold text-slate-500">
                                     <span className="font-bold text-slate-700">B</span>
                                     <span className="italic text-slate-700">I</span>
                                     <span>H1</span>
                                     <span>H2</span>
                                     <span>• Liste</span>
                                     <span>📊 Tabelle</span>
                                 </div>
                                 <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">Markdown</span>
                             </div>
                             <div className="p-2.5 text-xs text-slate-400 font-mono leading-relaxed">
                                 # Überschrift<br/>
                                 - **Formatierter Text** und Listen...
                             </div>
                         </div>
                    ) : el.widgetType === 'textarea' ? (
                         <textarea className="w-full bg-slate-50 border border-slate-300 text-slate-400 text-sm rounded px-3 py-2 shadow-none pointer-events-none min-h-[80px]" placeholder="Text eingeben..." readOnly />
                    ) : (el.widgetType === 'checkbox' || el.widgetType === 'switch') ? (
                         <div className="flex items-center gap-2 pointer-events-none py-1.5">
                             {el.widgetType === 'switch' ? (
                                  <div className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-slate-200 transition-colors pointer-events-none">
                                      <span className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition pointer-events-none" />
                                  </div>
                             ) : (
                                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" readOnly />
                             )}
                             <span className="text-sm text-slate-600">{el.widgetType === 'switch' ? 'Schalter' : 'Aktivieren'}</span>
                         </div>
                    ) : (
                         <input type="text" className="w-full bg-slate-50 border border-slate-300 text-slate-400 text-sm rounded px-3 py-2 shadow-none pointer-events-none" placeholder="Eingabe..." readOnly />
                    )}
                    {el.widgetType === 'select' && el.lookup?.allowQuickCreate && (
                        <div className="h-9 w-9 shrink-0 bg-emerald-50 border border-emerald-200 rounded flex items-center justify-center text-emerald-600 shadow-sm pointer-events-none" title="Quick Create aktiv">
                            <Plus size={16} strokeWidth={2.5} />
                        </div>
                    )}
                  </div>
              </div>
          );
      }
      
      if (el.type === 'label') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} pl-8 py-2 group relative`} {...commonProps}>
                  <SelectionOverlayActions />
                  <GripHandle />
                  {el.label}
              </div>
          );
      }

      if (el.type === 'button') {
          return (
              <div key={el.id} className={`${baseClass} pl-8 pr-2 py-2 group inline-block mr-2 relative`} {...commonProps}>
                  <SelectionOverlayActions />
                  <GripHandle />
                  <button className={`${el.className} pointer-events-none opacity-90 shadow-sm transition-all focus:ring`}>
                      {el.label || 'Button'}
                  </button>
                  {el.actions && el.actions.length > 0 && (
                      <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow border border-white">
                          {el.actions.length}
                      </div>
                  )}
              </div>
          );
      }

      if (el.type === 'dropdown_button') {
          const count = el.dropdownItems?.length || 0;
          return (
              <div key={el.id} className={`${baseClass} pl-8 pr-2 py-2 group inline-block mr-2 relative`} {...commonProps}>
                  <SelectionOverlayActions />
                  <GripHandle />
                  <div className="inline-flex items-center gap-2 pointer-events-none">
                      <button className={`${el.className || 'bg-slate-800 text-white font-bold py-2 px-4 rounded-lg shadow-sm'} opacity-90 transition-all flex items-center gap-2`}>
                          <span>{el.label || 'Aktionen'}</span>
                          <ChevronDown size={14} />
                      </button>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold border border-slate-300">
                          {count} {count === 1 ? 'Sub-Button' : 'Sub-Buttons'}
                      </span>
                  </div>
              </div>
          );
      }

      if (el.type === 'subform') {
          return (
              <div key={el.id} className={`${baseClass} ${el.className} p-4 pl-6 group relative`} {...commonProps}>
                  <SelectionOverlayActions />
                  <GripHandle />
                  <div className="font-bold text-indigo-700 pointer-events-none">Subform: {el.label}</div>
                  <div className="text-xs text-indigo-400">Verknüpftes Formular</div>
              </div>
          );
      }
      return null;
  };

  const selectedEl = form.layout ? findElement(form.layout, selectedElementId || '') : null;

  return (
    <div className="h-full bg-slate-200 flex">
      {/* Modals */}
      {linkingSubform && (
        <LinkSubformModal 
          mainForm={form}
          subForm={linkingSubform}
          onLink={handleLinkSubform}
          onClose={() => setLinkingSubform(null)}
        />
      )}
      {showLookupModal && selectedEl && selectedEl.lookup && (
          <LookupConfigModal allTables={allTables} queries={queries} initialConfig={selectedEl.lookup} onSave={handleLookupSave} onClose={() => setShowLookupModal(false)} />
      )}

      {/* Main Canvas */}
      <div className="flex-1 p-8 overflow-y-auto" onClick={() => setSelectedElementId(null)}>
         <div className="max-w-4xl mx-auto">
            <div className="bg-white min-h-[600px] shadow-lg rounded-lg overflow-hidden flex flex-col border border-slate-300">
                <div className="p-4 bg-slate-800 text-white font-bold flex justify-between items-center shrink-0">
                    <div className="flex gap-4 items-center">
                        <span>{form.name}</span>
                        <div className="flex bg-black/20 rounded p-1">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveTab('layout'); }} 
                                className={`px-3 py-1 rounded text-sm transition-colors ${activeTab === 'layout' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                            >
                                Layout
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveTab('validation'); }} 
                                className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${activeTab === 'validation' ? 'bg-white text-slate-900 font-bold' : 'text-white/70 hover:text-white'}`}
                            >
                                <Monitor size={14}/> UX & Logik
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onFormChange({...form, mode: form.mode === 'edit' ? 'readonly' : 'edit'}); }} className="text-xs bg-slate-700 px-2 py-1 rounded">
                            {form.mode === 'edit' ? 'Modus: Bearbeiten' : 'Modus: Lesen'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto relative">
                    {activeTab === 'layout' ? (
                        <div className="p-6">
                            {form.layout ? renderElement(form.layout) : <div className="text-slate-400 text-center mt-20">Kein Layout.</div>}
                        </div>
                    ) : (
                        <div className="p-6 animate-in fade-in space-y-6">
                            <div className="bg-slate-100 p-4 border border-slate-200 rounded-lg">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Type size={18} /> Cross-Field Validation</h3>
                                <p className="text-xs text-slate-600 mb-4">Spezifische Sichtbarkeits- und Pflichtfeld-Regeln für das User Interface.</p>
                                
                                <div className="space-y-2">
                                    {(form.crossFieldValidations || []).map((rule, idx) => (
                                        <div key={rule.id} className="flex flex-wrap gap-2 sm:gap-3 items-center bg-white border border-slate-200 rounded p-3 text-sm shadow-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-700">Wenn</span>
                                                <select 
                                                     className="border rounded p-1.5 bg-slate-50 text-xs font-bold text-blue-600 max-w-[150px]"
                                                     value={rule.triggerFieldId}
                                                     onChange={e => {
                                                         const updated = [...(form.crossFieldValidations || [])];
                                                         updated[idx] = { ...updated[idx], triggerFieldId: e.target.value };
                                                         onFormChange({...form, crossFieldValidations: updated});
                                                     }}
                                                 >
                                                    {displayedFields.map(f => (
                                                        <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
                                                    ))}
                                                 </select>
                                                <select 
                                                    className="border rounded p-1.5 bg-slate-50 text-xs"
                                                    value={rule.condition}
                                                    onChange={e => {
                                                        const updated = [...(form.crossFieldValidations || [])];
                                                        updated[idx] = { ...updated[idx], condition: e.target.value as any };
                                                        onFormChange({...form, crossFieldValidations: updated});
                                                    }}
                                                >
                                                    <option value="equals">=(gleich)</option>
                                                    <option value="not_equals">!=(ungleich)</option>
                                                    <option value="greater_than">&gt;(größer als)</option>
                                                    <option value="less_than">&lt;(kleiner als)</option>
                                                    <option value="not_empty">ist gefüllt</option>
                                                    <option value="is_empty">ist leer</option>
                                                    <option value="is_true">ist angehakt</option>
                                                    <option value="is_false">ist nicht angehakt</option>
                                                </select>
                                                {(rule.condition === 'equals' || rule.condition === 'not_equals' || rule.condition === 'greater_than' || rule.condition === 'less_than') && (
                                                    <input 
                                                        type="text" 
                                                        className="border rounded p-1.5 w-24 text-xs" 
                                                        placeholder="Wert..."
                                                        value={rule.triggerValue || ''}
                                                        onChange={e => {
                                                            const updated = [...(form.crossFieldValidations || [])];
                                                            updated[idx] = { ...updated[idx], triggerValue: e.target.value };
                                                            onFormChange({...form, crossFieldValidations: updated});
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            
                                            <span className="text-slate-400 font-bold hidden sm:inline">»</span>
                                            
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-700">dann mache</span>
                                                <select 
                                                     className="border rounded p-1.5 bg-slate-50 text-xs font-bold text-indigo-600 max-w-[150px]"
                                                     value={rule.targetFieldId}
                                                     onChange={e => {
                                                         const updated = [...(form.crossFieldValidations || [])];
                                                         updated[idx] = { ...updated[idx], targetFieldId: e.target.value };
                                                         onFormChange({...form, crossFieldValidations: updated});
                                                     }}
                                                 >
                                                    {displayedFields.map(f => (
                                                        <option key={f.fieldId} value={f.fieldId}>{f.label}</option>
                                                    ))}
                                                 </select>
                                                <select 
                                                    className="border rounded p-1.5 bg-slate-50 text-xs"
                                                    value={rule.action}
                                                    onChange={e => {
                                                        const updated = [...(form.crossFieldValidations || [])];
                                                        updated[idx] = { ...updated[idx], action: e.target.value as any };
                                                        onFormChange({...form, crossFieldValidations: updated});
                                                    }}
                                                >
                                                    <option value="require">zum Pflichtfeld</option>
                                                    <option value="hide">unsichtbar</option>
                                                    <option value="disable">gesperrt (readonly)</option>
                                                </select>
                                            </div>
                                            
                                            <button 
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded ml-auto text-xs font-bold shrink-0 self-start sm:self-auto"
                                                onClick={() => {
                                                    const updated = (form.crossFieldValidations || []).filter(r => r.id !== rule.id);
                                                    onFormChange({...form, crossFieldValidations: updated});
                                                }}
                                            >
                                                Löschen
                                            </button>
                                        </div>
                                    ))}

                                    <button 
                                        className="mt-4 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold"
                                        onClick={() => {
                                            const newRule = {
                                                id: crypto.randomUUID(),
                                                triggerFieldId: displayedFields[0]?.fieldId || '',
                                                condition: 'equals' as const,
                                                triggerValue: '',
                                                targetFieldId: displayedFields[1]?.fieldId || '',
                                                action: 'require' as const
                                            };
                                            onFormChange({...form, crossFieldValidations: [...(form.crossFieldValidations || []), newRule]});
                                        }}
                                    >
                                        <Plus size={16}/> Neue UX Regel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
         </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 bg-white border-l border-slate-300 flex flex-col h-full">
          <div className="h-2/3 overflow-hidden flex flex-col">
            <PropertiesPanel 
                form={form}
                selectedElement={selectedEl}
                allTables={allTables}
                allForms={allForms}
                onPropertyChange={handlePropertyChange}
                onFormPropertyChange={(k, v) => onFormChange({...form, [k]: v})}
                onLookupPropertyChange={(k, v) => { if(selectedEl?.lookup) handleLookupSave({ [k]: v }); }}
                onSubformPermissionChange={(k, v) => { if(selectedEl?.subform) { 
                    updateFormLayout(l => { const el = findElement(l, selectedElementId!); if(el && el.subform) (el.subform as any)[k] = v; });
                }}}
                onDeleteSelected={deleteSelected}
                onMoveElement={(dir) => { if (selectedElementId) handleMoveElementDirect(selectedElementId, dir); }}
                onShowLookupModal={() => setShowLookupModal(true)}
                onToggleFullScreen={() => onFormChange({...form, settings: {...form.settings, isFullScreen: !form.settings?.isFullScreen}})}
                onToggleEditButton={() => onFormChange({...form, settings: {...form.settings, showEditToggle: !form.settings?.showEditToggle}})}
                onToggleTableSplitView={() => onFormChange({...form, settings: {...form.settings, showTableSplitView: !form.settings?.showTableSplitView}})}
            />
          </div>
          <div className="h-1/3 border-t border-slate-300 p-4 overflow-y-auto bg-slate-50">
             <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Struktur-Elemente</h4>
             <div className="space-y-1 mb-4">
                  <div 
                     draggable 
                     onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'container', label: 'Zweispaltiger Container' })); }}
                     onClick={() => {
                         updateFormLayout(layout => {
                             if (!layout.children) layout.children = [];
                             layout.children.push({
                                 id: 'container_' + crypto.randomUUID(),
                                 type: 'container',
                                 className: 'grid grid-cols-1 md:grid-cols-2 gap-4 border border-dashed border-slate-200 p-4 rounded-lg my-2',
                                 children: []
                             });
                         });
                     }}
                     className="bg-sky-50 border border-sky-300 p-2 rounded-lg cursor-grab text-xs flex items-center justify-between text-sky-950 hover:border-sky-400 hover:bg-sky-100/80 active:cursor-grabbing font-bold shadow-xs transition-colors"
                     title="Zweispaltiger Container für Felder"
                  >
                     <span className="flex items-center gap-2">
                       <Columns size={14} className="text-sky-600" /> 
                       Spaltenbereich (Container)
                     </span>
                     <Plus size={14} className="text-sky-700" />
                  </div>

                  <div 
                     draggable 
                     onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'tabs', label: 'Registerkarte' })); }}
                     onClick={() => {
                         updateFormLayout(layout => {
                             if (!layout.children) layout.children = [];
                             const tabsId = 'tabs_' + crypto.randomUUID();
                             layout.children.push({
                                 id: tabsId,
                                 type: 'tabs',
                                 className: 'my-4',
                                 children: [
                                     {
                                         id: 'tabpage_' + crypto.randomUUID(),
                                         type: 'tab_page',
                                         label: 'Registerkarte 1',
                                         children: []
                                     },
                                     {
                                         id: 'tabpage_' + crypto.randomUUID(),
                                         type: 'tab_page',
                                         label: 'Registerkarte 2',
                                         children: []
                                     }
                                 ]
                             });
                         });
                     }}
                     className="bg-emerald-50 border border-emerald-300 p-2 rounded-lg cursor-grab text-xs flex items-center justify-between text-emerald-950 hover:border-emerald-400 hover:bg-emerald-100/80 active:cursor-grabbing font-bold shadow-xs transition-colors"
                     title="Registerkartensteuerung (Tabs) zum Organisieren von Formularbereichen"
                  >
                     <span className="flex items-center gap-2">
                       <Layout size={14} className="text-emerald-600" /> 
                       Registerkarten (Tabulator)
                     </span>
                     <Plus size={14} className="text-emerald-700" />
                  </div>
             </div>

             <h4 className="font-bold text-xs text-slate-500 uppercase mb-2">Verfügbare Felder</h4>
             <p className="text-[10px] text-slate-400 mb-2">Drag & Drop auf das Formular.</p>
             <div className="space-y-1">
                 {displayedFields.map(f => (
                     <div 
                        key={f.fieldId} 
                        draggable 
                        onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'field', fieldId: f.fieldId, label: f.label })); }} 
                        className="bg-white border p-1.5 rounded cursor-grab text-sm hover:shadow-sm flex gap-2 hover:border-blue-400 active:cursor-grabbing"
                     >
                         <GripVertical size={14} className="text-slate-400"/> {f.label}
                     </div>
                 ))}
             </div>
             <h4 className="font-bold text-xs text-slate-500 uppercase mt-4 mb-2">Schaltflächen & Makros</h4>
             <div className="space-y-1">
                 <div 
                    draggable 
                    onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'button', label: '⚡ Makro ausführen' })); }}
                    onClick={() => {
                        updateFormLayout(layout => {
                            if (!layout.children) layout.children = [];
                            layout.children.push({
                                id: crypto.randomUUID(),
                                type: 'button',
                                label: '⚡ Makro ausführen',
                                className: 'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                                actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }]
                            });
                        });
                    }}
                    className="bg-amber-50 border border-amber-300 p-2 rounded-lg cursor-grab text-xs flex items-center justify-between text-amber-950 hover:border-amber-400 hover:bg-amber-100/80 active:cursor-grabbing font-bold shadow-xs transition-colors"
                    title="Klicken oder Ziehen, um eine Makro-Schaltfläche hinzuzufügen"
                 >
                     <span className="flex items-center gap-2"><Zap size={14} className="text-amber-500 fill-amber-400" /> Schaltfläche (Makro)</span>
                     <Plus size={14} className="text-amber-700" />
                 </div>

                 <div 
                    draggable 
                    onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'dropdown_button', label: 'Aktionen' })); }}
                    onClick={() => {
                        updateFormLayout(layout => {
                            if (!layout.children) layout.children = [];
                            layout.children.push({
                                id: crypto.randomUUID(),
                                type: 'dropdown_button',
                                label: 'Aktionen',
                                className: 'bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2 mb-4',
                                dropdownItems: [
                                    { id: crypto.randomUUID(), label: '⚡ Makro 1 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] },
                                    { id: crypto.randomUUID(), label: '⚡ Makro 2 ausführen', actions: [{ id: crypto.randomUUID(), trigger: 'OnClick', actionType: 'RunMacro', macroId: '' }] }
                                ]
                            });
                        });
                    }}
                    className="bg-indigo-50 border border-indigo-300 p-2 rounded-lg cursor-grab text-xs flex items-center justify-between text-indigo-950 hover:border-indigo-400 hover:bg-indigo-100/80 active:cursor-grabbing font-bold shadow-xs transition-colors"
                    title="Klicken oder Ziehen, um einen Dropdown-Button mit Unterbefehlen hinzuzufügen"
                 >
                     <span className="flex items-center gap-2">
                       <Zap size={14} className="text-indigo-600 fill-indigo-400" /> 
                       Dropdown-Schaltfläche
                     </span>
                     <ChevronDown size={14} className="text-indigo-700" />
                 </div>
             </div>

             <h4 className="font-bold text-xs text-slate-500 uppercase mt-4 mb-2">Unterformulare</h4>
             <div className="space-y-1">
                 {allForms.filter(f => f.id !== form.id).map(f => (
                     <div key={f.id} draggable onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'form', formId: f.id })); }} className="bg-indigo-50 border border-indigo-200 p-1.5 rounded cursor-grab text-sm flex gap-2 text-indigo-700 hover:border-indigo-400 active:cursor-grabbing">
                         <Layout size={14}/> {f.name}
                     </div>
                 ))}
             </div>
          </div>
      </div>
    </div>
  );
};
