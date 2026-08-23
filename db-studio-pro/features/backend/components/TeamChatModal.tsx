import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Send, User, RefreshCw, MessageSquare, Wifi, CheckCircle2, 
  Users, Lock, Plus, Hash, ShieldCheck, Search
} from 'lucide-react';
import { getApiUrl, useConfigStore } from '../../../stores/useConfigStore';
import { useAuthStore } from '../../../stores/useAuthStore';

interface ChatMessage {
  id: string;
  chatId?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'team' | 'direct';
  description?: string;
  recipientName?: string;
  avatarColor?: string;
}

interface TeamChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CHANNELS: ChatChannel[] = [
  { id: 'default_chat', name: 'Allgemein & Team', type: 'team', description: 'Öffentlicher Entwickler-Kanal für das gesamte Team' },
  { id: 'schema_updates', name: 'Schema & Releases', type: 'team', description: 'Automatische Benachrichtigungen über Datenbank-Updates' },
  { id: 'dm_sarah', name: 'Sarah Jenkins', type: 'direct', recipientName: 'Sarah Jenkins', avatarColor: 'bg-emerald-500' },
  { id: 'dm_tom', name: 'Tom Miller', type: 'direct', recipientName: 'Tom Miller', avatarColor: 'bg-amber-500' },
  { id: 'dm_weber', name: 'Dr. Weber', type: 'direct', recipientName: 'Dr. Weber', avatarColor: 'bg-blue-500' },
];

