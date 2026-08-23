
import { create } from 'zustand';
import { TableNode, MessageModalConfig, ViewType, Table, Query, Report, Form, Chart, Workflow, ToastInfo } from '../types/index';

interface UIStore {
  // Appearance
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Layout State
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isRibbonOpen: boolean;
  setIsRibbonOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  
  // MS Access Backstage State
  isBackstageOpen: boolean;
  setIsBackstageOpen: (open: boolean) => void;
  backstageActiveTab: 'startseite' | 'neu' | 'oeffnen' | 'info' | 'ueber_db_studio' | 'speichern' | 'speichern_unter' | 'drucken' | 'konto' | 'optionen';
  setBackstageActiveTab: (tab: 'startseite' | 'neu' | 'oeffnen' | 'info' | 'ueber_db_studio' | 'speichern' | 'speichern_unter' | 'drucken' | 'konto' | 'optionen') => void;
  
  // Navigation State
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeObject: Table | Query | Report | Form | Chart | Workflow | any | null;
  setActiveObject: (obj: any | null) => void;
  
  // Dirty State
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  savePrompt: { show: boolean, targetView?: ViewType };
  setSavePrompt: (prompt: { show: boolean, targetView?: ViewType }) => void;
  
  // Interaction State
  relationshipNodes: TableNode[];
  setRelationshipNodes: (nodes: TableNode[]) => void;
  formActionTrigger: { action: string, timestamp: number } | undefined;
  setFormActionTrigger: (trigger: { action: string, timestamp: number } | undefined) => void;
  pageActionTrigger: { action: string; payload?: any; timestamp: number } | undefined;
  setPageActionTrigger: (trigger: { action: string; payload?: any; timestamp: number } | undefined) => void;
  isPageToolboxOpen: boolean;
  setIsPageToolboxOpen: (open: boolean) => void;
  isPagePropertiesOpen: boolean;
  setIsPagePropertiesOpen: (open: boolean) => void;
  
