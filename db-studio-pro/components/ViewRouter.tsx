
import React, { useEffect } from 'react';
import { ViewType, Table, Query, Report, Form, Relationship, SelectQuery, BackendConfig, TableNode, Chart, Workflow, EnvironmentConfig, CustomPage } from '../types/index';
import { WelcomeView } from '../features/dashboard/WelcomeView';
import { AppInfoView } from '../features/dashboard/AppInfoView'; // Import
import { TableDesigner } from '../features/tables/TableDesigner';
import { TableView } from '../features/tables/TableView';
import { RelationshipsView } from '../features/relationships/RelationshipsView';
import { QueryDesignerView } from '../features/queries/QueryDesignerView';
import { QueryResultsView } from '../features/queries/QueryResultsView';
import { ReportView } from '../features/reports/ReportView';
import { ReportDesignerView } from '../features/reports/ReportDesignerView';
import { DashboardDesigner } from '../features/reports/DashboardDesigner';
import { FormView } from '../features/forms/FormView';
import { FormDesignerView } from '../features/forms/FormDesignerView';
import { BackendView } from '../features/backend/BackendView';
import { DbstudioBackendView } from '../features/backend/DbstudioBackendView';
import { RoadmapView } from '../features/tools/RoadmapView';
import { VersionControlView } from '../features/tools/VersionControlView';
import { AuditTrailView } from '../features/tools/AuditTrailView';
import { ProjectManagementView } from '../features/projects/ProjectManagementView';
import { ApiImportView } from '../features/tools/ApiImportView';
import { LiveDatabaseSyncView } from '../features/tools/LiveDatabaseSyncView';
import { CustomComponentDesigner, CustomComponentsManager } from '../features/pages/custom_components';
import { ChartView } from '../features/charts/ChartView';
import { WorkflowDesigner } from '../features/workflows/WorkflowDesigner';
import { SchedulerView } from '../features/scheduler/SchedulerView'; 
import { NavigationDesigner } from '../features/navigation/NavigationDesigner';
import { ThemeDesigner } from '../features/themes/ThemeDesigner';
import { LogicDesigner } from '../features/logic/LogicDesigner';
import { ApiRoutingDesigner } from '../features/backend/ApiRoutingDesigner';
import { LifecycleDesigner } from '../features/logic/LifecycleDesigner';
import { MultiTenancyWizard } from '../features/backend/MultiTenancyWizard';
import { DataSeederView } from '../features/tables/DataSeederView';
import { PageDesigner } from '../features/pages/PageDesigner';
import { PageView } from '../features/pages/PageView';
import { AiSwarmDashboard } from '../features/ai/AiSwarmDashboard';
import { useAppController } from '../hooks/useAppController'; // Need context types or pass down
import { TicketBoard } from './TicketBoard';
import { useTicketState } from '../hooks/useTicketState';

interface ViewRouterProps {
  currentView: ViewType;
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  workflows?: Workflow[]; 
  pages?: CustomPage[]; // NEW
  canvasNodes: TableNode[];
  relationships: Relationship[];
  activeObject: Table | Query | Report | Form | Chart | Workflow | null;
  onSetView: (view: ViewType) => void;
  onActiveObjectChange: (obj: Table | Query | Report | Form | Chart | Workflow) => void;
  onDeleteRelationship: (id: string) => void;
  onUpdateRelationship: (rel: Relationship) => void;
  onMoveRelationshipNode: (id: string, x: number, y: number) => void;
  onUpdateRelationshipNodes?: (nodes: TableNode[]) => void;
  setRelationships: React.Dispatch<React.SetStateAction<Relationship[]>>;
  executeQuery: (query: Query) => Record<string, any>[];
  saveTable: (table: Table, mode: 'create' | 'edit') => void;
  showConfirmation: (title: string, message: string, onConfirm: () => void, confirmText?: string, confirmClass?: string) => void;
  formActionTrigger?: { action: string, timestamp: number };
  backendConfig: BackendConfig;
  onUpdateBackendConfig?: (config: BackendConfig) => void; // NEW
  exportTrigger: number;
  generateTrigger: number;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onOpenDeployment: () => void;
  onUpdateWorkflow?: (workflow: Workflow) => void;
  // NEW Lifecycle props
  lastSnapshot?: Table[];
  onSnapshot?: () => void;
  onUpdateEnvironments?: (envs: EnvironmentConfig[]) => void;
  // Lock Prop
  activeLock?: any;
}

