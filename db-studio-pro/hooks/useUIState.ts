
import { useState, useEffect } from 'react';
import { ToastInfo } from '../components/Toast';
import { TableNode, MessageModalConfig } from '../types/index';

export const useUIState = () => {
  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('editor-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem('editor-theme', next ? 'dark' : 'light');
      } catch (e) {}
      return next;
    });
  };

  // Layout
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRibbonOpen, setIsRibbonOpen] = useState(true);
  const [relationshipNodes, setRelationshipNodes] = useState<TableNode[]>([]);
  const [formActionTrigger, setFormActionTrigger] = useState<{ action: string, timestamp: number } | undefined>(undefined);

  // Toasts
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: number) => { setToasts(prev => prev.filter(t => t.id !== id)); };

  // Global Modals & Inputs
  const [messageModal, setMessageModal] = useState<MessageModalConfig | null>(null);
  const [itemContextMenu, setItemContextMenu] = useState<{
    type: 'table' | 'query' | 'report' | 'form' | 'chart' | 'workflow';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  
  const [nameInput, setNameInput] = useState<{
    title: string; label: string; initialValue: string; onConfirm: (name: string) => void; onCancel: () => void;
  } | null>(null);

  const [confirmationModal, setConfirmationModal] = useState<{
    title: string; 
    message: string; 
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    onAlternate?: () => void;
    alternateText?: string;
    confirmClass?: string;
  } | null>(null);

  // Wizards & Features Modals
  const [showReportWizard, setShowReportWizard] = useState(false);
  const [showFormWizard, setShowFormWizard] = useState(false);
  const [showExcelWizard, setShowExcelWizard] = useState(false);
  const [showAccessWizard, setShowAccessWizard] = useState(false);
  const [showDummyDataWizard, setShowDummyDataWizard] = useState(false);
  const [showSharePointWizard, setShowSharePointWizard] = useState(false);
  const [showSchemaWizard, setShowSchemaWizard] = useState(false);
  
  const [showElectronSettings, setShowElectronSettings] = useState(false);
  const [showSecurityManager, setShowSecurityManager] = useState(false);
  const [showWhitelabelModal, setShowWhitelabelModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);

  const [activeWizard, setActiveWizard] = useState<'duplicate' | 'inconsistency' | 'append' | 'delete' | null>(null);

  const showMessage = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
      setMessageModal({ title, message, type });
  };

  return {
      isSidebarOpen, setIsSidebarOpen,
      isRibbonOpen, setIsRibbonOpen,
      relationshipNodes, setRelationshipNodes,
      formActionTrigger, setFormActionTrigger,
      
      toasts, addToast, removeToast,
      
      messageModal, setMessageModal, showMessage, closeMessage: () => setMessageModal(null),
      itemContextMenu, setItemContextMenu,
      nameInput, setNameInput,
      confirmationModal, setConfirmationModal,
      
      showReportWizard, setShowReportWizard,
      showFormWizard, setShowFormWizard,
      showExcelWizard, setShowExcelWizard,
      showAccessWizard, setShowAccessWizard,
      showDummyDataWizard, setShowDummyDataWizard,
      showSharePointWizard, setShowSharePointWizard,
      showSchemaWizard, setShowSchemaWizard,
      
      showElectronSettings, setShowElectronSettings,
      showSecurityManager, setShowSecurityManager,
      showWhitelabelModal, setShowWhitelabelModal,
      showEnvModal, setShowEnvModal,
      showMigrationModal, setShowMigrationModal,
      showIntegrationsModal, setShowIntegrationsModal,
      showDeploymentModal, setShowDeploymentModal,
      
      activeWizard, setActiveWizard,
      darkMode, toggleDarkMode
  };
};
