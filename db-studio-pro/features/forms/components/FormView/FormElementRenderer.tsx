import React from 'react';
import { Layout, Plus, Zap, AlertCircle } from 'lucide-react';
import { Form, Table, FormElement, Query, getWidthClasses } from '../../../../types/index';
import { FormWidget } from '../../renderer/FormWidget';
import { DropdownButtonWidget } from './DropdownButtonWidget';
import { executeMacro, getSavedMacros } from '../../../logic/MacroEngine';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface FormElementRendererProps {
  el: FormElement;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  executeQuery?: (q: Query) => Record<string, any>[];
  onTableChange: (table: Table) => void;
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    confirmClass?: string
  ) => void;
  currentRecord: Record<string, any>;
  isReadOnly: boolean;
  isCreating: boolean;
  sourceTable?: Table;
  handleInputChange: (fieldName: string, value: any) => void;
  getLookupOptions: (config: any) => any[];
  setLookupModal: React.Dispatch<React.SetStateAction<any>>;
  setSubformModal: React.Dispatch<React.SetStateAction<any>>;
  handleContextMenu: (e: React.MouseEvent, fieldName: string, val: any) => void;
  setFocusedFieldName: (name: string | null) => void;
  getFieldName: (fieldId: string) => string;
  evalVisibility: (el: FormElement) => boolean;
  FormViewComponent: React.ComponentType<any>;
}

const TabsContainerWidget: React.FC<{
  el: FormElement;
  renderChild: (childEl: FormElement) => React.ReactNode;
}> = ({ el, renderChild }) => {
  const tabPages = el.children || [];
  const [activeTabId, setActiveTabId] = React.useState<string>(() => tabPages[0]?.id || '');

  // Synchronize activeTabId if children change
  const currentTabId = tabPages.some(t => t.id === activeTabId) ? activeTabId : (tabPages[0]?.id || '');
  const activePage = tabPages.find(child => child.id === currentTabId) || tabPages[0];

  return (
    <div key={el.id} className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm my-4 ${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`tabs-${el.id}`}>
      {/* Tab Headers */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 overflow-x-auto whitespace-nowrap">
        {tabPages.map((tab, idx) => {
          const isActive = tab.id === currentTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={`px-4 py-2.5 text-xs md:text-sm font-semibold border-b-2 transition-all focus:outline-none ${
                isActive
                  ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
              }`}
            >
              {tab.label || `Registerkarte ${idx + 1}`}
            </button>
          );
        })}
      </div>
      
      {/* Tab Content */}
      <div className="p-4 bg-white dark:bg-slate-900 min-h-[60px]">
        {activePage ? renderChild(activePage) : <p className="text-slate-400 text-sm">Leere Registerkarte.</p>}
      </div>
    </div>
  );
};

