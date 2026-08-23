
import React from 'react';
import { SaveChangesModal } from './modals/SaveChangesModal';
import { ItemContextMenu } from './ItemContextMenu';
import { InputModal } from './modals/InputModal';
import { ReportWizardModal } from '../features/reports/ReportWizardModal';
import { FormWizardModal } from '../features/forms/FormWizardModal';
import { ConfirmationModal } from './modals/ConfirmationModal';
import { ElectronSettingsModal } from '../features/backend/ElectronSettingsModal';
import { SecurityManagerModal } from '../features/security/SecurityManagerModal';
import { DeploymentModal } from '../features/backend/components/DeploymentModal';
import { WhitelabelModal } from '../features/backend/WhitelabelModal';
import { EnvironmentManagerModal } from '../features/backend/EnvironmentManagerModal';
import { MigrationManagerModal } from '../features/backend/MigrationManagerModal';
import { IntegrationsModal } from '../features/backend/IntegrationsModal';
import { OfflineSyncGeneratorModal } from '../features/backend/components/OfflineSyncGeneratorModal';
import { DuplicateWizard, InconsistencyWizard } from '../features/queries/wizards/QueryWizards';
import { AppendQueryWizard } from '../features/queries/wizards/AppendQueryWizard';
import { DeleteQueryWizard } from '../features/queries/wizards/DeleteQueryWizard'; 
import { UpdateQueryWizard } from '../features/queries/wizards/UpdateQueryWizard';
import { MakeTableWizard } from '../features/queries/wizards/MakeTableWizard';
import { ExcelImportWizard } from '../features/tools/ExcelImportWizard';
import { AccessImportWizard } from '../features/tools/AccessImportWizard';
import { DummyDataWizard } from '../features/tools/DummyDataWizard';
import { SharePointImportWizard } from '../features/tools/SharePointImportWizard'; 
import { SchemaImportWizard } from '../features/tools/SchemaImportWizard'; 
import { MessageModal } from './modals/MessageModal';
import { ButtonInfoModal } from './modals/ButtonInfoModal';
import { TableTemplateManagerModal } from '../features/tables/TableTemplateManagerModal';
import { AiSchemaQueryCopilotModal } from '../features/ai/AiSchemaQueryCopilotModal';
import { SchemaDiffModal } from '../features/schema-diff/SchemaDiffModal';
import { OpenApiMockServerModal } from '../features/openapi/OpenApiMockServerModal';
import { SecurityRlsModal } from '../features/security/SecurityRlsModal';
import { AuditTrailModal } from '../features/audit-trail/AuditTrailModal';
import { BridgeRunnerModal } from './modals/BridgeRunnerModal';
import { createTableFromTemplate } from '../services/tableTemplateService';
import { useProjectStore } from '../stores/useProjectStore';
import { useBridgeStore } from '../stores/useBridgeStore';
import { useUIStore } from '../stores/useUIStore';
import { DbType } from '../types/index';

interface ModalLayerProps {
  onCloseSavePrompt: (action: 'yes' | 'no' | 'cancel') => void;
  onContextMenuAction: (action: any) => void;
  onSaveWizardQuery: (query: any) => void;
  onExecuteAppend: (source: any, target: any, map: any) => void;
  onExecuteDelete: (table: any, criteria: any) => void;
  onSaveElectronSettings: (settings: any) => void;
  onSetView?: (view: any) => void;
}

