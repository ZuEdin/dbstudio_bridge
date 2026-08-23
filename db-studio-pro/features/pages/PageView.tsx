import React, { useState, useEffect } from 'react';
import { CustomPage, Table } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';
import { FormView } from '../forms/FormView';
import { X, AlertCircle, Cpu, Upload } from 'lucide-react';
import { 
    PageParamsContext, 
    PageViewContext 
} from './utils/pageViewUtils';
import { LiveNode } from './components/LiveNode';
import { MacroModal } from '../logic/MacroModal';
import { SmartImportModal } from '../tools/SmartImportModal';
import { executeMacro } from '../logic/MacroEngine';
import { Macro } from '../../types/macro';

interface PageViewProps {
  page: CustomPage;
  onSetView: (view: { type: 'page_designer' | 'page_view'; pageId: string }) => void;
}

export { PageParamsContext, PageViewContext } from './utils/pageViewUtils';

export const PageView: React.FC<PageViewProps> = ({ page, onSetView }) => {
  const { pages, tables, forms, queries, reports, updateTable } = useProjectStore();
  const [currentPage, setCurrentPage] = useState<CustomPage>(page);
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  // Navigation within the player
  useEffect(() => {
      setCurrentPage(page);
  }, [page]);

  // Modal forms manager
  const [activeFormModal, setActiveFormModal] = useState<{
      isOpen: boolean;
      formId: string;
      mode: 'create' | 'edit';
      recordId?: any;
      callback?: () => void;
      defaultValues?: Record<string, any>;
  } | null>(null);

  // Custom Confirmation modal
  const [activeConfirm, setActiveConfirm] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
  } | null>(null);

  // Macro and Smart Import Modals
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [smartImportState, setSmartImportState] = useState<{ isOpen: boolean; targetTableId?: string }>({ isOpen: false });

  const handleSetParam = (key: string, value: any) => {
      setPageParams(prev => ({ ...prev, [key]: value }));
  };

  const handleOpenFormModal = (formId: string, mode: 'create' | 'edit', recordId?: any, callback?: () => void, defaultValues?: Record<string, any>) => {
      setActiveFormModal({
          isOpen: true,
          formId,
          mode,
          recordId,
          callback,
          defaultValues
      });
  };

  const handleShowConfirm = (title: string, message: string, onConfirm: () => void) => {
      setActiveConfirm({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
              onConfirm();
              setActiveConfirm(null);
          }
      });
  };

  const handleNavigate = (pageId: string, initialParams?: Record<string, any>) => {
      const targetP = pages.find(p => p.id === pageId);
      if (targetP) {
          if (initialParams) {
              setPageParams(initialParams);
          } else {
              setPageParams({});
          }
          setCurrentPage(targetP);
      }
  };

  const handleRunMacro = (macro: Macro) => {
      executeMacro(macro, {
          tables,
          queries,
          reports,
          params: pageParams,
          onNavigate: handleNavigate,
          onOpenSmartImport: (tblId) => setSmartImportState({ isOpen: true, targetTableId: tblId }),
          onOpenFormModal: (fId, m) => handleOpenFormModal(fId, m || 'create')
      });
  };

  const handleTableChange = (updatedT: Table) => {
      updateTable(updatedT);
      if (activeFormModal?.callback) {
          activeFormModal.callback();
      }
  };

  // Find form configuration for modal
  const modalForm = activeFormModal ? forms.find(f => f.id === activeFormModal.formId) : null;
  const targetTable = modalForm ? tables.find(t => t.id === modalForm.sourceId) : null;

  let modalFilteredData: any[] | undefined = undefined;
  if (activeFormModal?.mode === 'edit' && targetTable && activeFormModal.recordId) {
      const pkField = targetTable.fields.find(f => f.isPrimaryKey) || targetTable.fields[0];
      const matchCol = pkField?.name || 'Id';
      const recordToEdit = targetTable.data?.find(r => String(r[matchCol]) === String(activeFormModal.recordId));
      if (recordToEdit) {
          modalFilteredData = [recordToEdit];
      }
  }

  const [activeRole, setActiveRole] = useState<string>('Admin');

  // Load roles to select from
  const rolesTable = tables.find(t => t.name === 'sys_roles');
  const availableRoles = rolesTable && rolesTable.data && rolesTable.data.length > 0
    ? rolesTable.data.map((r: any) => r.Name || String(r.Id))
    : ['Admin', 'Manager', 'Editor', 'User', 'Guest'];

  return (
    <PageParamsContext.Provider value={{ params: pageParams, setParam: handleSetParam }}>
      <PageViewContext.Provider value={{ 
          openFormModal: handleOpenFormModal, 
          showConfirm: handleShowConfirm, 
          navigate: handleNavigate,
          openMacroModal: () => setIsMacroModalOpen(true),
          openSmartImportModal: (targetTableId) => setSmartImportState({ isOpen: true, targetTableId }),
          activeRole
      }}>
        <div className="flex flex-col h-full bg-slate-50 font-sans overflow-auto relative">
          
          {/* Interactive Simulation Sandbox Bar */}
          <div className="bg-slate-900 text-slate-100 px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-slate-800 text-xs shadow-sm z-30 select-none">
              <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold tracking-wider text-slate-300 uppercase text-[10px]">Simulation &amp; Sandbox</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">Aktive Seite: <strong className="text-white font-mono">{currentPage.name}</strong></span>
              </div>
              
              <div className="flex items-center gap-4">
                  {/* Macro and Smart Import Quick Action Buttons */}
                  <button
                    onClick={() => setIsMacroModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-bold transition-all"
                    title="Makro Manager Öffnen"
                  >
                    <Cpu size={13} />
                    <span>Makros</span>
                  </button>

                  <button
                    onClick={() => setSmartImportState({ isOpen: true })}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold transition-all"
                    title="Smart Excel/CSV Upload Wizard"
                  >
                    <Upload size={13} />
                    <span>Smart Upload</span>
                  </button>

                  <span className="text-slate-700">|</span>

                  {/* Active Parameters List */}
                  <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Parameter:</span>
                      {Object.keys(pageParams).length === 0 ? (
                          <span className="text-slate-500 italic font-mono text-[10px]">keine</span>
                      ) : (
                          <div className="flex gap-1">
                              {Object.entries(pageParams).map(([k, v]) => (
                                  <span key={k} className="bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-[9px] px-1.5 py-0.5 rounded shadow-sm">
                                      {k}={String(v)}
                                  </span>
                              ))}
                          </div>
                      )}
                  </div>

                  <span className="text-slate-700">|</span>

                  {/* Active Simulation Role Dropdown (Userlevels) */}
                  <div className="flex items-center gap-1.5">
                      <label className="text-slate-300 font-medium">Test-Rolle:</label>
                      <select
                          value={activeRole}
                          onChange={(e) => setActiveRole(e.target.value)}
                          className="bg-slate-850 text-slate-100 border border-slate-700 rounded px-2 py-0.5 text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                      >
                          {availableRoles.map(role => (
                              <option key={role} value={role}>{role}</option>
                          ))}
                      </select>
                  </div>

                  {/* Reset Params Button */}
                  <button
                      onClick={() => setPageParams({})}
                      className="bg-slate-800 hover:bg-slate-700 active:bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1"
                      title="Parameter zurücksetzen"
                  >
                      Reset
                  </button>
              </div>
          </div>

          <div className="flex-1 p-8 overflow-auto relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button onClick={() => onSetView({ type: 'page_designer', pageId: page.id })} className="px-3 py-1 bg-white border border-slate-300 shadow-sm rounded text-xs font-semibold hover:bg-slate-50 transition">Zurück zum Designer</button>
              </div>
              <div className="max-w-[95%] mx-auto w-full bg-white shadow-md border border-slate-200 rounded-xl min-h-[800px] p-8 relative">
                  {currentPage.layout ? (
                      <LiveNode node={currentPage.layout} />
                  ) : (
                      <div className="text-center py-20 text-slate-400">Kein Layout für diese Seite gefunden.</div>
                  )}
              </div>
          </div>

          {/* Interactive Form Modal */}
          {activeFormModal && modalForm && (
               <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                   <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                       <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                           <h3 className="text-sm font-bold text-slate-800">
                               {activeFormModal.mode === 'create' ? 'Neuen Datensatz anlegen' : 'Datensatz bearbeiten'} - {modalForm.name}
                           </h3>
                           <button onClick={() => setActiveFormModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                               <X size={18} />
                           </button>
                       </div>
                       <div className="p-6 overflow-y-auto flex-1">
                           <FormView 
                               form={{
                                   ...modalForm,
                                   mode: 'write'
                               }}
                               allForms={forms}
                               allTables={tables}
                               onTableChange={handleTableChange}
                               showConfirmation={(t, m, c) => handleShowConfirm(t, m, c)}
                               isSubform={false}
                               filteredData={modalFilteredData}
                               defaultValues={{
                                   ...Object.keys(pageParams).reduce((acc, key) => {
                                       const val = pageParams[key];
                                       acc[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                                       return acc;
                                   }, {} as any),
                                   ...(activeFormModal.defaultValues || {})
                               }}
                               onClose={() => setActiveFormModal(null)}
                               initialMode={activeFormModal.mode}
                               hideNavigation={true}
                               hideActions={false}
                           />
                       </div>
                   </div>
               </div>
          )}

          {/* Custom Confirmation Modal */}
          {activeConfirm && (
              <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
                      <div className="flex gap-3">
                          <div className="p-2 bg-red-50 text-red-600 rounded-full h-10 w-10 flex items-center justify-center">
                              <AlertCircle size={20} />
                          </div>
                          <div>
                              <h4 className="font-bold text-slate-800 text-base">{activeConfirm.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">{activeConfirm.message}</p>
                          </div>
                      </div>
                      <div className="flex justify-end gap-2.5">
                          <button 
                              onClick={() => setActiveConfirm(null)} 
                              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded text-xs transition"
                          >
                              Abbrechen
                          </button>
                          <button 
                              onClick={activeConfirm.onConfirm} 
                              className="px-3.5 py-1.5 bg-red-600 text-white hover:bg-red-700 font-semibold rounded text-xs transition shadow-sm"
                          >
                              Löschen
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* MS Access Style Macro Manager Modal */}
          <MacroModal
              isOpen={isMacroModalOpen}
              onClose={() => setIsMacroModalOpen(false)}
              onRunMacro={(macro) => {
                  handleRunMacro(macro);
                  setIsMacroModalOpen(false);
              }}
          />

          {/* Smart Upload & Import Wizard Modal */}
          <SmartImportModal
              isOpen={smartImportState.isOpen}
              targetTableId={smartImportState.targetTableId}
              onClose={() => setSmartImportState({ isOpen: false })}
              onImportCompleted={(tableName, count) => {
                  alert(`Erfolgreich ${count} Datensätze in Tabelle '${tableName}' importiert!`);
              }}
          />
        </div>
      </PageViewContext.Provider>
    </PageParamsContext.Provider>
  );
};
