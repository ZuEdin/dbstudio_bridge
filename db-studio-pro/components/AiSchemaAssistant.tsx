import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Database, HelpCircle, Check, Loader2, Play, Table, Plus, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../stores/useProjectStore';
import { Table as ProjectTable, Field as ProjectField } from '../types/index';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  status?: 'thinking' | 'done';
  proposedSchema?: {
    name: string;
    description: string;
    tables: {
      name: string;
      description: string;
      fields: { name: string; type: string; isPk?: boolean; isFk?: boolean; ref?: string; nullable?: boolean }[];
    }[];
  };
}

export const AiSchemaAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hallo! Ich bin dein AI Schema Assistant. Ich kann dir dabei helfen, komplexe Datenbank-Schemata per natürlicher Sprache zu entwerfen. Probiere einen der Vorschläge aus oder schreibe mir deinen eigenen Wunsch!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState('');
  const [isApplied, setIsApplied] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const projectTables = useProjectStore(state => state.tables);
  const addTable = useProjectStore(state => state.addTable);
  const setRelationships = useProjectStore(state => state.setRelationships);
  const relationships = useProjectStore(state => state.relationships);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, thinkingStep]);

  const presetPrompts = [
    {
      label: 'E-Commerce Shop',
      prompt: 'Entwirfe ein Schema für einen E-Commerce Onlineshop mit Kunden, Bestellungen, Produkten und Bestellpositionen.'
    },
    {
      label: 'Hotelbuchung',
      prompt: 'Erstelle ein Hotelreservierungssystem mit Zimmern, Gästen, Buchungen und Rechnungen.'
    },
    {
      label: 'Ticket Support',
      prompt: 'Entwerfe ein Support-Ticket-System mit Kunden, Agenten, Tickets und Kommentaren.'
    }
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    // Dynamic thinking steps
    const steps = [
      '🔍 Analysiere Anforderungs-Prompt...',
      '📚 Identifiziere primäre Entitäten und Attribute...',
      '🔗 Definiere Fremdschlüssel & referenzielle Integrität...',
      '⚡ Optimiere Datentypen (Indexes, PKs)...',
      '✨ Generiere interaktiven Schema-Entwurf...'
    ];

    for (const step of steps) {
      setThinkingStep(step);
      await new Promise(r => setTimeout(r, 600));
    }

    setIsThinking(false);

    // Determine mock response schema depending on user query keyword
    let schemaName = 'Custom Schema';
    let description = 'Individuell generiertes Datenbankschema';
    let tablesData: any[] = [];

    const lowerText = text.toLowerCase();
    if (lowerText.includes('shop') || lowerText.includes('commerce') || lowerText.includes('bestellung') || lowerText.includes('produkt')) {
      schemaName = 'E-Commerce Store';
      description = 'Robustes Schema für Bestellungsabwicklungen und Produktkataloge.';
      tablesData = [
        {
          name: 'ShopCustomers',
          description: 'Speichert Kundeninformationen',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'Email', type: 'VARCHAR', nullable: false },
            { name: 'FullName', type: 'VARCHAR' },
            { name: 'CreatedAt', type: 'TIMESTAMP' }
          ]
        },
        {
          name: 'ShopProducts',
          description: 'Produktkatalog mit Preisen',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'SKU', type: 'VARCHAR', nullable: false },
            { name: 'Title', type: 'VARCHAR' },
            { name: 'UnitPrice', type: 'DECIMAL' }
          ]
        },
        {
          name: 'ShopOrders',
          description: 'Bestellungs-Kopfdaten',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'OrderDate', type: 'DATETIME' },
            { name: 'CustomerId', type: 'INTEGER', isFk: true, ref: 'ShopCustomers.Id' },
            { name: 'TotalAmount', type: 'DECIMAL' }
          ]
        },
        {
          name: 'ShopOrderItems',
          description: 'Einzelpositionen pro Bestellung',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'OrderId', type: 'INTEGER', isFk: true, ref: 'ShopOrders.Id' },
            { name: 'ProductId', type: 'INTEGER', isFk: true, ref: 'ShopProducts.Id' },
            { name: 'Quantity', type: 'INTEGER' }
          ]
        }
      ];
    } else if (lowerText.includes('hotel') || lowerText.includes('buchung') || lowerText.includes('zimmer')) {
      schemaName = 'Hotel Booking Suite';
      description = 'Schema zur Verwaltung von Hotelzimmern, Belegungen und Kundenrechnungen.';
      tablesData = [
        {
          name: 'HotelRooms',
          description: 'Verfügbare Hotelzimmer',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'RoomNumber', type: 'VARCHAR' },
            { name: 'RoomType', type: 'VARCHAR' },
            { name: 'PricePerNight', type: 'DECIMAL' }
          ]
        },
        {
          name: 'HotelGuests',
          description: 'Gästestammdaten',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'FirstName', type: 'VARCHAR' },
            { name: 'LastName', type: 'VARCHAR' },
            { name: 'PassportNumber', type: 'VARCHAR' }
          ]
        },
        {
          name: 'HotelReservations',
          description: 'Zimmerbuchungen',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'RoomId', type: 'INTEGER', isFk: true, ref: 'HotelRooms.Id' },
            { name: 'GuestId', type: 'INTEGER', isFk: true, ref: 'HotelGuests.Id' },
            { name: 'CheckInDate', type: 'DATE' },
            { name: 'CheckOutDate', type: 'DATE' }
          ]
        }
      ];
    } else {
      // Default / general ticket system
      schemaName = 'Support Desk Schema';
      description = 'Verwaltung von Support-Tickets, Service-Mitarbeitern und Kundenanfragen.';
      tablesData = [
        {
          name: 'TicketClients',
          description: 'Kunden, die Support-Anfragen stellen',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'CompanyName', type: 'VARCHAR' },
            { name: 'ContactPerson', type: 'VARCHAR' },
            { name: 'SupportPlan', type: 'VARCHAR' }
          ]
        },
        {
          name: 'SupportTickets',
          description: 'Eingegangene Support-Vorgänge',
          fields: [
            { name: 'Id', type: 'INTEGER', isPk: true },
            { name: 'ClientId', type: 'INTEGER', isFk: true, ref: 'TicketClients.Id' },
            { name: 'Subject', type: 'VARCHAR' },
            { name: 'Status', type: 'VARCHAR' },
            { name: 'Priority', type: 'VARCHAR' }
          ]
        }
      ];
    }

    const aiMsg: Message = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: `Ich habe einen Schema-Entwurf für **"${schemaName}"** generiert. Du kannst die Tabellen direkt in dein Projekt-Modell übernehmen.`,
      timestamp: new Date(),
      status: 'done',
      proposedSchema: {
        name: schemaName,
        description,
        tables: tablesData
      }
    };

    setMessages(prev => [...prev, aiMsg]);
  };

  const handleApplyProposedSchema = (msgId: string, schema: NonNullable<Message['proposedSchema']>) => {
    // Inject designed tables into the actual React Project store!
    schema.tables.forEach((t, index) => {
      const newFields: ProjectField[] = t.fields.map((f, fIdx) => ({
        id: `f_ai_${msgId}_${t.name}_${f.name}`,
        name: f.name,
        type: f.type as any,
        isPrimaryKey: !!f.isPk,
        isAutoIncrement: f.type === 'INTEGER' && !!f.isPk,
        allowNull: !f.isPk && f.nullable !== false
      }));

      const newTable: ProjectTable = {
        id: `t_ai_${msgId}_${t.name}`,
        name: t.name,
        fields: newFields,
        description: t.description,
        data: []
      };

      addTable(newTable);
    });

    setIsApplied(msgId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-xl p-3 shadow-sm text-xs leading-relaxed ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-750 rounded-bl-none'
              }`}>
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-1.5 border-b border-slate-100 dark:border-slate-700/60 pb-1">
                    <Sparkles size={11} className="text-indigo-500 animate-pulse" />
                    <span>AI Schema Copilot</span>
                  </div>
                )}
                
                <div>{msg.text}</div>

                {/* Proposed Schema Render */}
                {msg.proposedSchema && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Database size={12} className="text-indigo-500" />
                          <span>{msg.proposedSchema.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{msg.proposedSchema.description}</p>
                      </div>
                      
                      {isApplied === msg.id ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-200/50">
                          <Check size={11} strokeWidth={3} /> Importiert
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyProposedSchema(msg.id, msg.proposedSchema!)}
                          className="flex items-center gap-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-extrabold shadow transition shrink-0"
                        >
                          <Plus size={11} strokeWidth={2.5} /> Schema anlegen
                        </button>
                      )}
                    </div>

                    {/* Proposed Tables */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {msg.proposedSchema.tables.map((tbl, tIdx) => (
                        <div key={tIdx} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                          <div className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Table size={10} className="text-slate-400" />
                            <span>{tbl.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tbl.fields.map((fld, fIdx) => (
                              <span 
                                key={fIdx} 
                                className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                                  fld.isPk 
                                    ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200/50 font-bold' 
                                    : fld.isFk 
                                      ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200/50' 
                                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                                }`}
                                title={fld.isPk ? 'Primary Key' : fld.isFk ? `Foreign Key -> ${fld.ref}` : 'Spalte'}
                              >
                                {fld.name} ({fld.type})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[9px] mt-1.5 text-right ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}

        {/* Thinking State */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-750 rounded-xl rounded-bl-none p-3 shadow-sm text-xs flex items-center gap-2 max-w-[85%]">
              <Loader2 size={13} className="text-indigo-500 animate-spin" />
              <span className="font-mono text-slate-500 dark:text-slate-400">{thinkingStep}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Warning banner indicating AI is disabled */}
      <div className="mx-3 my-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-xs text-red-700 dark:text-red-400 font-medium flex items-start gap-2">
        <AlertCircle size={15} className="shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Systemhinweis:</span> AI / KI-Funktionen wurden auf Wunsch des Administrators vollständig deaktiviert.
        </div>
      </div>

      {/* Preset prompt buttons */}
      {messages.length === 1 && !isThinking && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-40 cursor-not-allowed">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Vorschläge (Deaktiviert):</div>
          <div className="flex flex-col gap-1.5">
            {presetPrompts.map((p, idx) => (
              <button
                key={idx}
                disabled={true}
                className="w-full text-left bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-between cursor-not-allowed"
              >
                <span>{p.label}</span>
                <Sparkles size={11} className="text-slate-300 dark:text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); }} 
        className="p-2.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
      >
        <input 
          type="text" 
          value={inputText}
          disabled={true}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Eigene Idee beschreiben (KI Deaktiviert)..."
          className="flex-1 border border-slate-300 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500 cursor-not-allowed outline-none"
        />
        <button 
          type="button" 
          disabled={true}
          className="bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center cursor-not-allowed transition shadow-sm shrink-0"
        >
          <Send size={13} className="ml-0.5" />
        </button>
      </form>

    </div>
  );
};