export const ViewRouter: React.FC<ViewRouterProps> = ({
  currentView,
  tables,
  queries,
  reports,
  forms,
  workflows = [],
  pages = [],
  canvasNodes,
  relationships,
  activeObject,
  onSetView,
  onActiveObjectChange,
  onDeleteRelationship,
  onUpdateRelationship,
  onMoveRelationshipNode,
  onUpdateRelationshipNodes,
  setRelationships,
  executeQuery,
  saveTable,
  showConfirmation,
  formActionTrigger,
  backendConfig,
  onUpdateBackendConfig,
  exportTrigger,
  generateTrigger,
  showMessage,
  onOpenDeployment,
  onUpdateWorkflow,
  lastSnapshot,
  onSnapshot,
  onUpdateEnvironments,
  activeLock
}) => {

  const ticketState = useTicketState();

  useEffect(() => {
      if (formActionTrigger?.action === 'open_deployment_modal') {
          onOpenDeployment();
      }
  }, [formActionTrigger]);

  const handleConnect = (t1: string, f1: string, t2: string, f2: string) => {
        const fromTable = tables.find(t => t.id === t1);
        const toTable = tables.find(t => t.id === t2);
        if (!fromTable || !toTable) return;
        const fromField = fromTable.fields.find(f => f.id === f1);
        const toField = toTable.fields.find(f => f.id === f2);
        const type = fromField?.isPrimaryKey && !toField?.isPrimaryKey ? '1:n' : '1:1';
        const newRel: Relationship = { id: crypto.randomUUID(), fromTableId: t1, fromFieldId: f1, toTableId: t2, toFieldId: f2, type: type, referentialIntegrity: true };
        const currentRels = Array.isArray(relationships) ? relationships : [];
        setRelationships([...currentRels, newRel]);
  };

  const getSourceFieldsForReport = (report: Report) => {
      if (report.sourceType === 'table') {
          const table = tables.find(t => t.id === report.sourceId);
          return table?.fields || [];
      } else {
          const query = queries.find(q => q.id === report.sourceId);
          if (query && query.type === 'SELECT') {
              return query.columns.map(col => {
                  const table = tables.find(t => t.id === col.tableId);
                  const field = table?.fields.find(f => f.id === col.fieldId);
                  return {
                      id: col.id,
                      name: col.alias && col.alias.trim() !== '' ? col.alias : col.fieldName,
                      type: field?.type || 'VARCHAR',
                      isPrimaryKey: false
                  };
              });
          }
      }
      return [];
  };

  switch (currentView.type) {
      case 'welcome':
        return (
            <WelcomeView 
                tables={tables} queries={queries} reports={reports} forms={forms}
                onSetView={onSetView}
                onNavigate={(type, id) => {
                    if(type === 'table_create') onSetView({type: 'table_create'});
                    else if(type === 'query_designer') onSetView({type: 'query_designer'});
                    else if(type === 'table_data' && id) onSetView({type: 'table_data', tableId: id});
                    else showMessage("Info", "Bitte nutzen Sie den 'Erstellen' Tab im Menüband.", 'info');
                }}
            />
        );
      case 'app_info': // New Route
        return <AppInfoView onNavigate={(action) => {
            if(action === 'create_table') onSetView({type: 'table_create'});
            else if(action === 'backend_generate') onSetView({type: 'backend_generator'});
        }} />;
      case 'table_create':
      case 'table_edit':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return <TableDesigner table={activeObject as Table} onTableChange={onActiveObjectChange as any} lockedBy={activeLock} currentUserId="u1" relationships={relationships} showConfirmation={showConfirmation} />;
        }
        return null;
      case 'table_data':
        if (activeObject && 'fields' in activeObject && !('nodes' in activeObject) && !('sourceType' in activeObject)) {
          return <TableView table={activeObject as Table} allTables={tables} relationships={relationships} onTableChange={onActiveObjectChange as any} showConfirmation={showConfirmation} formActionTrigger={formActionTrigger} />;
        }
        return null;
      case 'query_results':
        if (activeObject && 'nodes' in activeObject) {
            const results = executeQuery(activeObject as Query);
            return <QueryResultsView query={activeObject as SelectQuery} results={results} />;
        }
        return null;
      case 'report_view':
         if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject) && !('config' in activeObject)) {
            const report = activeObject as Report;
            if (report.sourceType === 'dashboard') {
                 // The view mode for dashboard is similar to designer but without add/remove controls
                 // We can either render a DashboardView, or just use DashboardDesigner without edit capabilities.
                 // For now, returning DashboardDesigner is acceptable, but let's make sure it represents view mode well.
                 // We'll reuse the designer but maybe it has everything we need to view.
                 const handleOpenReport = (reportId: string) => {
                     const rep = reports.find(r => r.id === reportId);
                     if (rep) {
                         onActiveObjectChange(rep);
                         onSetView({ type: 'report_view', reportId: rep.id });
                     }
                 };
                 return <DashboardDesigner report={report} tables={tables} queries={queries} relationships={relationships} reports={reports} onReportChange={onActiveObjectChange as any} onOpenReport={handleOpenReport} />;
            }
            let data: Record<string, any>[] = [];
            const sourceFields = getSourceFieldsForReport(report) as any[];
            if (report.sourceType === 'table') {
                const table = tables.find(t => t.id === report.sourceId);
                data = table?.data || [];
            } else {
                const query = queries.find(q => q.id === report.sourceId);
                if (query) data = executeQuery(query);
            }
            return <ReportView report={report} data={data} sourceFields={sourceFields} allTables={tables} relationships={relationships} allReports={reports} allQueries={queries} />;
        }
        return null;
      case 'report_designer':
          if (activeObject && 'sourceType' in activeObject && !('fields' in activeObject) && !('config' in activeObject)) {
              if (activeObject.sourceType === 'dashboard') {
                  const handleOpenReport = (reportId: string) => {
                      const rep = reports.find(r => r.id === reportId);
                      if (rep) {
                          onActiveObjectChange(rep);
                          onSetView({ type: 'report_designer', reportId: rep.id });
                      }
                  };
                  return <DashboardDesigner report={activeObject as Report} tables={tables} queries={queries} relationships={relationships} reports={reports} onReportChange={onActiveObjectChange as any} onOpenReport={handleOpenReport} />;
              }
              return <ReportDesignerView report={activeObject as Report} tables={tables} queries={queries} relationships={relationships} allReports={reports} onReportChange={onActiveObjectChange as any} />;
          }
          return null;
      case 'form_view':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormView 
                form={activeObject as Form} 
                allForms={forms} 
                allTables={tables} 
                queries={queries}
                executeQuery={executeQuery}
                onTableChange={(t) => saveTable(t, 'edit')} 
                showConfirmation={showConfirmation} 
                formActionTrigger={formActionTrigger}
            />;
        }
        return null;
      case 'form_designer':
        if (activeObject && 'sourceType' in activeObject && 'layout' in activeObject) {
            return <FormDesignerView form={activeObject as Form} allForms={forms} allTables={tables} queries={queries} relationships={relationships} onFormChange={onActiveObjectChange as any} actionTrigger={formActionTrigger} />;
        }
        return null;
      case 'chart_view':
        if (activeObject && 'config' in activeObject) {
            return <ChartView chart={activeObject as Chart} tables={tables} queries={queries} onChartChange={onActiveObjectChange as any} />;
        }
        return null;
      case 'page_designer':
        if (activeObject && 'layout' in activeObject) {
            return <PageDesigner page={activeObject as any} onPageChange={onActiveObjectChange as any} onSetView={onSetView} />;
        }
        return null;
      case 'page_view':
        if (activeObject && 'layout' in activeObject) {
            return <PageView page={activeObject as any} onSetView={onSetView} />;
        }
        return null;
      case 'workflow_designer':
        if (activeObject && 'nodes' in activeObject && 'active' in activeObject) {
            return (
              <WorkflowDesigner 
                workflow={activeObject as Workflow} 
                tables={tables} 
                onWorkflowChange={onActiveObjectChange as any} 
                onShowToast={(msg, type) => showMessage('Workflow', msg, type)}
              />
            );
        }
        return null;
      case 'scheduler':
          return <SchedulerView workflows={workflows} onUpdateWorkflow={onUpdateWorkflow!} />;
      case 'backend_generator':
          return (
            <BackendView 
                tables={tables} relationships={relationships} queries={queries} forms={forms} reports={reports} pages={pages} 
                exportTrigger={exportTrigger} generateTrigger={generateTrigger} config={backendConfig} 
                showMessage={showMessage} 
                onOpenDeployment={() => { /* via hook */ }}
                lastSnapshot={lastSnapshot}
                onSnapshot={onSnapshot}
                onUpdateEnvironments={onUpdateEnvironments}
            />
          );
      case 'relationships':
        return <RelationshipsView 
            nodes={canvasNodes} 
            tables={tables} 
            relationships={relationships} 
            onMoveNode={onMoveRelationshipNode} 
            onUpdateNodes={onUpdateRelationshipNodes}
            onConnect={handleConnect} 
            onDeleteRelationship={onDeleteRelationship} 
            onUpdateRelationship={onUpdateRelationship} 
            onNodeDoubleClick={(tId) => onSetView({ type: 'table_edit', tableId: tId })}
            showConfirmation={showConfirmation}
        />;
      case 'query_designer':
        if (activeObject && 'nodes' in activeObject) {
           return <QueryDesignerView query={activeObject as SelectQuery} onQueryChange={onActiveObjectChange as any} tables={tables} forms={forms} queries={queries} relationships={relationships} dbType={backendConfig.dbType} />;
        }
       return null;
      case 'api_import':
        return (
            <ApiImportView 
                onSaveTable={(t) => saveTable(t, 'create')} 
                showMessage={showMessage} 
                backendConfig={backendConfig}
                onUpdateConfig={onUpdateBackendConfig}
            />
        );
      case 'live_sync':
        return (
            <LiveDatabaseSyncView 
                onSaveTable={(t) => saveTable(t, 'create')} 
                showMessage={showMessage} 
            />
        );
      case 'navigation_designer':
        return (
          <NavigationDesigner 
            tables={tables}
            queries={queries}
            reports={reports}
            forms={forms}
            backendConfig={backendConfig}
            onUpdateBackendConfig={onUpdateBackendConfig!}
            showMessage={showMessage}
          />
        );
      case 'theme_designer':
        return (
          <ThemeDesigner 
             config={backendConfig}
             onUpdateConfig={onUpdateBackendConfig!}
             showMessage={showMessage}
          />
        );
      case 'logic_designer':
        return (
          <LogicDesigner 
             config={backendConfig}
             onUpdateConfig={onUpdateBackendConfig!}
             showMessage={showMessage}
          />
        );
      case 'api_routing_designer':
        return (
          <ApiRoutingDesigner 
             config={backendConfig}
             tables={tables}
             queries={queries}
             onUpdateConfig={onUpdateBackendConfig}
             showMessage={showMessage}
          />
        );
      case 'lifecycle_designer':
        return (
          <LifecycleDesigner 
             config={backendConfig}
             tables={tables}
             onUpdateConfig={onUpdateBackendConfig}
             showMessage={showMessage}
          />
        );
      case 'multi_tenancy_wizard':
        return (
          <MultiTenancyWizard 
             config={backendConfig}
             tables={tables}
             onUpdateConfig={onUpdateBackendConfig}
             showMessage={showMessage}
          />
        );
      case 'data_seeder_view':
        return (
          <DataSeederView 
             tables={tables}
             backendConfig={backendConfig}
             showMessage={showMessage}
          />
        );
      case 'tickets_board': {
        return (
          <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
            <div className="px-4 py-3 bg-slate-800 text-white shrink-0 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span>Projekt-Aufgaben & Tickets (Kanban-Board)</span>
                </h2>
                <p className="text-[11px] text-slate-300">Koordinieren Sie Datenbank-Strukturen, Query-Tunings und Dashboards im Team</p>
              </div>
            </div>
            <TicketBoard
              tickets={ticketState.tickets}
              allTicketsRaw={ticketState.allTicketsRaw}
              onAddTicket={ticketState.addTicket}
              onUpdateTicketStatus={ticketState.updateTicketStatus}
              onDeleteTicket={ticketState.deleteTicket}
              filterPriority={ticketState.filterPriority}
              setFilterPriority={ticketState.setFilterPriority}
              filterAssigned={ticketState.filterAssigned}
              setFilterAssigned={ticketState.setFilterAssigned}
              searchQuery={ticketState.searchQuery}
              setSearchQuery={ticketState.setSearchQuery}
            />
          </div>
        );
      }
      case 'ai_swarm':
        return <AiSwarmDashboard />;
      case 'dbstudio_backend':
        return (
          <DbstudioBackendView 
            tables={tables}
            relationships={relationships}
            queries={queries}
            showMessage={showMessage}
            onSetView={onSetView}
          />
        );
      case 'roadmap_view':
        return (
          <RoadmapView 
            onAddTicket={ticketState.addTicket}
            showMessage={showMessage}
            onSetView={onSetView}
          />
        );
      case 'project_management':
        return (
          <ProjectManagementView 
            initialPanel={(currentView as any).panel} 
          />
        );
      case 'version_control':
        return <VersionControlView />;
      case 'audit_trail':
        return <AuditTrailView />;
      case 'custom_component_designer':
        return <CustomComponentDesigner componentId={(currentView as any).componentId} />;
      case 'custom_components_manager':
        return <CustomComponentsManager />;
      default:
        return null;
    }
};
