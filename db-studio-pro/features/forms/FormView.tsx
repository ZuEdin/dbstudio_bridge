import React from 'react';
import { Form, Table, Query } from '../../types/index';
import { Plus, ShieldAlert } from 'lucide-react';
import { useFormViewState } from './hooks/useFormViewState';
import { CascadeDeleteModal } from '../tables/components/CascadeDeleteModal';
import { useProjectStore } from '../../stores/useProjectStore';

// Extracted Subcomponents
import { Header } from './components/FormView/Header';
import { Footer } from './components/FormView/Footer';
import { SplitViewList } from './components/FormView/SplitViewList';
import { ContextMenu } from './components/FormView/ContextMenu';
import { AdvancedFilterModal } from './components/FormView/AdvancedFilterModal';
import { LookupModal } from './components/FormView/LookupModal';
import { SubformModal } from './components/FormView/SubformModal';
import { FormElementRenderer } from './components/FormView/FormElementRenderer';

interface FormViewProps {
  form: Form;
  allForms: Form[];
  allTables: Table[];
  queries?: Query[];
  executeQuery?: (q: Query, context?: any) => Record<string, any>[];
  onTableChange: (table: Table) => void;
  showConfirmation: (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText?: string,
    confirmClass?: string
  ) => void;
  isSubform?: boolean;
  filteredData?: Record<string, any>[];
  parentRecord?: Record<string, any>;
  linkConfig?: { masterFieldId: string; childFieldId: string };
  subformPermissions?: { canAdd?: boolean; canEdit?: boolean; canDelete?: boolean };
  onClose?: () => void;
  initialMode?: 'create' | 'edit' | 'view';
  hideNavigation?: boolean;
  hideActions?: boolean;
  hideHeader?: boolean;
  embedded?: boolean;
  defaultValues?: Record<string, any>;
  formActionTrigger?: { action: string; timestamp: number };
}