export const ModalLayer: React.FC<ModalLayerProps> = (props) => {
  const store = useProjectStore();
  const ui = useUIStore();
  const { isRunnerModalOpen, setRunnerModalOpen } = useBridgeStore();
  
  const { 
    tables, queries, reports, forms, backendConfig, setBackendConfig,
    addTable, updateTable, setQueries, setReports, setForms, snapshot, lastSnapshot
  } = store;
  
  const { 
    savePrompt, activeObject, itemContextMenu, setItemContextMenu, nameInput,
    showReportWizard, setShowReportWizard, showFormWizard, setShowFormWizard,
    showSecurityManager, setShowSecurityManager, activeWizard, setActiveWizard,
    confirmationModal, setConfirmationModal, showElectronSettings, setShowElectronSettings,
    showDeploymentModal, setShowDeploymentModal, showWhitelabelModal, setShowWhitelabelModal,
    showEnvModal, setShowEnvModal, showMigrationModal, setShowMigrationModal,
    showIntegrationsModal, setShowIntegrationsModal, showExcelWizard, setShowExcelWizard,
    showOfflineSyncModal, setShowOfflineSyncModal,
    showAccessWizard, setShowAccessWizard, showDummyDataWizard, setShowDummyDataWizard,
    showSharePointWizard, setShowSharePointWizard, showSchemaWizard, setShowSchemaWizard,
    showButtonInfoModal, setShowButtonInfoModal,
    showTableTemplateManager, setShowTableTemplateManager,
    saveTableAsTemplateModal, setSaveTableAsTemplateModal,
    messageModal, closeMessage: onCloseMessage, setCurrentView, addToast
  } = ui;

  const { onCloseSavePrompt, onContextMenuAction, onSaveWizardQuery, onExecuteAppend, onExecuteDelete, onSaveElectronSettings, onSetView } = props;

  return (
    <>
      {savePrompt.show && (
        <SaveChangesModal 
          objectType={
            activeObject && 'fields' in activeObject ? 'Tabelle' : 
            activeObject && 'nodes' in activeObject && 'columns' in activeObject ? 'Abfrage' : 
            activeObject && 'layout' in activeObject ? 'Formular' :
            activeObject && 'summaries' in activeObject ? 'Bericht' :
            activeObject && 'config' in activeObject ? 'Diagramm' :
            activeObject && 'nodes' in activeObject ? 'Workflow' : 'Objekt'
          }
          objectName={activeObject?.name || 'Unbenannt'}
          onYes={() => onCloseSavePrompt('yes')}
          onNo={() => onCloseSavePrompt('no')}
          onCancel={() => onCloseSavePrompt('cancel')}
        />
      )}
      
      {itemContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setItemContextMenu(null)}></div>
          <ItemContextMenu 
            x={itemContextMenu.x} 
            y={itemContextMenu.y} 
            itemType={itemContextMenu.type as any}
            onAction={onContextMenuAction}
          />
        </>
      )}

      {nameInput && (
        <InputModal 
          title={nameInput.title}
          label={nameInput.label}
          initialValue={nameInput.initialValue}
          onConfirm={nameInput.onConfirm}
          onCancel={nameInput.onCancel}
        />
      )}

      {showReportWizard && (
        <ReportWizardModal 
          tables={tables} 
          queries={queries} 
          onSave={(r) => { setReports([...reports, r]); setShowReportWizard(false); (onSetView || setCurrentView)({ type: 'report_designer', reportId: r.id }); }}
          onClose={() => setShowReportWizard(false)} 
        />
      )}
      
      {showFormWizard && (
        <FormWizardModal
          tables={tables}
          queries={queries}
          onSave={(f) => { setForms([...forms, f]); setShowFormWizard(false); (onSetView || setCurrentView)({ type: 'form_designer', formId: f.id }); }}
          onClose={() => setShowFormWizard(false)}
        />
      )}

      {showExcelWizard && (
          <ExcelImportWizard 
            tables={tables}
            onSave={(table, newRelations) => {
              addTable(table);
              if (newRelations && newRelations.length > 0) {
                store.setRelationships([...store.relationships, ...newRelations]);
                addToast(`${newRelations.length} SVERWEIS-Beziehung(en) automatisch erstellt!`, "success");
              } else {
                addToast("Tabelle erfolgreich importiert!", "success");
              }
            }} 
            onClose={() => setShowExcelWizard(false)} 
          />
      )}

      {showAccessWizard && (
          <AccessImportWizard 
            onSave={addTable} 
            onClose={() => setShowAccessWizard(false)} 
          />
      )}

      {showDummyDataWizard && (
          <DummyDataWizard 
            tables={tables}
            onGenerate={updateTable}
            onClose={() => setShowDummyDataWizard(false)}
          />
      )}

      {showSharePointWizard && (
          <SharePointImportWizard 
            onSave={addTable} 
            onClose={() => setShowSharePointWizard(false)}
            backendConfig={backendConfig}
            onUpdateConfig={setBackendConfig}
          />
      )}

      {showSchemaWizard && (
          <SchemaImportWizard
            onSave={addTable}
            onClose={() => setShowSchemaWizard(false)}
            onAddToast={addToast}
          />
      )}

      {showSecurityManager && (
          <SecurityManagerModal 
            tables={tables}
            queries={queries}
            forms={forms}
            reports={reports}
            onUpdateTable={updateTable}
            onCreateTable={addTable}
            onClose={() => setShowSecurityManager(false)}
            backendConfig={backendConfig}
            onUpdateBackendConfig={setBackendConfig}
          />
      )}

      {showElectronSettings && (
          <ElectronSettingsModal
            settings={backendConfig.electronSettings || { includeBackend: true, bundleFrontend: true }}
            onSave={onSaveElectronSettings}
            onClose={() => setShowElectronSettings(false)}
          />
      )}

      {showDeploymentModal && (
          <DeploymentModal
            config={backendConfig.deploymentConfig}
            onSave={(c) => setBackendConfig({...backendConfig, deploymentConfig: c})}
            onClose={() => setShowDeploymentModal(false)}
            onDeploy={() => { setShowDeploymentModal(false); ui.setFormActionTrigger({action:'backend_generate', timestamp: Date.now()}); }}
          />
      )}

      {showWhitelabelModal && (
          <WhitelabelModal
            whitelabel={backendConfig?.whitelabel}
            multiTenancy={backendConfig?.multiTenancy}
            licensing={backendConfig?.licensing}
            onSave={(w, m, l) => setBackendConfig({...backendConfig, whitelabel: w, multiTenancy: m, licensing: l})}
            onClose={() => setShowWhitelabelModal(false)}
          />
      )}

      {showEnvModal && (
          <EnvironmentManagerModal
            initialEnvs={backendConfig?.environments}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSave={(e) => setBackendConfig({...backendConfig, environments: e})}
            onClose={() => setShowEnvModal(false)}
          />
      )}

      {showMigrationModal && (
          <MigrationManagerModal
            currentTables={tables}
            lastSnapshot={lastSnapshot}
            dbType={backendConfig?.dbType || DbType.SQL}
            onSnapshot={snapshot}
            onClose={() => setShowMigrationModal(false)}
          />
      )}

      {showIntegrationsModal && (
          <IntegrationsModal
            config={backendConfig?.integrations}
            onSave={(c) => setBackendConfig({...backendConfig, integrations: c})}
            onClose={() => setShowIntegrationsModal(false)}
          />
      )}

      {showOfflineSyncModal && (
        <OfflineSyncGeneratorModal
          tables={tables}
          backendConfig={backendConfig}
          onUpdateTables={(newTables) => {
            newTables.forEach(t => updateTable(t));
          }}
          onSaveConfig={(newConfig) => setBackendConfig(newConfig)}
          onClose={() => setShowOfflineSyncModal(false)}
          showMessage={(title, msg, typ) => ui.showMessage(title, msg, typ)}
          addToast={addToast}
        />
      )}

      {/* Query Wizards */}
      {activeWizard === 'duplicate' && <DuplicateWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'inconsistency' && <InconsistencyWizard tables={tables} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'append' && <AppendQueryWizard tables={tables} onExecute={onExecuteAppend} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'delete' && <DeleteQueryWizard tables={tables} onExecute={onExecuteDelete} onSave={onSaveWizardQuery} onClose={() => setActiveWizard(null)} />}
      {activeWizard === 'update' && (
        <UpdateQueryWizard 
          tables={tables} 
          onSave={onSaveWizardQuery}
          onClose={() => setActiveWizard(null)} 
        />
      )}
      {(activeWizard === 'maketable' || activeWizard === 'make_table') && (
        <MakeTableWizard 
          tables={tables} 
          queries={queries} 
          onClose={() => setActiveWizard(null)} 
        />
      )}

      {confirmationModal && (
        <ConfirmationModal 
          title={confirmationModal.title}
          message={confirmationModal.message}
          confirmText={confirmationModal.confirmText}
          cancelText={confirmationModal.cancelText}
          alternateText={confirmationModal.alternateText}
          confirmClass={confirmationModal.confirmClass}
          onConfirm={() => {
            confirmationModal.onConfirm();
            setConfirmationModal(null);
          }}
          onCancel={() => {
            if (confirmationModal.onCancel) confirmationModal.onCancel();
            setConfirmationModal(null);
          }}
          onAlternate={confirmationModal.onAlternate ? () => {
            confirmationModal.onAlternate?.();
            setConfirmationModal(null);
          } : undefined}
        />
      )}

      {showButtonInfoModal && (
        <ButtonInfoModal 
          isOpen={showButtonInfoModal}
          onClose={() => setShowButtonInfoModal(false)}
          onExecuteAction={(actionKey) => {
            if (props.onContextMenuAction) {
              props.onContextMenuAction(actionKey);
            }
          }}
        />
      )}

      {showTableTemplateManager && (
        <TableTemplateManagerModal 
          isOpen={showTableTemplateManager}
          onClose={() => {
            setShowTableTemplateManager(false);
            setSaveTableAsTemplateModal(null);
          }}
          existingTables={tables}
          initialTableToSave={saveTableAsTemplateModal?.table}
          onSelectTemplate={(template, withSampleData) => {
            const newTable = createTableFromTemplate(template, tables, withSampleData);
            addTable(newTable);
            ui.setActiveObject(newTable);
            if (onSetView) {
              onSetView({ type: 'table_data', tableId: newTable.id });
            } else {
              setCurrentView({ type: 'table_data', tableId: newTable.id });
            }
            ui.setIsDirty(true);
            addToast(`Tabelle "${newTable.name}" aus Vorlage "${template.name}" erfolgreich erstellt.`, 'success');
          }}
        />
      )}

      {ui.showAiCopilotModal && (
        <AiSchemaQueryCopilotModal 
          onClose={() => ui.setShowAiCopilotModal(false)}
          initialTab={ui.aiCopilotTab}
          onSetView={onSetView || ((v) => setCurrentView(v))}
        />
      )}

      {ui.showSchemaDiffModal && (
        <SchemaDiffModal 
          currentTables={tables}
          lastSnapshot={lastSnapshot}
          dbType={backendConfig?.dbType || DbType.SQL}
          onSnapshot={snapshot}
          onClose={() => ui.setShowSchemaDiffModal(false)}
        />
      )}

      {ui.showOpenApiModal && (
        <OpenApiMockServerModal 
          tables={tables}
          updateTable={updateTable}
          onClose={() => ui.setShowOpenApiModal(false)}
        />
      )}

      {ui.showSecurityRlsModal && (
        <SecurityRlsModal 
          tables={tables}
          existingConfig={(backendConfig as any)?.securityRls}
          onSaveConfig={(cfg) => {
            setBackendConfig({
              ...backendConfig,
              securityRls: cfg
            } as any);
            ui.addToast("RLS-Sicherheitsregeln erfolgreich im Projekt gespeichert.", "success");
          }}
          onClose={() => ui.setShowSecurityRlsModal(false)}
        />
      )}

      {ui.showAuditTrailModal && (
        <AuditTrailModal 
          tables={tables}
          updateTable={updateTable}
          onClose={() => ui.setShowAuditTrailModal(false)}
        />
      )}

      {messageModal && (
        <MessageModal 
          type={messageModal.type}
          title={messageModal.title}
          message={messageModal.message}
          onClose={onCloseMessage}
        />
      )}

      {/* Local Execution Bridge Runner & Live Console Modal */}
      <BridgeRunnerModal 
        isOpen={isRunnerModalOpen}
        onClose={() => setRunnerModalOpen(false)}
        onOpenSettings={() => {
          ui.setIsBackstageOpen(true);
          ui.setBackstageActiveTab('optionen');
        }}
      />
    </>
  );
};
