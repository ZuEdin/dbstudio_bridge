
import React, { useState, useEffect, useRef } from 'react';
import { Chat, ChatMessage } from '../types/index';
import { MessageSquare, Users, X, Send, ChevronLeft, MoreVertical, Circle, ClipboardList, Sparkles, LogOut, Settings, LogIn } from 'lucide-react';
import { useTicketState } from '../hooks/useTicketState';
import { TicketBoard } from './TicketBoard';
import { AiSchemaAssistant } from './AiSchemaAssistant';
import { LoginPrompt } from './auth/LoginPrompt';
import { ToolSettings } from './settings/ToolSettings';
import { useAuthStore } from '../stores/useAuthStore';
import { useConfigStore } from '../stores/useConfigStore';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string | null) => void;
  onSendMessage: (chatId: string, text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, onClose, chats, activeChatId, onSelectChat, onSendMessage 
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);
  const { user, logout, isAdmin } = useAuthStore();
  const { config } = useConfigStore();

  const ticketState = useTicketState();
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'ai_assistant' | 'settings'>('chat');

  useEffect(() => {
    if (activeChatId) {
        setActiveTab('chat');
        scrollToBottom();
    }
  }, [activeChatId, activeChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!inputText.trim() || !activeChatId) return;
      onSendMessage(activeChatId, inputText);
      setInputText('');
  };

  if (!isOpen) return null;

  // If NOT authenticated, show ONLY login
  if (!user?.isAuthenticated) {
    return (
      <div className="flex flex-col fixed bottom-6 right-6 w-80 h-[540px] bg-white border border-slate-300 shadow-2xl z-[9999] rounded-xl overflow-hidden shadow-black/20 transition-all duration-300">
         <div className="bg-slate-800 text-white p-3 flex justify-between items-center shrink-0 h-10">
            <div className="flex items-center gap-2">
                <LogIn size={18}/>
                <span className="font-bold text-sm">System Login</span>
            </div>
            <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded text-slate-300 hover:text-white">
                <X size={18}/>
            </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <LoginPrompt />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col fixed bottom-6 right-6 ${
      activeTab === 'chat' 
        ? 'w-80' 
        : activeTab === 'ai_assistant' 
          ? 'w-[360px] md:w-[410px]' 
          : activeTab === 'settings'
            ? 'w-[420px]'
            : 'w-[640px] md:w-[720px]'
    } h-[540px] bg-white border border-slate-300 shadow-2xl z-[9999] rounded-xl overflow-hidden shadow-black/20 transition-all duration-300`}>
        
        {/* Header */}
        <div className="bg-slate-800 text-white p-3 flex justify-between items-center shrink-0 h-10">
            <div className="flex items-center gap-2 min-w-0">
                {activeChatId ? (
                    <button onClick={() => onSelectChat(null)} className="hover:bg-slate-700 p-1 rounded">
                        <ChevronLeft size={18}/>
                    </button>
                ) : (
                    activeTab === 'chat' ? <MessageSquare size={18}/> : activeTab === 'tickets' ? <ClipboardList size={18}/> : activeTab === 'settings' ? <Settings size={18}/> : <Sparkles size={18} className="text-indigo-400 animate-pulse"/>
                )}
                <span className="font-bold text-sm truncate">
                    {activeChat ? activeChat.name : (activeTab === 'chat' ? 'Team Chat' : activeTab === 'tickets' ? 'Projekt-Tickets & Todos' : activeTab === 'settings' ? 'System Settings' : 'AI Schema Assistant')}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={logout} title="Logout" className="hover:bg-red-900/40 p-1 rounded text-red-400 hover:text-red-200">
                    <LogOut size={16}/>
                </button>
                <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded text-slate-300 hover:text-white">
                    <X size={18}/>
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {!activeChatId && (() => {
                const totalUnreadChatCount = chats ? chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0;
                const todoTicketsCount = ticketState.allTicketsRaw ? ticketState.allTicketsRaw.filter(t => t.status === 'todo').length : 0;
                return (
                    <div className="flex bg-slate-100 border-b border-slate-200 shrink-0 p-1">
                        <button 
                            type="button"
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <MessageSquare size={12} />
                            <span>Chat</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('ai_assistant')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'ai_assistant' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <Sparkles size={12} className="text-indigo-500" />
                            <span>AI</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setActiveTab('tickets')}
                            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'tickets' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <ClipboardList size={12} />
                            <span>Tickets</span>
                        </button>
                        {isAdmin() && (
                            <button 
                                type="button"
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTab === 'settings' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                <Settings size={12} />
                                <span>Settings</span>
                            </button>
                        )}
                    </div>
                );
            })()}

            {activeTab === 'settings' ? (
                <ToolSettings />
            ) : activeTab === 'tickets' ? (
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
            ) : activeTab === 'ai_assistant' ? (
                <AiSchemaAssistant />
            ) : !activeChatId ? (
                // Chat List
                <div className="flex-1 overflow-y-auto">
                    {config.mode === 'DEMO' && (
                        <div className="mx-4 my-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                            <div className="font-bold flex items-center gap-1 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                Simulations-Modus (Lokal)
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                Das Enterprise-Backend ist offline. Chats und Team-Ereignisse werden lokal simuliert.
                            </p>
                        </div>
                    )}

                    {/* Groups Section */}
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Gruppen</div>
                    {chats.filter(c => c.type === 'group').map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => onSelectChat(chat.id)}
                            className="px-4 py-3 hover:bg-white border-b border-slate-100 cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-semibold text-sm text-slate-800 truncate">{chat.name}</span>
                                    {chat.unreadCount ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span> : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Keine Nachrichten'}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Direct Messages Section */}
                    <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase mt-2">Direktnachrichten</div>
                    {chats.filter(c => c.type === 'private').map(chat => (
                        <div 
                            key={chat.id} 
                            onClick={() => onSelectChat(chat.id)}
                            className="px-4 py-3 hover:bg-white border-b border-slate-100 cursor-pointer flex items-center gap-3 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 relative">
                                {chat.name.substring(0, 2).toUpperCase()}
                                {chat.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-50 rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-semibold text-sm text-slate-800 truncate">{chat.name}</span>
                                    {chat.unreadCount ? <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{chat.unreadCount}</span> : null}
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                    {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'Starten Sie eine Unterhaltung'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Active Conversation
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeChat?.messages.map((msg) => {
                            const isMe = msg.senderId === user?.id || msg.senderId === 'u1';
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 shadow-sm text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}`}>
                                        {!isMe && activeChat.type === 'group' && (
                                            <div className="text-[10px] font-bold text-slate-500 mb-1">{msg.senderName}</div>
                                        )}
                                        <div>{msg.text}</div>
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Nachricht schreiben..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!inputText.trim()}
                            className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            <Send size={16} className="ml-0.5"/>
                        </button>
                    </form>
                </>
            )}
        </div>
    </div>
  );
};
