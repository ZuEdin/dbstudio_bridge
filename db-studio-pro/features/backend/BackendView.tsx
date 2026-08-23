
import React, { useState, useEffect, useRef } from 'react';
import { Table, BackendConfig, VirtualFile, Relationship, Query, Form, Report, IntegrationsConfig, EnvironmentConfig, DbType, WhitelabelConfig, MultiTenancyConfig, LicensingConfig, CustomPage } from '../../types/index';
import Editor from '@monaco-editor/react';
import { FileCode, Download, Wand2, Folder, FolderOpen, ChevronRight, ChevronDown, RefreshCw, UploadCloud, GitBranch, CloudLightning, Globe, GitCommit, Briefcase, AlertCircle } from 'lucide-react';
import { generateBackendCode } from '../../utils/backendGenerators';
import { generateDeploymentScripts } from '../../utils/generators/deploymentGenerator';
import { sanitizeProjectName } from '../../utils/nameUtils';
import JSZip from 'jszip';
import { GitPushModal } from '../versioning/GitPushModal';
import { useProjectStore } from '../../stores/useProjectStore';
import { getSavedMacros } from '../logic/MacroEngine';
import { getApiUrl } from '../../stores/useConfigStore';

interface BackendViewProps {
  tables: Table[];
  relationships: Relationship[];
  queries: Query[];
  forms?: Form[]; 
  reports?: Report[]; 
  pages?: CustomPage[]; // NEW
  exportTrigger: number;
  generateTrigger: number;
  config: BackendConfig;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
  // Hooks to trigger global modals (passed from ViewRouter -> AppController)
  // We don't render modals here anymore, we assume they are triggered via Ribbon mostly.
  // But for the sidebar buttons inside BackendView, we need triggers.
  // Ideally these buttons should call `onAction` from AppController, but ViewRouter doesn't pass it fully.
  // For simplicity, we assume these buttons trigger the *global* modal state which is passed down via specific props if needed,
  // OR we just remove buttons from here that are now in the Ribbon to avoid confusion.
  // However, users might expect them here. 
  // Let's assume onUpdateEnvironments etc are just callbacks. The modals are rendered in ModalLayer.
  // We need a way to open them. ViewRouter passes specific callbacks? No, currently props are onUpdate...
  // Refactor: BackendView sidebar buttons will just be shortcuts that might need to be wired up or removed.
  // Given the instruction to move to Ribbon, I will REMOVE the buttons from the sidebar to declutter and rely on Ribbon.
  
  onOpenDeployment: () => void;
  lastSnapshot?: Table[];
  onSnapshot?: () => void;
  onUpdateEnvironments?: (envs: EnvironmentConfig[]) => void;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  file?: VirtualFile;
}

const buildFileTree = (files: VirtualFile[]): TreeNode[] => {
  const root: TreeNode[] = [];
  files.forEach(file => {
    const parts = file.path.replace(/\\/g, '/').split('/');
    let currentLevel = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      let existingNode = currentLevel.find(n => n.name === part);
      if (!existingNode) {
        existingNode = {
          name: part,
          path: path,
          type: isFile ? 'file' : 'folder',
          children: [],
          file: isFile ? file : undefined
        };
        currentLevel.push(existingNode);
      }
      currentLevel = existingNode.children;
    });
  });
  const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
      });
      nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(root);
  return root;
};

