
import React, { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import { CollaborationBar } from './CollaborationBar';
import { cloudService } from '../services/cloudService';
import { Cloud, GitBranch, MessageSquare, Sun, Moon, Download, Edit2, User, Settings, Shield, ChevronDown, LogOut, Sparkles } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { useUIStore } from '../stores/useUIStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useConfigStore } from '../stores/useConfigStore';
import { Chat } from '../types/index';
import { useTicketState } from '../hooks/useTicketState';

interface AppHeaderProps {
  onAction?: (action: string, payload?: any) => void;
  chats?: Chat[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onAction, chats }) => {
  const { t } = useTranslation();
  const store = useProjectStore();
  const ui = useUIStore();
  const ticketState = useTicketState();
  const { user, whoamiData, logout, isAdmin } = useAuthStore();
  const { config } = useConfigStore();
  
  const totalUnreadChatCount = chats ? chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0;
  const todoTicketsCount = ticketState.allTicketsRaw ? ticketState.allTicketsRaw.filter(t => t.status === 'todo').length : 0;
  const totalUnread = totalUnreadChatCount + todoTicketsCount;
  
  const { projectName, backendConfig } = store;
  const { darkMode, toggleDarkMode, isChatOpen, setIsChatOpen, setFormActionTrigger } = ui;

  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Mock Data: In a real app, this would come from a Context/Store connected to Websockets
  const collaborators = cloudService.getCollaborators(store.projectId || 'main', user);

  const onExport = () => {
      if (onAction) {
          onAction('project_backup');
      } else {
          setFormActionTrigger({ action: 'backend_export', timestamp: Date.now() });
      }
  };

  const onOpenSettings = () => {
    setIsChatOpen(true);
    // The ChatPanel will handle switching to settings tab if user is admin
  };

  return (
    <div className="bg-slate-800 text-white text-xs px-2 py-1 flex justify-between items-center select-none shrink-0 print:hidden h-10 border-b border-slate-700">
        <div className="flex items-center gap-4">
            <span className="font-bold flex items-center gap-2">
                <Cloud size={14} className="text-blue-400 font-bold shrink-0" />
                <span>{t('app.name')}</span>
                <span className="opacity-50">/</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={e => setTempName(e.target.value)}
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        if (tempName.trim() && tempName !== projectName) {
                          await store.renameProject(tempName);
                        }
                        setIsEditing(false);
                      } else if (e.key === 'Escape') {
                        setIsEditing(false);
                      }
                    }}
                    onBlur={async () => {
                      if (tempName.trim() && tempName !== projectName) {
                        await store.renameProject(tempName);
                      }
                      setIsEditing(false);
                    }}
                    className="bg-slate-700 text-white font-semibold px-2 py-0.5 rounded outline-none border border-blue-500 text-xs w-40"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="hover:bg-slate-700/50 px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 group transition-colors"
                    onDoubleClick={() => {
                      setTempName(projectName);
                      setIsEditing(true);
                    }}
                    title="Doppelklick zum Umbenennen"
                  >
                    {projectName}
                    <Edit2 size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>
                )}
            </span>
            
            {/* Status Pills */}
            <div className="flex items-center gap-2">
                <div className="bg-slate-700 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-slate-600/50">
                    <GitBranch size={10} className="text-green-400"/>
                    <span className="text-slate-300">main</span>
                </div>
                
                {config.mode === 'DEMO' ? (
                  <div className="bg-amber-900/30 text-amber-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-amber-500/30">
                      <span>DEMO</span>
                  </div>
                ) : (
                  <div className="bg-blue-900/30 text-blue-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-blue-500/30">
                      <span>REGISTERED</span>
                  </div>
                )}

                {config.storage === 'server' && (
                  <div className="bg-emerald-900/30 text-emerald-400 rounded px-2 py-0.5 flex items-center gap-1 text-[9px] font-bold border border-emerald-500/30">
                      <span>REMOTE-DB</span>
                  </div>
                )}
            </div>
        </div>

        {/* AI Copilot Quick Trigger Bar (Disabled input for security + preset modal trigger) */}
        <div 
          onClick={() => {
            ui.setAiCopilotTab('schema');
            ui.setShowAiCopilotModal(true);
          }}
          className="hidden md:flex items-center gap-2 bg-slate-900/70 hover:bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 px-3 py-1 rounded-full cursor-pointer transition-all shadow-inner group max-w-sm"
          title="AI Schema- & Query-Copilot öffnen (Vorbereitet)"
        >
          <Sparkles size={13} className="text-indigo-400 group-hover:text-indigo-300 animate-pulse shrink-0" />
          <input 
            type="text" 
            disabled 
            readOnly
            placeholder="✨ AI Copilot: Frage oder Schema... (Vorbereitet)" 
            className="bg-transparent text-[11px] text-slate-300 placeholder-slate-400 w-52 outline-none cursor-pointer select-none"
          />
          <span className="text-[8px] uppercase tracking-wider bg-indigo-950/90 text-indigo-300 font-extrabold px-1.5 py-0.5 rounded border border-indigo-500/30 whitespace-nowrap">
            Vorbereitet
          </span>
        </div>

        <div className="flex items-center">
            {/* User Profile */}
            <div className="relative mr-2">
                {user?.isAuthenticated ? (
                   <div className="flex items-center gap-1">
                     <button 
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-2.5 px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 transition-colors text-left"
                     >
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {(user.displayName || user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col justify-center leading-none max-w-[150px]">
                            <span className="text-slate-200 font-bold text-[10px] truncate flex items-center gap-1">
                              {user.displayName || user.name}
                              {user.isAdUser && (
                                <span className="text-[8px] bg-blue-900/60 text-blue-300 font-bold px-1 rounded border border-blue-500/30">
                                  AD
                                </span>
                              )}
                            </span>
                            <span className="text-slate-400 text-[9px] truncate mt-0.5">{user.email || user.role}</span>
                        </div>
                        {isAdmin() && <span title="Administrator"><Shield size={10} className="text-amber-400 shrink-0" /></span>}
                        <ChevronDown size={11} className={`text-slate-400 transition-transform shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
                     </button>
                     
                     {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                              <div className="px-3 py-2 border-b border-slate-700">
                                  <div className="font-bold text-white truncate">{user.displayName || user.name}</div>
                                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                                  
                                  {/* User Roles */}
                                  <div className="mt-2 space-y-1">
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Rollen / Userlevels</div>
                                    <div className="flex flex-wrap gap-1">
                                      {(user.roles || [user.role]).map((r, idx) => (
                                        <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30 font-semibold">
                                          {r}
                                        </span>
                                      ))}
                                    </div>
                                    {user.userLevels && user.userLevels.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {user.userLevels.map((lvl, idx) => (
                                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 font-medium">
                                            {lvl}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                              </div>
                              <button 
                                  onClick={() => {
                                      setUserMenuOpen(false);
                                      logout();
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left font-semibold"
                              >
                                  <LogOut size={14} />
                                  <span>{t('auth.logout')}</span>
                              </button>
                          </div>
                        </>
                     )}
                   </div>
                ) : (
                   (() => {
                     const uname = whoamiData?.displayName || whoamiData?.username || user?.displayName || user?.name;
                     return uname ? (
                       <div 
                         className="flex items-center gap-1.5 text-blue-300 font-bold bg-slate-700/40 border border-blue-500/30 px-3 py-1 rounded-full cursor-default select-none text-xs"
                         title={uname}
                       >
                         <User size={14} className="text-blue-400" />
                         <span>{uname}</span>
                       </div>
                     ) : (
                       <button 
                         onClick={() => setIsChatOpen(true)}
                         className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold bg-slate-700/30 hover:bg-slate-700/50 border border-blue-500/20 px-3 py-1 rounded-full transition-all"
                       >
                         <User size={14} />
                         <span>Anmelden</span>
                       </button>
                     );
                   })()
                )}
            </div>

            {user?.isAuthenticated && <CollaborationBar collaborators={collaborators} />}
            
            {/* Chat & Tickets Toggle */}
            {user?.isAuthenticated && (
                <div className="ml-2 mr-1 relative">
                    <button 
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className={`p-1.5 rounded transition-colors flex items-center gap-1.5 relative ${isChatOpen ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        title="Team Chat & Tickets / Aufgaben"
                    >
                        <div className="relative">
                            <MessageSquare size={16} />
                            {totalUnread > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-slate-800">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-bold">Chat & Tickets</span>
                    </button>
                </div>
            )}

            {/* Admin Settings Cog */}
            {isAdmin() && (
              <div className="mr-1">
                <button 
                    onClick={onOpenSettings}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title="System-Einstellungen"
                >
                    <Settings size={16} />
                </button>
              </div>
            )}

            {/* Dark / Light Mode Toggle */}
            <div className="mr-2">
                <button 
                    onClick={toggleDarkMode}
                    className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} />}
                </button>
            </div>

            <div className="h-4 w-px bg-slate-600 mx-1"></div>
            <LanguageSelector />
            <div className="h-4 w-px bg-slate-600 mx-2"></div>
            <button 
                onClick={onExport} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-700/50 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/30 hover:border-blue-400/50 font-semibold"
            >
                <Download size={14} />
                {t('app.save_backup')}
            </button>
        </div>
    </div>
  );
};