export const FormElementRenderer: React.FC<FormElementRendererProps> = ({
  el,
  allForms,
  allTables,
  queries,
  executeQuery,
  onTableChange,
  showConfirmation,
  currentRecord,
  isReadOnly,
  isCreating,
  sourceTable,
  handleInputChange,
  getLookupOptions,
  setLookupModal,
  setSubformModal,
  handleContextMenu,
  setFocusedFieldName,
  getFieldName,
  evalVisibility,
  FormViewComponent,
}) => {
  if (!evalVisibility(el)) return null;

  const renderChild = (childEl: FormElement) => (
    <FormElementRenderer
      key={childEl.id}
      el={childEl}
      allForms={allForms}
      allTables={allTables}
      queries={queries}
      executeQuery={executeQuery}
      onTableChange={onTableChange}
      showConfirmation={showConfirmation}
      currentRecord={currentRecord}
      isReadOnly={isReadOnly}
      isCreating={isCreating}
      sourceTable={sourceTable}
      handleInputChange={handleInputChange}
      getLookupOptions={getLookupOptions}
      setLookupModal={setLookupModal}
      setSubformModal={setSubformModal}
      handleContextMenu={handleContextMenu}
      setFocusedFieldName={setFocusedFieldName}
      getFieldName={getFieldName}
      evalVisibility={evalVisibility}
      FormViewComponent={FormViewComponent}
    />
  );

  if (el.type === 'container') {
    return (
      <div key={el.id} className={`${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`container-${el.id}`}>
        {el.children?.map(renderChild)}
      </div>
    );
  }

  if (el.type === 'tabs') {
    return <TabsContainerWidget key={el.id} el={el} renderChild={renderChild} />;
  }

  if (el.type === 'tab_page') {
    return (
      <div key={el.id} className={`${el.className || ''} w-full flex flex-col gap-4`.trim()} id={`tabpage-${el.id}`}>
        {el.children?.map(renderChild)}
      </div>
    );
  }

  if (el.type === 'label') {
    return (
      <div key={el.id} className={`${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`label-${el.id}`}>
        {el.label}
      </div>
    );
  }

  if (el.type === 'button') {
    const handleButtonClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!el.actions || el.actions.length === 0) {
        alert(`Schaltfläche "${el.label || 'Button'}": Keine Aktion konfiguriert.`);
        return;
      }

      el.actions.forEach((act) => {
        if (act.actionType === 'RunMacro') {
          const savedMacros = getSavedMacros();
          const macro = savedMacros.find((m) => m.id === act.macroId);
          if (macro) {
            const store = (useProjectStore as any)?.getState ? (useProjectStore as any).getState() : {};
            executeMacro(macro, {
              tables: allTables,
              queries: queries && queries.length > 0 ? queries : (store.queries || []),
              reports: store.reports || [],
              relationships: store.relationships || [],
              currentRecord,
              onTableChange,
              onShowToast: (msg, type) => {
                alert(`[${type?.toUpperCase() || 'INFO'}] ${msg}`);
              },
            });
          } else if (!act.macroId) {
            alert(`Schaltfläche "${el.label || 'Makro'}": Bitte wählen Sie im Formularentwurf in den Eigenschaften ein Makro aus.`);
          } else {
            alert(`Makro mit ID "${act.macroId}" nicht gefunden.`);
          }
        } else if (act.actionType === 'ShowToast') {
          alert(act.toastMessage || 'Aktion ausgeführt!');
        } else if (act.actionType === 'OpenModal' && act.modalId) {
          const targetForm = allForms.find((f) => f.id === act.modalId);
          if (targetForm) {
            setSubformModal({
              isOpen: true,
              formId: targetForm.id,
              parentField: '',
              childField: '',
              linkValue: null,
            });
          }
        } else if (act.actionType === 'Navigate' && act.routeUrl) {
          window.location.hash = act.routeUrl;
        }
      });
    };

    return (
      <div key={el.id} className={`my-2 inline-block ${el.className || ''} ${getWidthClasses(el.width)}`.trim()} id={`btn-container-${el.id}`}>
        <button
          type="button"
          onClick={handleButtonClick}
          className={
            el.className ||
            'bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2'
          }
        >
          <Zap size={16} className="text-amber-300 fill-amber-200" />
          <span>{el.label || 'Makro ausführen'}</span>
        </button>
      </div>
    );
  }

  if (el.type === 'dropdown_button') {
    return (
      <DropdownButtonWidget
        key={el.id}
        el={el}
        allForms={allForms}
        allTables={allTables}
        queries={queries}
        currentRecord={currentRecord}
        onTableChange={onTableChange}
        setSubformModal={setSubformModal}
      />
    );
  }

  if (el.type === 'field') {
    const fieldName = sourceTable?.fields.find((f) => f.id === el.fieldId)?.name || '';
    const fieldValue = currentRecord[fieldName] ?? '';
    return (
      <FormWidget
        key={el.id}
        element={el}
        value={fieldValue}
        sourceTable={sourceTable}
        isReadOnly={isReadOnly}
        onChange={handleInputChange}
        getLookupOptions={getLookupOptions}
        onOpenLookupModal={(tid, fname, fid) =>
          setLookupModal({ isOpen: true, targetTableId: tid, sourceFieldName: fname, formId: fid })
        }
        onContextMenu={handleContextMenu}
        onFocusField={(fname) => setFocusedFieldName(fname)}
      />
    );
  }

  if (el.type === 'subform' && el.subform) {
    if (isCreating) {
      return (
        <div
          key={el.id}
          className={`border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 mt-4 text-center ${
            el.className || ''
          }`}
          id={`subform-creating-block-${el.id}`}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <AlertCircle size={24} />
            <p className="font-semibold text-sm">Unterformular "{el.label}" nicht verfügbar</p>
            <p className="text-xs">Bitte speichern Sie den Hauptdatensatz, bevor Sie Einträge hinzufügen.</p>
          </div>
        </div>
      );
    }

    const subDef = allForms.find((f) => f.id === el.subform!.formId);
    if (!subDef) return <div key={el.id} className="text-red-500">Subform nicht gefunden.</div>;

    const subTable = allTables.find((t) => t.id === subDef.sourceId);
    let subformData: Record<string, any>[] = [];

    if (sourceTable && subTable && currentRecord) {
      const masterLinkField = sourceTable.fields.find((f) => f.id === el.subform!.masterLinkFieldId);
      const childLinkField = subTable.fields.find((f) => f.id === el.subform!.childLinkFieldId);
      if (masterLinkField && childLinkField) {
        const linkValue = currentRecord[masterLinkField.name];
        subformData = (subTable.data || []).filter(
          (row) => linkValue !== undefined && linkValue !== null && linkValue !== '' && String(row[childLinkField.name]) === String(linkValue)
        );
      }
    }

    const canAdd = el.subform.canAdd !== false;
    const canEdit = el.subform.canEdit !== false;
    const canDelete = el.subform.canDelete !== false;

    const handleOpenSubformModalLocal = (recordToEdit?: Record<string, any>) => {
      if (!sourceTable || !currentRecord) return;
      const masterLinkField = sourceTable.fields.find((f) => f.id === el.subform!.masterLinkFieldId);
      if (masterLinkField) {
        const masterFieldName = masterLinkField.name;
        const linkValue = currentRecord[masterFieldName];
        setSubformModal({
          isOpen: true,
          formId: el.subform!.formId,
          parentField: el.subform!.masterLinkFieldId,
          childField: el.subform!.childLinkFieldId,
          linkValue,
          recordToEdit,
        });
      }
    };

    const handleDeleteSubformRowLocal = (rowItem: Record<string, any>) => {
      if (!subTable) return;
      showConfirmation(
        'Eintrag löschen',
        'Möchten Sie diesen Positionseintrag wirklich löschen?',
        () => {
          const rowId = rowItem.id ?? rowItem.Id;
          const updatedData = (subTable.data || []).filter((r) => (r.id ?? r.Id) !== rowId);
          onTableChange({
            ...subTable,
            data: updatedData,
          });
        },
        'Löschen',
        'bg-rose-600 hover:bg-rose-700'
      );
    };

    const getSubLayoutFieldEls = (container: FormElement, acc: FormElement[] = []): FormElement[] => {
      if (container.type === 'field' && container.fieldId) {
        acc.push(container);
      }
      if (container.children) {
        container.children.forEach((c) => getSubLayoutFieldEls(c, acc));
      }
      return acc;
    };

    const subLayoutFields = subDef.layout ? getSubLayoutFieldEls(subDef.layout) : [];
    const childLinkFieldObj = subTable ? subTable.fields.find((f) => f.id === el.subform!.childLinkFieldId) : null;

    const subColumns = (
      subLayoutFields.length > 0
        ? subLayoutFields
        : (subTable?.fields || []).map((f) => ({ type: 'field' as const, id: f.id, fieldId: f.id, label: f.name }))
    ).filter((colEl) => {
      if (!subTable) return false;
      const f = subTable.fields.find((field) => field.id === colEl.fieldId);
      if (!f || f.isPrimaryKey) return false;
      if (childLinkFieldObj && (f.id === childLinkFieldObj.id || f.name === childLinkFieldObj.name)) return false;
      return true;
    });

    return (
      <div
        key={el.id}
        className={`border border-slate-300 rounded-md overflow-hidden mt-4 ${el.className || ''} ${getWidthClasses(el.width)}`.trim()}
        id={`subform-container-${el.id}`}
      >
        <div className="bg-slate-100 p-2 flex justify-between items-center border-b border-slate-200">
          <span className="font-bold text-sm text-slate-700 flex items-center gap-2">
            <Layout size={14} /> {el.label || subDef.name} ({subformData.length})
          </span>
          {!isReadOnly && canAdd && (
            <button
              type="button"
              onClick={() => handleOpenSubformModalLocal()}
              className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded px-2.5 py-1 text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus size={12} strokeWidth={3} /> Eintrag hinzufügen
            </button>
          )}
        </div>
        <div className="p-0 bg-white">
          {subformData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    {subColumns.map((col) => {
                      const f = subTable?.fields.find((field) => field.id === col.fieldId);
                      return (
                        <th key={col.id || col.fieldId} className="p-2.5 px-3 font-semibold whitespace-nowrap">
                          {col.label || f?.name}
                        </th>
                      );
                    })}
                    {!isReadOnly && (canEdit || canDelete) && (
                      <th className="p-2.5 px-3 text-right font-semibold whitespace-nowrap w-28">Aktionen</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {subformData.map((rowItem, rowIdx) => (
                    <tr key={rowItem.id || rowIdx} className="hover:bg-slate-50/80 transition-colors">
                      {subColumns.map((col) => {
                        const f = subTable?.fields.find((field) => field.id === col.fieldId);
                        const fieldName = f?.name || '';
                        const rawVal = rowItem[fieldName];

                        let cellDisplay = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';

                        if ((col as any).widgetType === 'select' && (col as any).lookup) {
                          const opts = getLookupOptions((col as any).lookup);
                          const foundOpt = opts.find((o) => String(o.value) === String(rawVal));
                          if (foundOpt) cellDisplay = foundOpt.label;
                        } else if (f) {
                          const layoutEl = subLayoutFields.find((e) => e.fieldId === f.id);
                          if (layoutEl && layoutEl.widgetType === 'select' && layoutEl.lookup) {
                            const opts = getLookupOptions(layoutEl.lookup);
                            const foundOpt = opts.find((o) => String(o.value) === String(rawVal));
                            if (foundOpt) cellDisplay = foundOpt.label;
                          } else if ((f as any).isFK || (f as any).isForeignKey || (f as any).targetTableId) {
                            const targetT = allTables.find((t) => t.id === (f as any).targetTableId);
                            if (targetT) {
                              const targetRow = (targetT.data || []).find((r) => String(r.id || Object.values(r)[0]) === String(rawVal));
                              if (targetRow) {
                                cellDisplay = Object.values(targetRow).slice(1, 3).join(' ') || String(rawVal);
                              }
                            }
                          }
                        }

                        return (
                          <td key={col.id || col.fieldId} className="p-2.5 px-3 whitespace-nowrap">
                            {cellDisplay}
                          </td>
                        );
                      })}
                      {!isReadOnly && (canEdit || canDelete) && (
                        <td className="p-2.5 px-3 text-right whitespace-nowrap space-x-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenSubformModalLocal(rowItem)}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                            >
                              Bearbeiten
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubformRowLocal(rowItem)}
                              className="text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                            >
                              Löschen
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm mb-3">Keine Einträge vorhanden.</p>
              {!isReadOnly && canAdd && (
                <button
                  type="button"
                  onClick={() => handleOpenSubformModalLocal()}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors mx-auto flex items-center gap-2"
                >
                  <Plus size={14} /> Ersten Eintrag erstellen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
