import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Settings, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Terminal, 
  Sparkles, 
  Send, 
  Play, 
  CheckCircle2, 
  Radio, 
  Activity, 
  AlertCircle,
  HelpCircle,
  KeyRound
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  status: 'IDLE' | 'ANALYZING' | 'GENERATING' | 'DONE';
  description: string;
  systemPrompt: string;
  currentTask: string;
}

export const AiSwarmDashboard: React.FC = () => {
  const [targetSchema, setTargetSchema] = useState('Entwerfe ein Autovermietung-SaaS mit Kunden, Verträgen, Fahrzeugen und Zahlungsverfolgung.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState('architect');
  const [apiKeyDefined, setApiKeyDefined] = useState(false);
  const [modelName, setModelName] = useState('gemini-2.5-pro');
  const [customTemperature, setCustomTemperature] = useState(0.2);

  // Simulated Swarm Logs
  const [logs, setLogs] = useState<string[]>([
    '[System] Swarm-Engine initialisiert. Verbindung bereit (Verbindung offen gelassen).',
    '[System] Wählen Sie ein Szenario und starten Sie die Design-Simulation...'
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'architect',
      name: 'Architect Agent',
      role: 'Datenbank-Strukturen & Relationen',
      icon: <Cpu className="text-blue-500" size={18} />,
      color: 'text-blue-500',
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/10',
      status: 'IDLE',
      description: 'Entwirft relationale Tabellen, Normalisierungsgrade, Feld-Datentypen und logische Primärschlüssel.',
      systemPrompt: 'Du bist der Lead-Architekt. Analysiere Benutzeranforderungen und zerlege sie in eine wohldefinierte relationale relationale Struktur.',
      currentTask: 'Wartet auf Eingabe...'
    },
    {
      id: 'validator',
      name: 'Schema Validator',
      role: 'AST-Kompilierung & FK-Beziehungen',
      icon: <CheckCircle2 className="text-emerald-500" size={18} />,
      color: 'text-emerald-500',
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10',
      status: 'IDLE',
      description: 'Überprüft, ob Fremdschlüssel-Beziehungen kreisfrei sind und kompilierte AST-Strukturen fehlerfrei generiert werden können.',
      systemPrompt: 'Du bist der Schema-Validator. Validiere die generierten Schemata auf Referenzintegrität und Datentyp-Kompatibilität.',
      currentTask: 'Wartet auf Entwurf...'
    },
    {
      id: 'perf_optimizer',
      name: 'Performance Agent',
      role: 'Indizes & Abfrage-Optimierung',
      icon: <Zap className="text-amber-500" size={18} />,
      color: 'text-amber-500',
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/10',
      status: 'IDLE',
      description: 'Analysiert das Schema auf potenzielle N+1-Query-Probleme, empfiehlt Indizes und schlägt Fremdschlüssel-Szenarien vor.',
      systemPrompt: 'Du bist der Performance-Spezialist. Optimiere Schemata für hohe Lese-/Schreibgeschwindigkeiten und erstelle Index-Empfehlungen.',
      currentTask: 'Wartet auf Validierung...'
    },
    {
      id: 'security',
      name: 'Security & PII Auditor',
      role: 'Datenschutz & DSGVO-Prüfung',
      icon: <ShieldAlert className="text-rose-500" size={18} />,
      color: 'text-rose-500',
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/10',
      status: 'IDLE',
      description: 'Prüft, ob sensible Daten (Passwörter, Adressen, Bankdaten) korrekt verschlüsselt oder separiert gespeichert werden.',
      systemPrompt: 'Du bist der Security-Auditor. Kennzeichne PII (Personally Identifiable Information) und stelle die DSGVO-Konformität sicher.',
      currentTask: 'Wartet auf Performance-Check...'
    }
  ]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Run visual multi-agent simulation step by step
  const handleStartSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCurrentStep(1);
    setLogs([]);
    addLog(`[System] Swarm gestartet für Prompt: "${targetSchema}"`);

    // Reset Agent States
    setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE', currentTask: 'Wartet auf Zuweisung...' })));
  };

  useEffect(() => {
    if (!isSimulating) return;

    let timer: NodeJS.Timeout;

    if (currentStep === 1) {
      setAgents(prev => prev.map(a => a.id === 'architect' ? { ...a, status: 'ANALYZING', currentTask: 'Analysiere Anforderungen & entwerfe Tabellen-Nodes...' } : a));
      addLog('🤖 [Architect Agent] Analysiere Benutzeranforderung...');
      timer = setTimeout(() => {
        addLog('🤖 [Architect Agent] Logisches Modell erstellt: Tabellen "Kunde", "Fahrzeug", "Vertrag" und "Zahlung".');
        setAgents(prev => prev.map(a => a.id === 'architect' ? { ...a, status: 'DONE', currentTask: 'Modell erstellt (Kunde, Fahrzeug, Vertrag, Zahlung).' } : a));
        setCurrentStep(2);
      }, 3000);
    } else if (currentStep === 2) {
      setAgents(prev => prev.map(a => a.id === 'validator' ? { ...a, status: 'ANALYZING', currentTask: 'Validiere Relationen und Referenzintegritäten...' } : a));
      addLog('🤖 [Schema Validator] Prüfe Fremdschlüssel-Beziehungen...');
      timer = setTimeout(() => {
        addLog('🤖 [Schema Validator] Validierung abgeschlossen. Fremdschlüssel "Vertrag.kunde_id" verweist korrekt auf "Kunde.id". Keine zirkulären Pfade.');
        setAgents(prev => prev.map(a => a.id === 'validator' ? { ...a, status: 'DONE', currentTask: 'Fremdschlüssel-Integrität zu 100% verifiziert.' } : a));
        setCurrentStep(3);
      }, 3000);
    } else if (currentStep === 3) {
      setAgents(prev => prev.map(a => a.id === 'perf_optimizer' ? { ...a, status: 'ANALYZING', currentTask: 'Simuliere Join-Szenarien und erstelle Index-Empfehlungen...' } : a));
      addLog('🤖 [Performance Agent] Analysiere Abfrage-Szenarien...');
      timer = setTimeout(() => {
        addLog('🤖 [Performance Agent] Index-Empfehlungen generiert: CREATE INDEX idx_vertrag_kunde ON vertrag(kunde_id);');
        setAgents(prev => prev.map(a => a.id === 'perf_optimizer' ? { ...a, status: 'DONE', currentTask: 'Indizes für Fremdschlüssel generiert.' } : a));
        setCurrentStep(4);
      }, 3000);
    } else if (currentStep === 4) {
      setAgents(prev => prev.map(a => a.id === 'security' ? { ...a, status: 'ANALYZING', currentTask: 'Analysiere Datenschutzklassen (PII) und DSGVO-Regularien...' } : a));
      addLog('🤖 [Security Auditor] Scanne sensible Spalten...');
      timer = setTimeout(() => {
        addLog('⚠️ [Security Auditor] PII-Feld entdeckt: "Kunde.telefonnummer". Empfehlung: Feld trennen oder verschlüsseln.');
        addLog('🤖 [Security Auditor] Audit erfolgreich beendet.');
        setAgents(prev => prev.map(a => a.id === 'security' ? { ...a, status: 'DONE', currentTask: 'PII-Felder deklariert & Datenschutz auditierte.' } : a));
        setCurrentStep(5);
      }, 3000);
    } else if (currentStep === 5) {
      addLog('✨ [System] Swarm-Durchlauf erfolgreich abgeschlossen! Schema bereit zur Integration.');
      setIsSimulating(false);
    }

    return () => clearTimeout(timer);
  }, [isSimulating, currentStep]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 flex flex-col h-full overflow-hidden font-sans">
      {/* Dashboard Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400 animate-pulse">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2 tracking-tight">
              Deep AI Agent Swarm Dashboard
            </h1>
            <p className="text-xs text-slate-400">Verteilte, kollaborative Multi-Agenten-Architektur zur autonomen Software-Optimierung</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            <Radio size={12} className="animate-pulse" />
            Verbindung Offen (Open Endpoints)
          </span>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control and Simulation Workspace */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto min-w-[300px]">
          {/* Swarm Input Area */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-purple-400">
              <Bot size={120} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Bot size={16} className="text-purple-400" />
                Szenario-Prompt für den AI-Schwarm
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Definieren Sie, was der Schwarm konzipieren und designen soll.</p>
            </div>
            <textarea
              className="w-full h-24 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs outline-none text-slate-500 font-medium resize-none transition-colors cursor-not-allowed"
              value={targetSchema}
              onChange={(e) => setTargetSchema(e.target.value)}
              disabled={true}
              placeholder="z.B. Erstelle ein Ticket-Management-System..."
            />
            
            {/* Warning banner */}
            <div className="p-2.5 bg-red-950/20 border border-red-900/50 rounded-lg text-xs text-red-400 font-medium flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Systemhinweis:</span> AI / KI-Funktionen und Simulationen wurden auf Wunsch des Administrators deaktiviert.
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Activity size={14} className="" />
                <span>Status: Deaktiviert</span>
              </div>
              <button
                disabled={true}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold transition-all cursor-not-allowed opacity-50"
              >
                <Play size={14} fill="currentColor" />
                <span>Schwarm ausführen (Deaktiviert)</span>
              </button>
            </div>
          </div>

          {/* Interactive Agent Swarm Topology Graph */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Schwarm-Topologie & Agenten-Rollen</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {agents.map((agent) => {
                const isActive = agent.status === 'ANALYZING';
                const isDone = agent.status === 'DONE';
                const isSelected = agent.id === selectedAgentId;

                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all relative ${
                      isSelected 
                        ? 'bg-slate-950 border-purple-500/70 shadow-lg shadow-purple-500/5' 
                        : 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 hover:border-slate-800'
                    }`}
                  >
                    {/* Active Pulse rings */}
                    {isActive && (
                      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${agent.bgColor} border ${agent.borderColor}`}>
                        {agent.icon}
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-bold text-slate-200">{agent.name}</h3>
                        <p className="text-[10px] text-slate-500 truncate">{agent.role}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900/60 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Zustand:</span>
                        <span className={`font-mono font-bold uppercase tracking-wider ${
                          isActive ? 'text-purple-400 animate-pulse' : isDone ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {agent.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {agent.currentTask}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Agent Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-72">
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Terminal size={14} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Swarm-Communication Terminal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-500 uppercase">Live Trace</span>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 bg-black/40">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              {isSimulating && (
                <div className="flex items-center gap-1.5 text-purple-400 animate-pulse text-xs">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Schwarm berät sich...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="w-80 bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Agent Configuration Details */}
          {selectedAgent && (
            <div className="p-5 border-b border-slate-850 space-y-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${selectedAgent.bgColor} border ${selectedAgent.borderColor}`}>
                  {selectedAgent.icon}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{selectedAgent.name}</h3>
                  <p className="text-[10px] text-slate-500">{selectedAgent.role}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Missionsbeschreibung</label>
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900 border border-slate-850 p-3 rounded-lg">
                  {selectedAgent.description}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">System-Instruktion (Prompt)</label>
                <textarea
                  className="w-full h-32 bg-slate-900 border border-slate-850 focus:border-purple-500 rounded-lg p-3 text-xs outline-none text-slate-300 font-mono resize-none leading-relaxed"
                  value={selectedAgent.systemPrompt}
                  onChange={(e) => {
                    const newAgents = [...agents];
                    const idx = newAgents.findIndex(a => a.id === selectedAgent.id);
                    if (idx !== -1) {
                      newAgents[idx] = { ...newAgents[idx], systemPrompt: e.target.value };
                      setAgents(newAgents);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Open Connection configuration */}
          <div className="p-5 space-y-5 bg-slate-950">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verbindungseinstellungen</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">KI-Provider</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-300"
                  defaultValue="gemini"
                >
                  <option value="gemini">Google Gemini SDK (@google/genai)</option>
                  <option value="openai">OpenAI REST Proxy</option>
                  <option value="custom">Eigener LLM-Endpunkt</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Model-Alias</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-300 font-mono"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kreativität (Temp)</label>
                  <input 
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-300 font-mono"
                    value={customTemperature}
                    onChange={(e) => setCustomTemperature(parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Tokens</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-300 font-mono"
                    defaultValue={4096}
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="bg-slate-900/50 border border-slate-850/50 p-3 rounded-lg flex items-start gap-2.5 text-[10px] text-slate-400 leading-relaxed">
                  <HelpCircle size={14} className="text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Hinweis:</strong> Die API-Anbindung ist vollständig vorbereitet. Der Code in <code>/features/logic/workflowAST.ts</code> empfängt die Strukturen und kompiliert sie direkt für C# und TypeScript.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