export const FormView: React.FC<FormViewProps> = (props) => {
  const {
    form,
    allForms,
    allTables,
    queries,
    executeQuery,
    onTableChange,
    showConfirmation,
    isSubform,
    onClose,
    hideHeader,
    embedded,
  } = props;

  const { relationships } = useProjectStore();
  const state = useFormViewState(props);

  const headerColorClass = isSubform
    ? 'bg-indigo-100 text-indigo-900 border-b border-indigo-200'
    : 'bg-slate-800 text-white';

  const elementRenderer = (el: any) => (
    <FormElementRenderer
      key={el.id}
      el={el}
      allForms={allForms}
      allTables={allTables}
      queries={queries}
      executeQuery={executeQuery}
      onTableChange={onTableChange}
      showConfirmation={showConfirmation}
      currentRecord={state.currentRecord}
      isReadOnly={state.isReadOnly}
      isCreating={state.isCreating}
      sourceTable={state.sourceTable}
      handleInputChange={state.handleInputChange}
      getLookupOptions={state.getLookupOptions}
      setLookupModal={state.setLookupModal}
      setSubformModal={state.setSubformModal}
      handleContextMenu={state.handleContextMenu}
      setFocusedFieldName={state.setFocusedFieldName}
      getFieldName={state.getFieldName}
      evalVisibility={state.evalVisibility}
      FormViewComponent={FormView}
    />
  );

  return (
    <div
      className={`relative h-full flex flex-col ${
        isSubform || embedded || (form.settings?.isFullScreen && !embedded) ? '' : 'p-4 bg-slate-100'
      }`}
      id={`form-view-wrapper-${form.id}`}
    >
      <div
        className={`bg-white shadow border border-slate-200 rounded-lg flex flex-col h-full ${
          form.settings?.isFullScreen && !embedded
            ? 'absolute inset-0 z-[50] m-0 rounded-none'
            : 'max-w-4xl mx-auto w-full'
        }`}
      >
        <Header
          hideHeader={hideHeader}
          formName={form.name}
          isCreating={state.isCreating}
          currentIndex={state.currentIndex}
          dataLength={state.data.length}
          onClose={onClose}
          headerColorClass={headerColorClass}
        />

        {form.settings?.showTableSplitView && !isSubform && !state.isUnbound ? (
          <div className="flex-1 flex overflow-hidden">
            <SplitViewList
              isCreating={state.isCreating}
              data={state.data}
              currentIndex={state.currentIndex}
              setCurrentIndex={state.setCurrentIndex}
              formSettings={form.settings}
              sourceTable={state.sourceTable}
            />
            <div className="flex-1 overflow-y-auto p-6 relative">
              {state.isCreating && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      <strong>Neuer Datensatz:</strong> Bitte die Felder ausfüllen und unten auf{' '}
                      <strong>Datensatz Speichern</strong> klicken.
                    </span>
                  </div>
                  <button
                    onClick={state.cancelCreate}
                    className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold underline text-xs shrink-0"
                  >
                    Abbrechen
                  </button>
                </div>
              )}
              {state.activeFilters.length > 0 && (
                <div className="mb-4 px-3 py-2 bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-xs flex flex-wrap items-center gap-2 shadow-2xs">
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    {state.filterEnabled ? 'Aktive Filter' : 'Filter (deaktiviert)'}
                  </span>
                  {state.activeFilters.map((f, idx) => (
                    <span
                      key={idx}
                      className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border text-[11px]"
                    >
                      {f.fieldName} = {String(f.value)}
                    </span>
                  ))}
                </div>
              )}
              {state.isUnbound || state.data.length > 0 || state.isCreating ? (
                form.layout ? (
                  elementRenderer(form.layout)
                ) : (
                  <div>Kein Layout definiert.</div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p className="mb-4">Keine Daten vorhanden.</p>
                  {!state.isReadOnly && !state.isCreating && (
                    <button
                      onClick={state.startCreate}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all"
                    >
                      <Plus size={16} /> Ersten Datensatz anlegen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {state.validationError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0" />
                  <span>{state.validationError}</span>
                </div>
                <button onClick={() => state.setValidationError(null)} className="text-rose-400 hover:text-rose-700">
                  ✕
                </button>
              </div>
            )}
            {state.isCreating && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center justify-between shadow-2xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Plus size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>Neuer Datensatz:</strong> Bitte die Felder ausfüllen und unten auf{' '}
                    <strong>Datensatz Speichern</strong> klicken.
                  </span>
                </div>
                <button
                  onClick={state.cancelCreate}
                  className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-white font-bold underline text-xs shrink-0"
                >
                  Abbrechen
                </button>
              </div>
            )}
            {state.activeFilters.length > 0 && (
              <div className="mb-4 px-3 py-2 bg-blue-50/90 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-lg text-xs flex flex-wrap items-center gap-2 shadow-2xs">
                <span className="font-bold text-blue-900 dark:text-blue-300">
                  {state.filterEnabled ? 'Aktive Filter' : 'Filter (deaktiviert)'}
                </span>
                {state.activeFilters.map((f, idx) => (
                  <span
                    key={idx}
                    className="bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded border text-[11px]"
                  >
                    {f.fieldName} = {String(f.value)}
                  </span>
                ))}
              </div>
            )}
            {state.isUnbound || state.data.length > 0 || state.isCreating ? (
              form.layout ? (
                elementRenderer(form.layout)
              ) : (
                <div>Kein Layout definiert.</div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <p className="mb-4">Keine Daten vorhanden.</p>
                {!state.isReadOnly && !state.isCreating && (
                  <button
                    onClick={state.startCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition-all"
                  >
                    <Plus size={16} /> Ersten Datensatz anlegen
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <Footer
          isUnbound={state.isUnbound}
          isCreating={state.isCreating}
          finalHideNavigation={state.finalHideNavigation}
          hideActions={props.hideActions || false}
          onClose={onClose}
          cancelCreate={state.cancelCreate}
          saveNewRecord={state.saveNewRecord}
          processedData={state.processedData}
          data={state.data}
          currentIndex={state.currentIndex}
          setCurrentIndex={state.setCurrentIndex}
          isReadOnly={state.isReadOnly}
          startCreate={state.startCreate}
          globalSearchText={state.globalSearchText}
          setGlobalSearchText={state.setGlobalSearchText}
          filterEnabled={state.filterEnabled}
          setFilterEnabled={state.setFilterEnabled}
          activeFilters={state.activeFilters}
          deleteCurrentRecord={state.deleteCurrentRecord}
        />
      </div>

      <LookupModal
        isOpen={!!state.lookupModal?.isOpen}
        lookupModal={state.lookupModal}
        onClose={() => state.setLookupModal(null)}
        allTables={allTables}
        allForms={allForms}
        queries={queries}
        executeQuery={executeQuery}
        showConfirmation={showConfirmation}
        handleQuickCreateSave={state.handleQuickCreateSave}
        FormViewComponent={FormView}
      />

      <SubformModal
        isOpen={!!state.subformModal?.isOpen}
        subformModal={state.subformModal}
        onClose={() => state.setSubformModal(null)}
        allTables={allTables}
        allForms={allForms}
        queries={queries}
        executeQuery={executeQuery}
        showConfirmation={showConfirmation}
        handleSubformSaveFromModal={state.handleSubformSaveFromModal}
        currentRecord={state.currentRecord}
        FormViewComponent={FormView}
      />

      {state.contextMenu && (
        <ContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          fieldName={state.contextMenu.fieldName}
          value={state.contextMenu.value}
          onClose={() => state.setContextMenu(null)}
          setActiveFilters={state.setActiveFilters}
          setFilterEnabled={state.setFilterEnabled}
          setActiveSort={state.setActiveSort}
        />
      )}

      <AdvancedFilterModal
        isOpen={state.filterModalOpen}
        onClose={() => state.setFilterModalOpen(false)}
        formName={form.name}
        fields={state.sourceTable?.fields || []}
        activeFilters={state.activeFilters}
        setActiveFilters={state.setActiveFilters}
        filterEnabled={state.filterEnabled}
        setFilterEnabled={state.setFilterEnabled}
      />

      {state.showCascadeDeleteModal && state.sourceTable && state.currentRecord && (
        <CascadeDeleteModal
          parentTable={state.sourceTable}
          recordToDelete={state.currentRecord}
          allTables={allTables}
          relationships={relationships}
          onConfirmDelete={state.handleCascadeDeleteConfirm}
          onClose={() => state.setShowCascadeDeleteModal(false)}
        />
      )}
    </div>
  );
};
