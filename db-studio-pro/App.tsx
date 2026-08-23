
import React from 'react';
import { Ribbon } from './components/Ribbon';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { StatusBar } from './components/StatusBar';
import { AccessBackstageView } from './features/backstage/AccessBackstageView';
import { AppHeader } from './components/AppHeader';
import { ModalLayer } from './components/ModalLayer';
import { ToastContainer } from './components/Toast';
import { ChatPanel } from './components/ChatPanel';
import { ThemeInjector } from './components/ThemeInjector';
import { useAppController } from './hooks/useAppController';
import { useAuthStore } from './stores/useAuthStore';
import { useUIStore } from './stores/useUIStore';

export default function App() {
  const app = useAppController();
  const { db } = app;
  const { isBackstageOpen, setIsBackstageOpen, setActiveTab } = useUIStore();
  const { checkAdSession } = useAuthStore();

  React.useEffect(() => {
    if (checkAdSession) {
      checkAdSession();
    }
  }, [checkAdSession]);

  // If no project is currently open, show MS Access Start / Backstage View directly
  if (!db.projectId) {
    return (
      <div className="flex flex-col h-screen overflow-hidden text-sm bg-[#2b2b2b] text-neutral-100 font-sans">
        <ThemeInjector />
        <AccessBackstageView />
        <ModalLayer 
          onCloseSavePrompt={app.closeSavePrompt}
          onContextMenuAction={app.handleContextMenuAction}
          onSaveWizardQuery={app.onSaveWizardQuery}
          onExecuteAppend={app.onExecuteAppend}
          onExecuteDelete={app.onExecuteDelete}
          onSaveElectronSettings={app.onSaveElectronSettings}
          onSetView={app.handleSetView}
        />
        <ToastContainer toasts={app.toasts} onDismiss={app.removeToast} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-sm bg-slate-100 dark:bg-slate-900 font-sans transition-colors duration-300 relative">
      <ThemeInjector />
      <AppHeader onAction={app.handleRibbonAction} chats={app.chats} />
      
      <Ribbon onAction={app.handleRibbonAction} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar onSetView={app.handleSetView} />
        
        <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
          <Workspace onSetView={app.handleSetView} onActiveObjectChange={app.handleActiveObjectChange} />
        </div>

        <ChatPanel 
            isOpen={app.isChatOpen} 
            onClose={() => app.setIsChatOpen(false)}
            chats={app.chats}
            activeChatId={app.activeChatId}
            onSelectChat={app.handleSelectChat}
            onSendMessage={app.handleSendMessage}
        />
      </div>

      <StatusBar 
        currentView={app.currentView} 
        activeObject={app.activeObject} 
        onSetView={app.handleSetView} 
      />
      
      {/* MS Access Backstage View Overlay when 'Datei' (File) is clicked */}
      {isBackstageOpen && (
        <AccessBackstageView 
          onCloseBackstage={() => {
            setIsBackstageOpen(false);
            if (app.activeTab === 'file') {
              setActiveTab('home');
            }
          }} 
        />
      )}

      {/* ModalLayer rendered AFTER BackstageView so all modals (Close, Save, Wizards) sit cleanly above Backstage */}
      <ModalLayer 
        onCloseSavePrompt={app.closeSavePrompt}
        onContextMenuAction={app.handleContextMenuAction}
        onSaveWizardQuery={app.onSaveWizardQuery}
        onExecuteAppend={app.onExecuteAppend}
        onExecuteDelete={app.onExecuteDelete}
        onSaveElectronSettings={app.onSaveElectronSettings}
        onSetView={app.handleSetView}
      />

      <ToastContainer toasts={app.toasts} onDismiss={app.removeToast} />
    </div>
  );
}