const FileTreeItem: React.FC<{ 
  node: TreeNode, 
  level: number, 
  selectedPath: string | undefined,
  onSelect: (file: VirtualFile) => void 
}> = ({ node, level, selectedPath, onSelect }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = node.type === 'file' && node.file?.path === selectedPath;
    
    const handleClick = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else if (node.file) {
            onSelect(node.file);
        }
    };

    const getIcon = () => {
        if (node.type === 'folder') {
            return isOpen ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />;
        }
        if (node.name.endsWith('.cs')) return <FileCode size={14} className="text-green-600" />;
        if (node.name.endsWith('.ts')) return <FileCode size={14} className="text-blue-500" />;
        if (node.name.endsWith('.js')) return <FileCode size={14} className="text-yellow-500" />;
        if (node.name.endsWith('.json')) return <FileCode size={14} className="text-orange-500" />;
        if (node.name.endsWith('.html')) return <FileCode size={14} className="text-red-500" />;
        if (node.name.endsWith('.vue')) return <FileCode size={14} className="text-emerald-500" />;
        return <FileCode size={14} className="text-slate-500" />;
    };

    return (
        <div>
            <div 
                className={`flex items-center gap-1.5 py-1 px-2 cursor-pointer select-none text-sm whitespace-nowrap ${isSelected ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100 text-slate-700'}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={handleClick}
            >
                <span className="text-slate-400">
                    {node.type === 'folder' && (
                        isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
                    )}
                    {node.type === 'file' && <div className="w-3" />}
                </span>
                {getIcon()}
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isOpen && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem 
                            key={child.path} 
                            node={child} 
                            level={level + 1} 
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const BackendView: React.FC<BackendViewProps> = ({ tables, relationships, queries, forms = [], reports = [], pages = [], exportTrigger, generateTrigger, config, showMessage, onOpenDeployment }) => {
  const [generatedFiles, setGeneratedFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  
  const { customComponents = [] } = useProjectStore();
  
  // Modals (Local only for Git Push, others are global via Ribbon)
  const [showGitModal, setShowGitModal] = useState(false);
  
  const [localConfig, setLocalConfig] = useState(config);
  const lastExportTriggerRef = useRef<number>(exportTrigger);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    handleGenerate();
  }, [generateTrigger, tables, relationships, queries, localConfig, customComponents]); 

  useEffect(() => {
      if(exportTrigger > 0 && exportTrigger !== lastExportTriggerRef.current) {
          lastExportTriggerRef.current = exportTrigger;
          handleExportZip();
      }
  }, [exportTrigger]);

  useEffect(() => {
      setFileTree(buildFileTree(generatedFiles));
  }, [generatedFiles]);

  const handleGenerate = () => {
    try {
        const macros = getSavedMacros();
        let files = generateBackendCode(tables, relationships, queries, localConfig, forms, reports, pages, customComponents, macros);
        
        if (localConfig.deploymentConfig) {
            const deployFiles = generateDeploymentScripts(localConfig, `Backend/${localConfig.projectName}`);
            files = [...files, ...deployFiles];
        }

        setGeneratedFiles(files);
        
        if (!selectedFile || !files.find(f => f.path === selectedFile.path)) {
            const entry = files.find(f => f.name === 'Program.cs' || f.name === 'server.js' || f.name === 'index.php') || files[0];
            setSelectedFile(entry || null);
        } else {
            const updated = files.find(f => f.path === selectedFile.path);
            if(updated && updated.content !== selectedFile.content) {
                setSelectedFile(updated);
            }
        }
    } catch (error: any) {
        console.error("Code Generation Error:", error);
        showMessage("Generierungsfehler", error.message, 'error');
    }
  };

  const handleExportZip = async () => {
    let filesToZip = generatedFiles;
    if (filesToZip.length === 0) {
      try {
        const macros = getSavedMacros();
        filesToZip = generateBackendCode(tables, relationships, queries, localConfig, forms, reports, pages, customComponents, macros);
        if (localConfig.deploymentConfig) {
          const deployFiles = generateDeploymentScripts(localConfig, `Backend/${localConfig.projectName}`);
          filesToZip = [...filesToZip, ...deployFiles];
        }
        setGeneratedFiles(filesToZip);
      } catch (err: any) {
        showMessage("Generierungsfehler", err.message || "Fehler beim Erstellen der Backend-Dateien", 'error');
        return;
      }
    }

    if (filesToZip.length === 0) {
        showMessage("Export fehlgeschlagen", "Keine Dateien zum Exportieren vorhanden.", 'warning');
        return;
    }
    const zip = new JSZip();
    const cleanProjectName = sanitizeProjectName(localConfig.projectName || 'MyProject');

    // Check if Electron project to add root-level convenience launcher scripts
    const hasBackendElectron = filesToZip.some(f => f.path.startsWith(`Backend/${cleanProjectName}`) && (f.path.includes('preload.js') || f.path.includes('main.js')));
    const isElectronProj = localConfig.language === 'electron' || localConfig.frontendFramework === 'electron' || hasBackendElectron;
    if (isElectronProj) {
        const electronDir = hasBackendElectron ? `Backend/${cleanProjectName}` : `ElectronApp`;
        zip.file("run.bat", `@echo off\r\ncls\r\necho Starte DB Studio Pro Electron Application...\r\ncd ${electronDir}\r\ncall run.bat\r\n`);
        zip.file("run.sh", `#!/bin/bash\n# DB Studio Pro Electron App Launcher for macOS/Linux\ncd ${electronDir}\nchmod +x run.sh 2>/dev/null || true\nbash run.sh\n`);
    }

    const hasBackendTauri = filesToZip.some(f => f.path.startsWith(`Backend/${cleanProjectName}/src-tauri`) || f.path.includes('tauri.conf.json'));
    const isTauriProj = localConfig.language === 'tauri' || localConfig.frontendFramework === 'tauri' || hasBackendTauri;
    if (isTauriProj) {
        const tauriDir = hasBackendTauri ? `Backend/${cleanProjectName}` : `TauriApp`;
        zip.file("run.bat", `@echo off\r\ncls\r\necho Starte DB Studio Pro Tauri Application...\r\ncd ${tauriDir}\r\ncall run.bat\r\n`);
        zip.file("run.sh", `#!/bin/bash\n# DB Studio Pro Tauri App Launcher for macOS/Linux\ncd ${tauriDir}\nchmod +x run.sh 2>/dev/null || true\nbash run.sh\n`);
    }

    filesToZip.forEach(file => zip.file(file.path, file.content));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(content);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    a.download = `${cleanProjectName}_FullStack_${timeStr}.zip`;
    
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleAiRefactor = async () => {
      if (!selectedFile || !aiPrompt) return;
      setIsAiProcessing(true);
      
      try {
          const response = await fetch(getApiUrl('/api/refactor'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  prompt: aiPrompt,
                  currentCode: selectedFile.content,
                  fileName: selectedFile.name,
                  language: selectedFile.language,
                  projectName: localConfig.projectName
              })
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Fehler bei der AI-Anfrage');
          }

          const data = await response.json();
          const cleanCode = data.code;

          const newFiles = generatedFiles.map(f => f.path === selectedFile.path ? { ...f, content: cleanCode } : f);
          setGeneratedFiles(newFiles);
          setSelectedFile({ ...selectedFile, content: cleanCode });
          setAiPrompt('');
          showMessage("AI Refactoring", "Code wurde erfolgreich aktualisiert.", 'success');
      } catch (error: any) {
          console.error("AI Error", error);
          showMessage("AI Fehler", error.message || "Fehler bei der AI-Anfrage.", 'error');
      }
      setIsAiProcessing(false);
  };

  return (
    <div className="flex h-full bg-slate-100">
      {/* File Explorer Sidebar */}
      <div className="w-72 flex flex-col border-r border-slate-300 bg-slate-50">
        <div className="p-3 border-b border-slate-200 bg-slate-100 font-bold text-xs text-slate-600 uppercase tracking-wider flex justify-between items-center">
            <span>Projekt Explorer</span>
            <div className="flex items-center gap-2">
                <button onClick={handleGenerate} className="p-1 hover:bg-slate-200 rounded text-slate-500" title="Neu generieren">
                    <RefreshCw size={12} />
                </button>
                <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">{generatedFiles.length} Dateien</span>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
            {fileTree.length > 0 ? (
                fileTree.map(node => (
                    <FileTreeItem 
                        key={node.path} 
                        node={node} 
                        level={0} 
                        selectedPath={selectedFile?.path}
                        onSelect={setSelectedFile}
                    />
                ))
            ) : (
                <div className="p-4 text-center text-slate-400 text-sm">
                    Keine Dateien generiert.
                </div>
            )}
        </div>
        
        {/* Operations Section */}
        <div className="p-3 border-t border-slate-200 bg-slate-100 space-y-2">
            <button 
                onClick={handleExportZip}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded shadow text-xs font-bold transition-colors cursor-pointer"
            >
                <Download size={14} /> Projekt als ZIP Herunterladen
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => setShowGitModal(true)}
                    className="flex items-center justify-center gap-1 bg-slate-800 text-white p-2 rounded shadow text-xs font-bold hover:bg-slate-900 cursor-pointer"
                >
                    <GitBranch size={14} className="text-orange-400"/> Push Git
                </button>
                {/* Fallback Deploy Button inside view, keeps context */}
                <button 
                    onClick={onOpenDeployment}
                    className="flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded shadow text-xs font-bold hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                >
                    <UploadCloud size={14} /> Deploy
                </button>
            </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <div className="h-9 border-b border-slate-200 bg-white flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
                <FileCode size={14} className="text-slate-400" />
                <span className="font-mono text-sm text-slate-700 font-medium">{selectedFile?.path}</span>
            </div>
            <button onClick={handleExportZip} className="text-slate-400 hover:text-blue-600 text-xs flex items-center gap-1">
                <Download size={14}/> Download
            </button>
        </div>
        
        <div className="flex-1 relative">
            {selectedFile ? (
                <div className="absolute inset-0 overflow-hidden">
                    <Editor
                        height="100%"
                        language={selectedFile.language}
                        value={selectedFile.content}
                        theme="vs-light"
                        options={{ 
                            minimap: { enabled: false }, 
                            fontSize: 13, 
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                        }}
                        onChange={(val) => {
                            if (val && selectedFile) {
                                const newFiles = generatedFiles.map(f => f.path === selectedFile.path ? { ...f, content: val } : f);
                                setGeneratedFiles(newFiles);
                                setSelectedFile({ ...selectedFile, content: val });
                            }
                        }}
                    />
                </div>
            ) : (
                <div className="flex h-full items-center justify-center flex-col text-slate-300 gap-2">
                    <FileCode size={48} className="opacity-20" />
                    <p>Wählen Sie eine Datei aus dem Explorer.</p>
                </div>
            )}
        </div>

        {/* AI Assistant Bar */}
        <div className="h-auto border-t border-slate-200 bg-slate-50 p-3">
            <div className="flex gap-2 items-center max-w-4xl mx-auto">
                <div className="p-1.5 bg-red-100 rounded text-red-600 shrink-0" title="AI Refactoring Deaktiviert">
                    <AlertCircle size={16} />
                </div>
                <input 
                    type="text" 
                    value={aiPrompt}
                    disabled={true}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="AI-Refactoring ist auf diesem System deaktiviert..."
                    className="flex-1 border border-slate-300 rounded p-1.5 text-sm bg-slate-100 text-slate-400 cursor-not-allowed outline-none"
                />
                <button 
                    disabled={true}
                    className="bg-slate-300 text-slate-400 px-4 py-1.5 rounded text-sm cursor-not-allowed font-medium"
                >
                    Ausführen
                </button>
            </div>
        </div>
      </div>

      {showGitModal && (
          <GitPushModal 
            files={generatedFiles} 
            onClose={() => setShowGitModal(false)}
            onSuccess={() => showMessage("Git Push Erfolgreich", "Code übertragen.", 'success')}
          />
      )}
    </div>
  );
};
