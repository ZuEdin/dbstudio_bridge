import React from 'react';
import { Table, Query, Relationship } from '../../types/index';

// Subcomponents imports
import { LiveSyncTab } from './dbstudio/components/LiveSyncTab';
import { SchemaMigrationsTab } from './dbstudio/components/SchemaMigrationsTab';
import { ApiPlaygroundTab } from './dbstudio/components/ApiPlaygroundTab';
import { InboundWebhooksTab } from './dbstudio/components/InboundWebhooksTab';
import { SecurityRbacTab } from './dbstudio/components/SecurityRbacTab';
import { LiveMonitorTab } from './dbstudio/components/LiveMonitorTab';
import { MetadataSchemaTab } from './dbstudio/components/MetadataSchemaTab';
import { TeamCloudTab } from './dbstudio/components/TeamCloudTab';
import { LiveServerRunnerTab } from './dbstudio/components/LiveServerRunnerTab';
import { TeamChatModal } from './components/TeamChatModal';

// Refactored Subcomponents
import { BackendHeader } from './dbstudio/components/BackendHeader';
import { BackendTabNavigation } from './dbstudio/components/BackendTabNavigation';
import { FkValidationModal } from './dbstudio/components/FkValidationModal';
import { NewProjectModal } from './dbstudio/components/NewProjectModal';
import { SelfHostConfigModal } from './dbstudio/components/SelfHostConfigModal';

// Hooks import
import { useDbstudioBackend } from './dbstudio/hooks/useDbstudioBackend';

interface DbstudioBackendViewProps {
  tables: Table[];
  relationships?: Relationship[];
  queries: Query[];
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  onSetView: (view: any) => void;
}