  // Toasts
  toasts: ToastInfo[];
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: number) => void;
  
  // Modals
  messageModal: MessageModalConfig | null;
  showMessage: (title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') => void;
  closeMessage: () => void;
  
  itemContextMenu: { type: string; id: string; x: number; y: number; } | null;
  setItemContextMenu: (menu: { type: string; id: string; x: number; y: number; } | null) => void;
  
  nameInput: { title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void; } | null;
  setNameInput: (input: any | null) => void;
  
  confirmationModal: any | null;
  setConfirmationModal: (modal: any | null) => void;
  
  // Wizards
  showReportWizard: boolean;
  setShowReportWizard: (show: boolean) => void;
  showFormWizard: boolean;
  setShowFormWizard: (show: boolean) => void;
  showExcelWizard: boolean;
  setShowExcelWizard: (show: boolean) => void;
  showAccessWizard: boolean;
  setShowAccessWizard: (show: boolean) => void;
  showDummyDataWizard: boolean;
  setShowDummyDataWizard: (show: boolean) => void;
  showSharePointWizard: boolean;
  setShowSharePointWizard: (show: boolean) => void;
  showSchemaWizard: boolean;
  setShowSchemaWizard: (show: boolean) => void;
  
  showElectronSettings: boolean;
  setShowElectronSettings: (show: boolean) => void;
  showSecurityManager: boolean;
  setShowSecurityManager: (show: boolean) => void;
  showWhitelabelModal: boolean;
  setShowWhitelabelModal: (show: boolean) => void;
  showEnvModal: boolean;
  setShowEnvModal: (show: boolean) => void;
  showMigrationModal: boolean;
  setShowMigrationModal: (show: boolean) => void;
  showIntegrationsModal: boolean;
  setShowIntegrationsModal: (show: boolean) => void;
  showDeploymentModal: boolean;
  setShowDeploymentModal: (show: boolean) => void;
  showOfflineSyncModal: boolean;
  setShowOfflineSyncModal: (show: boolean) => void;
  showButtonInfoModal: boolean;
  setShowButtonInfoModal: (show: boolean) => void;
  showTableTemplateManager: boolean;
  setShowTableTemplateManager: (show: boolean) => void;
  saveTableAsTemplateModal: { show: boolean; table?: Table } | null;
  setSaveTableAsTemplateModal: (modal: { show: boolean; table?: Table } | null) => void;
  
  showAiCopilotModal: boolean;
  setShowAiCopilotModal: (show: boolean) => void;
  aiCopilotTab: 'schema' | 'query' | 'optimizer';
  setAiCopilotTab: (tab: 'schema' | 'query' | 'optimizer') => void;

  showSchemaDiffModal: boolean;
  setShowSchemaDiffModal: (show: boolean) => void;
  showOpenApiModal: boolean;
  setShowOpenApiModal: (show: boolean) => void;
  showSecurityRlsModal: boolean;
  setShowSecurityRlsModal: (show: boolean) => void;
  showAuditTrailModal: boolean;
  setShowAuditTrailModal: (show: boolean) => void;
  
  activeWizard: string | null;
  setActiveWizard: (wizard: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  darkMode: (() => {
    try {
      const stored = localStorage.getItem('editor-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) { return false; }
  })(),
  toggleDarkMode: () => set((state) => {
    const next = !state.darkMode;
    try { localStorage.setItem('editor-theme', next ? 'dark' : 'light'); } catch (e) {}
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    return { darkMode: next };
  }),

  isSidebarOpen: true,
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isRibbonOpen: true,
  setIsRibbonOpen: (open) => set({ isRibbonOpen: open }),
  isChatOpen: false,
  setIsChatOpen: (open) => set({ isChatOpen: open }),

  isBackstageOpen: false,
  setIsBackstageOpen: (open) => set({ isBackstageOpen: open }),
  backstageActiveTab: 'startseite',
  setBackstageActiveTab: (tab) => set({ backstageActiveTab: tab }),

  currentView: { type: 'welcome' },
  setCurrentView: (view) => set({ currentView: view }),
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeObject: null,
  setActiveObject: (obj) => set({ activeObject: obj }),
  
  isDirty: false,
  setIsDirty: (dirty) => set({ isDirty: dirty }),
  savePrompt: { show: false },
  setSavePrompt: (savePrompt) => set({ savePrompt }),

  relationshipNodes: [],
  setRelationshipNodes: (relationshipNodes) => set({ relationshipNodes }),
  formActionTrigger: undefined,
  setFormActionTrigger: (formActionTrigger) => set({ formActionTrigger }),
  pageActionTrigger: undefined,
  setPageActionTrigger: (pageActionTrigger) => set({ pageActionTrigger }),
  isPageToolboxOpen: false, // Default collapsed to maximize canvas space
  setIsPageToolboxOpen: (isPageToolboxOpen) => set({ isPageToolboxOpen }),
  isPagePropertiesOpen: true,
  setIsPagePropertiesOpen: (isPagePropertiesOpen) => set({ isPagePropertiesOpen }),

  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type: type as any }] }));
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  messageModal: null,
  showMessage: (title, message, type = 'info') => set({ messageModal: { title, message, type: type as any } }),
  closeMessage: () => set({ messageModal: null }),

  itemContextMenu: null,
  setItemContextMenu: (itemContextMenu) => set({ itemContextMenu }),
  nameInput: null,
  setNameInput: (nameInput) => set({ nameInput }),
  confirmationModal: null,
  setConfirmationModal: (confirmationModal) => set({ confirmationModal }),

  showReportWizard: false,
  setShowReportWizard: (showReportWizard) => set({ showReportWizard }),
  showFormWizard: false,
  setShowFormWizard: (showFormWizard) => set({ showFormWizard }),
  showExcelWizard: false,
  setShowExcelWizard: (showExcelWizard) => set({ showExcelWizard }),
  showAccessWizard: false,
  setShowAccessWizard: (showAccessWizard) => set({ showAccessWizard }),
  showDummyDataWizard: false,
  setShowDummyDataWizard: (showDummyDataWizard) => set({ showDummyDataWizard }),
  showSharePointWizard: false,
  setShowSharePointWizard: (showSharePointWizard) => set({ showSharePointWizard }),
  showSchemaWizard: false,
  setShowSchemaWizard: (showSchemaWizard) => set({ showSchemaWizard }),

  showElectronSettings: false,
  setShowElectronSettings: (showElectronSettings) => set({ showElectronSettings }),
  showSecurityManager: false,
  setShowSecurityManager: (showSecurityManager) => set({ showSecurityManager }),
  showWhitelabelModal: false,
  setShowWhitelabelModal: (showWhitelabelModal) => set({ showWhitelabelModal }),
  showEnvModal: false,
  setShowEnvModal: (showEnvModal) => set({ showEnvModal }),
  showMigrationModal: false,
  setShowMigrationModal: (showMigrationModal) => set({ showMigrationModal }),
  showIntegrationsModal: false,
  setShowIntegrationsModal: (showIntegrationsModal) => set({ showIntegrationsModal }),
  showDeploymentModal: false,
  setShowDeploymentModal: (showDeploymentModal) => set({ showDeploymentModal }),
  showOfflineSyncModal: false,
  setShowOfflineSyncModal: (showOfflineSyncModal) => set({ showOfflineSyncModal }),
  showButtonInfoModal: false,
  setShowButtonInfoModal: (showButtonInfoModal) => set({ showButtonInfoModal }),
  showTableTemplateManager: false,
  setShowTableTemplateManager: (showTableTemplateManager) => set({ showTableTemplateManager }),
  saveTableAsTemplateModal: null,
  setSaveTableAsTemplateModal: (saveTableAsTemplateModal) => set({ saveTableAsTemplateModal }),

  showAiCopilotModal: false,
  setShowAiCopilotModal: (showAiCopilotModal) => set({ showAiCopilotModal }),
  aiCopilotTab: 'schema',
  setAiCopilotTab: (aiCopilotTab) => set({ aiCopilotTab }),

  showSchemaDiffModal: false,
  setShowSchemaDiffModal: (showSchemaDiffModal) => set({ showSchemaDiffModal }),
  showOpenApiModal: false,
  setShowOpenApiModal: (showOpenApiModal) => set({ showOpenApiModal }),
  showSecurityRlsModal: false,
  setShowSecurityRlsModal: (showSecurityRlsModal) => set({ showSecurityRlsModal }),
  showAuditTrailModal: false,
  setShowAuditTrailModal: (showAuditTrailModal) => set({ showAuditTrailModal }),

  activeWizard: null,
  setActiveWizard: (activeWizard) => set({ activeWizard }),
}));
