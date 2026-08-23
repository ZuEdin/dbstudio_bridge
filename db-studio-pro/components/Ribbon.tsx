
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { ConnectionSettingsModal } from './modals/ConnectionSettingsModal';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';

// Tabs
import { FileTab } from './ribbon/tabs/FileTab';
import { HomeTab } from './ribbon/tabs/HomeTab';
import { CreateTab } from './ribbon/tabs/CreateTab';
import { PagesTab } from './ribbon/tabs/PagesTab';
import { ExternalDataTab } from './ribbon/tabs/ExternalDataTab';
import { DeployTab } from './ribbon/tabs/DeployTab';
import { FormDesignTab } from './ribbon/tabs/FormDesignTab';
import { ReportDesignTab } from './ribbon/tabs/ReportDesignTab';
import { WorkflowDesignTab } from './ribbon/tabs/WorkflowDesignTab';
import { ERDiagramTab } from './ribbon/tabs/ERDiagramTab';
import { ProjectsTab } from './ribbon/tabs/ProjectsTab';
import { PageDesignTab } from './ribbon/tabs/PageDesignTab';

interface RibbonProps {
  onAction: (action: string, payload?: any) => void;
}

export const Ribbon: React.FC<RibbonProps> = ({ onAction }) => {
  const store = useProjectStore();
  const ui = useUIStore();
  
  const { backendConfig, setBackendConfig } = store;
  const { activeTab, setActiveTab, currentView, isRibbonOpen: isOpen, setIsRibbonOpen: setIsOpen } = ui;
  const currentDbType = backendConfig?.dbType || 'SQLITE';

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { t } = useTranslation();

  const toggleRibbon = () => setIsOpen(!isOpen);

  // Automatisch zum Kontext-Tab wechseln
  useEffect(() => {
    if (currentView.type === 'form_designer') {
      setActiveTab('form_design');
    } else if (currentView.type === 'report_designer') {
      setActiveTab('report_design');
    } else if (currentView.type === 'workflow_designer') {
      setActiveTab('workflow_design');
    } else if (currentView.type === 'page_designer') {
      setActiveTab('page_design');
    } else if (currentView.type === 'relationships') {
      setActiveTab('er_diagram');
    }
  }, [currentView.type, setActiveTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'file':
        return <FileTab onAction={onAction} currentDbType={currentDbType} />;
      case 'home':
        return <HomeTab onAction={onAction} />;
      case 'create':
        return <CreateTab onAction={onAction} />;
      case 'pages':
        return <PagesTab onAction={onAction} />;
      case 'page_design':
        return <PageDesignTab onAction={onAction} />;
      case 'external':
        return <ExternalDataTab onAction={onAction} />;
      case 'deploy':
        if (!backendConfig || !setBackendConfig) return null;
        return (
          <DeployTab 
            onAction={onAction} 
            backendConfig={backendConfig} 
            setBackendConfig={setBackendConfig} 
            onOpenSettings={() => setShowConnectionModal(true)} 
          />
        );
      case 'form_design':
        return <FormDesignTab onAction={onAction} />;
      case 'report_design':
        return <ReportDesignTab onAction={onAction} />;
      case 'workflow_design':
        return <WorkflowDesignTab onAction={onAction} />;
      case 'er_diagram':
        return <ERDiagramTab onAction={onAction} />;
      case 'projekte':
        return <ProjectsTab onAction={onAction} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-slate-100 border-b border-slate-300 select-none relative z-[100] transition-all duration-300 print:hidden">
      {/* Tab Headers and Toggle */}
      <div className="flex bg-slate-800 text-white pt-1 px-2 gap-1 overflow-x-auto items-end justify-between">
        <div className="flex gap-1">
            <button 
              onClick={() => {
                ui.setIsBackstageOpen(true);
                ui.setBackstageActiveTab('startseite');
              }}
              className="px-4 py-1 rounded-t-lg text-sm whitespace-nowrap bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              title="Datei-Menü & Startseite (DB Studio Backstage View)"
            >
              <span>{t('ribbon.file')}</span>
            </button>
            <button 
            onClick={() => setActiveTab('home')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'home' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Start
            </button>
            <button 
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'create' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            {t('ribbon.create')}
            </button>
            <button 
            onClick={() => setActiveTab('external')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'external' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Externe Daten
            </button>
            <button 
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap ${activeTab === 'pages' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Pages & SDUI
            </button>
            <button 
            onClick={() => setActiveTab('projekte')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-emerald-500 ${activeTab === 'projekte' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Projekte
            </button>
            <button 
            onClick={() => setActiveTab('deploy')}
            className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-green-500 ${activeTab === 'deploy' ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-700'}`}
            >
            Bereitstellung & Generator
            </button>
            
            {/* Context Tabs */}
            {currentView.type === 'form_designer' && (
            <button 
                onClick={() => setActiveTab('form_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-indigo-500 ${activeTab === 'form_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-indigo-900 hover:bg-indigo-800'}`}
            >
                {t('ribbon.form_design')}
            </button>
            )}
            {currentView.type === 'report_designer' && (
            <button 
                onClick={() => setActiveTab('report_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-purple-500 ${activeTab === 'report_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-purple-900 hover:bg-purple-800'}`}
            >
                {t('ribbon.report_design')}
            </button>
            )}
            {currentView.type === 'workflow_designer' && (
            <button 
                onClick={() => setActiveTab('workflow_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-emerald-500 ${activeTab === 'workflow_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-emerald-900 hover:bg-emerald-800'}`}
            >
                Workflow Design
            </button>
            )}
            {currentView.type === 'page_designer' && (
            <button 
                onClick={() => setActiveTab('page_design')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-indigo-400 ${activeTab === 'page_design' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-indigo-950 text-indigo-200 hover:bg-indigo-900'}`}
            >
                Page Design (Entwurf)
            </button>
            )}
            {currentView.type === 'relationships' && (
            <button 
                onClick={() => setActiveTab('er_diagram')}
                className={`px-4 py-1 rounded-t-lg text-sm whitespace-nowrap border-t-2 border-blue-500 ${activeTab === 'er_diagram' ? 'bg-slate-100 text-slate-900 font-semibold' : 'bg-blue-900 hover:bg-blue-800'}`}
            >
                ER-Diagramm
            </button>
            )}
        </div>
        
        <div className="flex items-center gap-1 pb-1">
          <button 
            onClick={() => ui.setShowButtonInfoModal(true)} 
            className="text-slate-400 hover:text-white px-2 py-1 flex items-center gap-1.5 rounded hover:bg-slate-700/70 transition-colors text-xs font-medium" 
            title="Informationen zu allen Schaltflächen / Buttons öffnen"
          >
            <HelpCircle size={15} className="text-amber-400 shrink-0" />
            <span className="hidden md:inline text-slate-300">Schaltflächen-Info</span>
          </button>

          <button onClick={toggleRibbon} className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700/70 transition-colors" title={isOpen ? "Menüband minimieren" : "Menüband erweitern"}>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {isOpen && (
        <div className="h-28 px-4 flex items-center gap-2 overflow-visible shadow-inner bg-slate-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {renderActiveTab()}
        </div>
      )}

      {/* Connection Modal */}
      {showConnectionModal && backendConfig && setBackendConfig && (
          <ConnectionSettingsModal 
            dbType={backendConfig.dbType}
            currentConnectionString={backendConfig.dbConnection}
            onSave={(newConn) => setBackendConfig({...backendConfig, dbConnection: newConn})}
            onClose={() => setShowConnectionModal(false)}
          />
      )}
    </div>
  );
};