export const DbstudioBackendView: React.FC<DbstudioBackendViewProps> = ({ 
  tables, 
  relationships = [],
  queries, 
  showMessage, 
  onSetView 
}) => {
  const {
    config,
    updateConfig,
    activeMode,
    setActiveMode,
    selectedTables,
    setSelectedTables,
    selectedQueries,
    setSelectedQueries,
    implementGoal,
    setImplementGoal,
    genCrud,
    setGenCrud,
    genTypes,
    setGenTypes,
    enableRls,
    setEnableRls,
    backendTemplate,
    setBackendTemplate,
    authProvider,
    setAuthProvider,
    selfHostLang,
    setSelfHostLang,
    subfolderPath,
    setSubfolderPath,
    includeWwwroot,
    setIncludeWwwroot,
    showSelfHostConfigModal,
    setShowSelfHostConfigModal,
    mainSectionTab,
    setMainSectionTab,
    deployedPort,
    deployedPid,
    runnerStatus,
    runnerLogs,
    setRunnerLogs,
    isDeployingServer,
    remoteServerUrl,
    setRemoteServerUrl,
    serverHealth,
    setServerHealth,
    isTestingServer,
    autoSyncEnabled,
    setAutoSyncEnabled,
    isUploading,
    isDownloading,
    liveSyncStatus,
    liveSyncStatusMsg,
    externalSqlConnected,
    externalSqlLogs,
    isSyncingSql,
    migrationDialect,
    setMigrationDialect,
    apiSpecTab,
    setApiSpecTab,
    playgroundTable,
    setPlaygroundTable,
    playgroundMethod,
    setPlaygroundMethod,
    playgroundPayload,
    setPlaygroundPayload,
    playgroundResponse,
    isExecutingApiReq,
    rbacRoles,
    setRbacRoles,
    selectedRole,
    setSelectedRole,
    jwtExpiry,
    setJwtExpiry,
    rateLimitMax,
    setRateLimitMax,
    corsOrigins,
    setCorsOrigins,
    qpsCount,
    avgLatency,
    auditLogs,
    syncStatus,
    syncLogs,
    fkErrors,
    showFkValidationModal,
    setShowFkValidationModal,
    selectedSystemTable,
    setSelectedSystemTable,
    backendDetected,
    setBackendDetected,
    adConnected,
    setAdConnected,
    adServerAddress,
    setAdServerAddress,
    adBaseDn,
    setAdBaseDn,
    adServiceAccountUsername,
    setAdServiceAccountUsername,
    adServiceAccountPassword,
    setAdServiceAccountPassword,
    adGroupMappings,
    setAdGroupMappings,
    teamProjects,
    teamMembers,
    activeTeamProjectId,
    setActiveTeamProjectId,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteRole,
    setInviteRole,
    editingMember,
    setEditingMember,
    newProjName,
    setNewProjName,
    newProjDesc,
    setNewProjDesc,
    showNewProjModal,
    setShowNewProjModal,
    showTeamChatModal,
    setShowTeamChatModal,
    handleToggleExternalConnection,
    handleDeployServer,
    handleStopDeployedServer,
    handleAddTeamMember,
    handleUpdateTeamMember,
    handleDeleteTeamMember,
    handleCreateTeamProject,
    handleToggleTable,
    handleToggleQuery,
    handleFixFkError,
    handleFixAllFkErrors,
    runSyncSimulation,
    handleTestServerConnection,
    handlePushLiveSync,
    handlePullMetadata,
    handleSimulateTraffic,
    executeDownloadZip,
    executeUploadSimulation,
    systemSchema,
  } = useDbstudioBackend({
    tables,
    relationships,
    queries,
    showMessage,
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <BackendHeader
        configMode={config.mode}
        onActivateBackend={() => {
          updateConfig({ mode: 'REGISTERED' });
          setActiveMode('cloud');
          showMessage("Backend Aktiviert", "Das Enterprise-Backend wurde erfolgreich aktiviert und auf den Produktiv-Modus umgestellt.", "success");
        }}
        selfHostLang={selfHostLang}
        setSelfHostLang={setSelfHostLang}
        onOpenTeamChat={() => setShowTeamChatModal(true)}
        onOpenSelfHostConfig={() => setShowSelfHostConfigModal(true)}
        subfolderPath={subfolderPath}
        onDownloadZip={executeDownloadZip}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        showMessage={showMessage}
      />

      <BackendTabNavigation
        mainSectionTab={mainSectionTab}
        setMainSectionTab={setMainSectionTab}
        serverHealth={serverHealth}
        runnerStatus={runnerStatus}
        teamMembersCount={teamMembers.length}
      />

      {/* Main Content Layout */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {mainSectionTab === 'sync' && (
          <LiveSyncTab
            serverHealth={serverHealth}
            serverUrl={remoteServerUrl}
            setServerUrl={setRemoteServerUrl}
            isTestingServer={isTestingServer}
            handleTestServerConnection={handleTestServerConnection}
            autoSyncEnabled={autoSyncEnabled}
            setAutoSyncEnabled={setAutoSyncEnabled}
            isUploading={isUploading}
            handleSyncMetadata={handlePushLiveSync}
            isDownloading={isDownloading}
            handlePullMetadata={handlePullMetadata}
            syncPrompt={implementGoal}
            setSyncPrompt={setImplementGoal}
            tables={tables}
            selectedTables={selectedTables}
            onToggleTable={handleToggleTable}
            queries={queries}
            selectedQueries={selectedQueries}
            onToggleQuery={handleToggleQuery}
            syncStatus={liveSyncStatus}
            syncStatusMsg={liveSyncStatusMsg}
            externalSqlConnected={externalSqlConnected}
            externalSqlLogs={externalSqlLogs}
            isSyncingSql={isSyncingSql}
            onToggleConnection={handleToggleExternalConnection}
          />
        )}

        {mainSectionTab === 'migrations' && (
          <SchemaMigrationsTab
            tables={tables}
            selectedTables={selectedTables}
            relationships={relationships}
            queries={queries}
            selectedQueries={selectedQueries}
            migrationDialect={migrationDialect}
            setMigrationDialect={setMigrationDialect}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'api_playground' && (
          <ApiPlaygroundTab
            tables={tables}
            selectedTables={selectedTables}
            queries={queries}
            selectedQueries={selectedQueries}
            remoteServerUrl={remoteServerUrl}
            apiSpecTab={apiSpecTab}
            setApiSpecTab={setApiSpecTab}
            playgroundTable={playgroundTable}
            setPlaygroundTable={setPlaygroundTable}
            playgroundMethod={playgroundMethod}
            setPlaygroundMethod={setPlaygroundMethod}
            playgroundPayload={playgroundPayload}
            setPlaygroundPayload={setPlaygroundPayload}
            playgroundResponse={playgroundResponse}
            isExecutingApiReq={isExecutingApiReq}
            executeApiRequest={handleTestServerConnection}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'webhooks' && (
          <InboundWebhooksTab
            remoteServerUrl={remoteServerUrl}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'security' && (
          <SecurityRbacTab
            tables={tables}
            rbacRoles={rbacRoles}
            setRbacRoles={setRbacRoles}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            jwtExpiry={jwtExpiry}
            setJwtExpiry={setJwtExpiry}
            rateLimitMax={rateLimitMax}
            setRateLimitMax={setRateLimitMax}
            corsOrigins={corsOrigins}
            setCorsOrigins={setCorsOrigins}
            showMessage={showMessage}
            selectedTables={selectedTables}
          />
        )}

        {mainSectionTab === 'monitor' && (
          <LiveMonitorTab
            qpsCount={qpsCount}
            avgLatency={avgLatency}
            auditLogs={auditLogs}
            handleSimulateTraffic={handleSimulateTraffic}
          />
        )}

        {mainSectionTab === 'self_host' && (
          <MetadataSchemaTab
            activeMode={activeMode}
            systemSchema={systemSchema}
            selectedSystemTable={selectedSystemTable}
            setSelectedSystemTable={setSelectedSystemTable}
            tables={tables}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
            handleToggleTable={handleToggleTable}
            queries={queries}
            selectedQueries={selectedQueries}
            setSelectedQueries={setSelectedQueries}
            handleToggleQuery={handleToggleQuery}
            implementGoal={implementGoal}
            setImplementGoal={setImplementGoal}
            backendTemplate={backendTemplate}
            setBackendTemplate={setBackendTemplate}
            authProvider={authProvider}
            setAuthProvider={setAuthProvider}
            genCrud={genCrud}
            setGenCrud={setGenCrud}
            genTypes={genTypes}
            setGenTypes={setGenTypes}
            enableRls={enableRls}
            setEnableRls={setEnableRls}
            runSyncSimulation={runSyncSimulation}
            syncStatus={syncStatus}
            syncLogs={syncLogs}
          />
        )}

        {mainSectionTab === 'team' && (
          <TeamCloudTab
            backendDetected={backendDetected}
            setBackendDetected={setBackendDetected}
            remoteServerUrl={remoteServerUrl}
            setRemoteServerUrl={setRemoteServerUrl}
            serverHealth={serverHealth}
            setServerHealth={setServerHealth}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            adConnected={adConnected}
            setAdConnected={setAdConnected}
            adServerAddress={adServerAddress}
            setAdServerAddress={setAdServerAddress}
            adBaseDn={adBaseDn}
            setAdBaseDn={setAdBaseDn}
            adServiceAccountUsername={adServiceAccountUsername}
            setAdServiceAccountUsername={setAdServiceAccountUsername}
            adServiceAccountPassword={adServiceAccountPassword}
            setAdServiceAccountPassword={setAdServiceAccountPassword}
            adGroupMappings={adGroupMappings}
            setAdGroupMappings={setAdGroupMappings}
            teamProjects={teamProjects}
            activeTeamProjectId={activeTeamProjectId}
            setActiveTeamProjectId={setActiveTeamProjectId}
            setShowNewProjModal={setShowNewProjModal}
            teamMembers={teamMembers}
            editingMember={editingMember}
            setEditingMember={setEditingMember}
            inviteEmail={inviteEmail}
            setInviteEmail={setInviteEmail}
            inviteName={inviteName}
            setInviteName={setInviteName}
            inviteRole={inviteRole}
            setInviteRole={setInviteRole}
            handleUpdateTeamMember={handleUpdateTeamMember}
            handleDeleteTeamMember={handleDeleteTeamMember}
            handleAddTeamMember={handleAddTeamMember}
            showMessage={showMessage}
          />
        )}

        {mainSectionTab === 'deploy' && (
          <LiveServerRunnerTab
            runnerStatus={runnerStatus}
            deployedPort={deployedPort}
            deployedPid={deployedPid}
            isDeployingServer={isDeployingServer}
            runnerLogs={runnerLogs}
            setRunnerLogs={setRunnerLogs}
            handleStopDeployedServer={handleStopDeployedServer}
            handleDeployServer={handleDeployServer}
          />
        )}
      </div>

      <FkValidationModal
        isOpen={showFkValidationModal}
        onClose={() => setShowFkValidationModal(false)}
        fkErrors={fkErrors}
        onFixFkError={handleFixFkError}
        onFixAllFkErrors={handleFixAllFkErrors}
        onConfirmUploadAnyway={() => {
          setShowFkValidationModal(false);
          executeUploadSimulation();
        }}
      />

      <NewProjectModal
        isOpen={showNewProjModal}
        onClose={() => setShowNewProjModal(false)}
        newProjName={newProjName}
        setNewProjName={setNewProjName}
        newProjDesc={newProjDesc}
        setNewProjDesc={setNewProjDesc}
        onSubmit={handleCreateTeamProject}
      />

      <SelfHostConfigModal
        isOpen={showSelfHostConfigModal}
        onClose={() => setShowSelfHostConfigModal(false)}
        selfHostLang={selfHostLang}
        setSelfHostLang={setSelfHostLang}
        subfolderPath={subfolderPath}
        setSubfolderPath={setSubfolderPath}
        includeWwwroot={includeWwwroot}
        setIncludeWwwroot={setIncludeWwwroot}
        onDownloadZip={executeDownloadZip}
      />

      <TeamChatModal 
        isOpen={showTeamChatModal} 
        onClose={() => setShowTeamChatModal(false)} 
      />
    </div>
  );
};