export const TeamChatModal: React.FC<TeamChatModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { config } = useConfigStore();
  
  const [channels, setChannels] = useState<ChatChannel[]>(DEFAULT_CHANNELS);
  const [activeChatId, setActiveChatId] = useState<string>('default_chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState(user?.name || 'Zubovic.Edin');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // New Direct Chat input state
  const [showNewDmModal, setShowNewDmModal] = useState(false);
  const [newDmName, setNewDmName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.name) {
      setSenderName(user.name);
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const primaryUrl = getApiUrl('/api/chat/messages');
      const res = await fetch(primaryUrl, { credentials: 'include' }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
      }
    } catch (err) {
      console.warn('Could not fetch chat messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  const activeChannel = channels.find(c => c.id === activeChatId) || channels[0];

  // Filter messages relevant to active chat
  const activeMessages = messages.filter(m => {
    const msgChatId = m.chatId || 'default_chat';
    return msgChatId === activeChatId;
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const newMsg: ChatMessage = {
      id: crypto.randomUUID().substring(0, 8),
      chatId: activeChatId,
      senderId: user?.id || 'u1',
      senderName: senderName || 'Entwickler',
      text: inputText.trim(),
      timestamp: Date.now()
    };

    try {
      setSending(true);
      setMessages(prev => [...prev, newMsg]);
      setInputText('');

      const primaryUrl = getApiUrl('/api/chat/messages');
      await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMsg)
      }).catch(() => null);

      fetchMessages();
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateNewDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDmName.trim()) return;

    const dmId = `dm_${newDmName.toLowerCase().replace(/\s+/g, '_')}`;
    const newChan: ChatChannel = {
      id: dmId,
      name: newDmName.trim(),
      type: 'direct',
      recipientName: newDmName.trim(),
      avatarColor: 'bg-indigo-500'
    };

    if (!channels.some(c => c.id === dmId)) {
      setChannels(prev => [...prev, newChan]);
    }
    setActiveChatId(dmId);
    setNewDmName('');
    setShowNewDmModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[680px] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Team Chat & Kommunikation</h3>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  <Wifi size={10} className="animate-pulse" />
                  {config?.apiUrl ? `.NET 10 (${config.apiUrl})` : 'Self-Host API'}
                </span>
              </div>
              <p className="text-xs text-slate-400">SignalR & REST-API Live-Schnittstelle mit Kanälen & Einzelchats</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchMessages}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sender Config Bar */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <span className="font-medium">Ihr Absender-Name:</span>
            <input 
              type="text" 
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Name..."
            />
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-500" />
            <span>Endpoint: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-700">/api/chat/messages</code></span>
          </div>
        </div>

        {/* Content Body: Sidebar + Main Chat */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR: Channels & Direct Messages List */}
          <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
            
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chat Übersicht</span>
              <button
                onClick={() => setShowNewDmModal(true)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
                title="Neuen Einzelchat starten"
              >
                <Plus size={14} />
                <span>1:1 Chat</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              
              {/* Category 1: TEAM CHATS */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={12} />
                  <span>Team-Kanäle (Gruppe)</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {channels.filter(c => c.type === 'team').map(chan => {
                    const isActive = chan.id === activeChatId;
                    const unreadCount = messages.filter(m => (m.chatId || 'default_chat') === chan.id).length;

                    return (
                      <button
                        key={chan.id}
                        onClick={() => setActiveChatId(chan.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-indigo-600 text-white font-bold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Hash size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                          <span className="truncate">{chan.name}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          TEAM
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: EINZELCHATS (DIRECT MESSAGES) */}
              <div>
                <div className="px-2 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={12} />
                  <span>Einzelchats (1:1 Direkt)</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {channels.filter(c => c.type === 'direct').map(chan => {
                    const isActive = chan.id === activeChatId;

                    return (
                      <button
                        key={chan.id}
                        onClick={() => setActiveChatId(chan.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isActive 
                            ? 'bg-amber-600 text-white font-bold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`w-2 h-2 rounded-full ${chan.avatarColor || 'bg-amber-400'}`} />
                          <span className="truncate">{chan.name}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isActive ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-amber-300 border border-amber-800/40'
                        }`}>
                          1:1
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sidebar Footer Info */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>Team & 1:1 Chats werden per ID getrennt.</span>
            </div>

          </div>

          {/* MAIN CHAT AREA */}
          <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
            
            {/* Active Chat Header */}
            <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-2.5">
                {activeChannel.type === 'team' ? (
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Users size={18} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Lock size={18} />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{activeChannel.name}</h4>
                    {activeChannel.type === 'team' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        👥 Team-Chat (Öffentlich)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        🔒 Einzelchat / Direktnachricht (1:1)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {activeChannel.type === 'team' 
                      ? (activeChannel.description || 'Sichtbar für alle Mitglieder der Entwickler-Gruppe') 
                      : `Vertraulicher Chat-Verlauf direkt mit ${activeChannel.recipientName}`}
                  </p>
                </div>
              </div>

              <div className="text-right text-xs text-slate-400">
                <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                  Chat-ID: {activeChannel.id}
                </span>
              </div>
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <MessageSquare size={36} className="text-slate-300" />
                  <p className="text-sm font-medium">Noch keine Nachrichten in "{activeChannel.name}".</p>
                  <p className="text-xs text-slate-400">
                    {activeChannel.type === 'team' 
                      ? 'Starten Sie die Unterhaltung mit dem gesamten Team!' 
                      : `Senden Sie eine vertrauliche Direktnachricht an ${activeChannel.recipientName}.`}
                  </p>
                </div>
              ) : (
                activeMessages.map((msg, index) => {
                  const isMe = msg.senderName === senderName || msg.senderId === user?.id;
                  const formattedTime = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <div 
                      key={msg.id || index}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-700">{msg.senderName || 'Mitglied'}</span>
                        
                        {/* Distinct badge inside message header */}
                        {activeChannel.type === 'team' ? (
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                            Team
                          </span>
                        ) : (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.2 rounded border border-amber-200">
                            Direkt
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400">{formattedTime}</span>
                      </div>

                      <div 
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                          isMe 
                            ? activeChannel.type === 'team' 
                              ? 'bg-indigo-600 text-white rounded-br-xs' 
                              : 'bg-amber-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <input 
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={activeChannel.type === 'team' 
                  ? `Nachricht an Team-Kanal #${activeChannel.name}...` 
                  : `Direktnachricht an ${activeChannel.recipientName}...`}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50 ${
                  activeChannel.type === 'team' 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Send size={16} />
                <span>Senden</span>
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* MODAL TO START A NEW 1:1 EINZELCHAT */}
      {showNewDmModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User className="text-amber-600" size={18} />
              Neuen Einzelchat starten
            </h4>
            <p className="text-xs text-slate-500 mb-4">Geben Sie den Namen oder die E-Mail des gewünschten Teammitglieds ein.</p>
            
            <form onSubmit={handleCreateNewDm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Name des Empfängers</label>
                <input 
                  type="text"
                  value={newDmName}
                  onChange={e => setNewDmName(e.target.value)}
                  placeholder="z.B. Alex Lindner"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDmModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={!newDmName.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 shadow-sm"
                >
                  Einzelchat Öffnen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
