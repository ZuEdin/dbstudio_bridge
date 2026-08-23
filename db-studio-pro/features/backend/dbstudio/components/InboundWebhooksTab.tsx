import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  Copy, 
  Check, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  GitBranch, 
  CreditCard, 
  Zap, 
  RefreshCw, 
  Clock, 
  Terminal,
  ExternalLink
} from 'lucide-react';

interface InboundWebhooksTabProps {
  remoteServerUrl: string;
  showMessage: (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => void;
}

export interface InboundEventItem {
  id: string;
  channel: string;
  provider: string;
  signature?: string;
  timestamp: string;
  status: 'PROCESSED' | 'PENDING' | 'ERROR';
  payload: any;
}

export const InboundWebhooksTab: React.FC<InboundWebhooksTabProps> = ({
  remoteServerUrl,
  showMessage,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'stripe' | 'github' | 'iot' | 'n8n' | 'custom'>('stripe');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testPayload, setTestPayload] = useState<string>(() => JSON.stringify({
    id: "evt_3N8nStripeTest_10928",
    object: "event",
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_3N8n9872134",
        amount: 25000,
        currency: "eur",
        customer: "cus_DemoCustomer123",
        status: "succeeded"
      }
    }
  }, null, 2));

  const [events, setEvents] = useState<InboundEventItem[]>([
    {
      id: "evt_init_001",
      channel: "stripe",
      provider: "Stripe",
      signature: "whsec_live_9988aabbcc",
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString(),
      status: "PROCESSED",
      payload: {
        type: "payment_intent.succeeded",
        amount: 1499.00,
        currency: "EUR",
        customer: "Firma Mustermann GmbH"
      }
    },
    {
      id: "evt_init_002",
      channel: "github",
      provider: "GitHub",
      signature: "sha256=a1b2c3d4e5f67890",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString(),
      status: "PROCESSED",
      payload: {
        event: "push",
        ref: "refs/heads/main",
        commits_count: 3,
        sender: "lead-dev"
      }
    },
    {
      id: "evt_init_003",
      channel: "iot",
      provider: "IoT Sensor Hub",
      signature: "IOT_KEY_9901",
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toLocaleTimeString(),
      status: "PROCESSED",
      payload: {
        deviceId: "BAUSTELLE_KRAN_SENSOR_04",
        metric: "temperature_celsius",
        value: 42.5,
        alarmLevel: "NORMAL"
      }
    }
  ]);

  const channelConfigs = {
    stripe: {
      name: "Stripe Payment & Invoices Hub",
      provider: "Stripe",
      icon: CreditCard,
      color: "indigo",
      endpoint: "/api/webhooks/inbound/stripe",
      headerName: "Stripe-Signature",
      defaultSecret: "whsec_test_secret_9988",
      samplePayload: {
        id: "evt_stripe_payment_001",
        object: "event",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_998234",
            amount: 45000,
            currency: "eur",
            status: "succeeded",
            customer_email: "buchhaltung@kunde.de"
          }
        }
      }
    },
    github: {
      name: "GitHub Git Repository & CI Events",
      provider: "GitHub",
      icon: GitBranch,
      color: "purple",
      endpoint: "/api/webhooks/inbound/github",
      headerName: "X-Hub-Signature-256",
      defaultSecret: "gh_webhook_secret_abc",
      samplePayload: {
        action: "opened",
        issue: {
          number: 42,
          title: "Neue Materialanforderung Bauabschnitt B",
          user: { login: "bauleiter_mueller" }
        },
        repository: { name: "dbstudio-construction-project" }
      }
    },
    iot: {
      name: "IoT Sensor & Telemetrie Ingestion Hub",
      provider: "IoT Sensor Hub",
      icon: Cpu,
      color: "emerald",
      endpoint: "/api/webhooks/inbound/iot",
      headerName: "X-Device-Id",
      defaultSecret: "DEVICE_BAUSTELLE_WEST_01",
      samplePayload: {
        deviceId: "SENSOR_BETON_FEUCHTE_09",
        metric: "humidity_percent",
        value: 88.4,
        unit: "%",
        alarmLevel: "WARNUNG_BETON_TROCKNUNG",
        timestamp: new Date().toISOString()
      }
    },
    n8n: {
      name: "n8n Automation Event Bridge",
      provider: "n8n",
      icon: Zap,
      color: "orange",
      endpoint: "/api/webhooks/inbound/n8n",
      headerName: "X-Webhook-Secret",
      defaultSecret: "n8n_secret_token_12345",
      samplePayload: {
        workflowName: "Auftrag zu Rechnung Flow",
        executionId: "n8n_exec_9876",
        data: {
          auftragsNummer: "AUF-2026-0819",
          gesamtBetrag: 12450.00,
          status: "Freigegeben"
        }
      }
    },
    custom: {
      name: "Individueller REST Webhook Endpunkt",
      provider: "Generic JSON",
      icon: Terminal,
      color: "blue",
      endpoint: "/api/webhooks/inbound/custom",
      headerName: "X-Webhook-Secret",
      defaultSecret: "custom_bearer_secret_xyz",
      samplePayload: {
        event: "custom.order.created",
        source: "ERP_SAP_INTERFACE",
        timestamp: new Date().toISOString(),
        items: [
          { sku: "ART-101", qty: 25, price: 19.90 }
        ]
      }
    }
  };

  const currentCfg = channelConfigs[selectedChannel];
  const fullEndpointUrl = `${remoteServerUrl.endsWith('/') ? remoteServerUrl.slice(0, -1) : remoteServerUrl}${currentCfg.endpoint}`;

  const handleSelectChannel = (ch: 'stripe' | 'github' | 'iot' | 'n8n' | 'custom') => {
    setSelectedChannel(ch);
    setTestPayload(JSON.stringify(channelConfigs[ch].samplePayload, null, 2));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
    showMessage("Kopiert", "In die Zwischenablage kopiert.", "success");
  };

  const handleSendTestWebhook = async () => {
    setIsSendingTest(true);
    let parsed: any = {};
    try {
      parsed = JSON.parse(testPayload);
    } catch (e) {
      showMessage("JSON Syntaxfehler", "Bitte geben Sie ein gültiges JSON-Format ein.", "error");
      setIsSendingTest(false);
      return;
    }

    try {
      const res = await fetch(fullEndpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [currentCfg.headerName]: currentCfg.defaultSecret
        },
        body: JSON.stringify(parsed)
      });

      if (res.ok) {
        const resData = await res.json();
        const newEvt: InboundEventItem = {
          id: resData.eventId || `evt_${Date.now()}`,
          channel: selectedChannel,
          provider: currentCfg.provider,
          signature: currentCfg.defaultSecret,
          timestamp: new Date().toLocaleTimeString(),
          status: "PROCESSED",
          payload: parsed
        };
        setEvents(prev => [newEvt, ...prev]);
        showMessage("Webhook Ingestion Erfolgreich!", `Ereignis von ${currentCfg.provider} wurde über ${currentCfg.endpoint} verarbeitet.`, "success");
      } else {
        // Fallback simulated ingest when offline/local
        const newEvt: InboundEventItem = {
          id: `evt_sim_${Date.now()}`,
          channel: selectedChannel,
          provider: currentCfg.provider,
          signature: currentCfg.defaultSecret,
          timestamp: new Date().toLocaleTimeString(),
          status: "PROCESSED",
          payload: parsed
        };
        setEvents(prev => [newEvt, ...prev]);
        showMessage("Ereignis Lokal Verarbeitet", `Inbound Webhook (${currentCfg.provider}) wurde simuliert und im Event-Hub protokolliert.`, "info");
      }
    } catch (err: any) {
      // Local fallback
      const newEvt: InboundEventItem = {
        id: `evt_sim_${Date.now()}`,
        channel: selectedChannel,
        provider: currentCfg.provider,
        signature: currentCfg.defaultSecret,
        timestamp: new Date().toLocaleTimeString(),
        status: "PROCESSED",
        payload: parsed
      };
      setEvents(prev => [newEvt, ...prev]);
      showMessage("Ereignis Lokal Verarbeitet", `Inbound Webhook (${currentCfg.provider}) wurde simuliert und im Event-Hub protokolliert.`, "info");
    } finally {
      setIsSendingTest(false);
    }
  };

  const curlCommand = `curl -X POST "${fullEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "${currentCfg.headerName}: ${currentCfg.defaultSecret}" \\
  -d '${testPayload.replace(/\n/g, '').replace(/\s\s+/g, ' ')}'`;

  return (
    <div id="inbound_webhooks_tab_container" className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Card */}
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/80 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="text-emerald-400 animate-pulse" size={20} />
              <h2 className="text-base font-bold text-white">
                Inbound Webhook & Event-Trigger Ingestion Hub
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                C# .NET 10 & Node.js Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dedizierte API-Endpunkte zur automatischen Erfassung externer Trigger (Stripe Zahlungen, GitHub Events, IoT Sensoren, n8n Flows) direkt im Backend.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-slate-300 font-mono font-bold">Listener Aktiv</span>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['stripe', 'github', 'iot', 'n8n', 'custom'] as const).map(ch => {
            const cfg = channelConfigs[ch];
            const Icon = cfg.icon;
            const isSelected = selectedChannel === ch;
            return (
              <button
                key={ch}
                onClick={() => handleSelectChannel(ch)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected 
                    ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500' 
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">{cfg.provider}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{cfg.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{cfg.endpoint}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Channel Detail & Endpoint Config */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Endpoint details & Test Trigger */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300">Dedizierter Inbound Endpunkt (POST):</span>
                <button
                  onClick={() => handleCopy(fullEndpointUrl, 'url')}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer font-mono font-bold"
                >
                  {copiedUrl === 'url' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedUrl === 'url' ? 'Kopiert!' : 'URL Kopieren'}</span>
                </button>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 break-all select-all">
                {fullEndpointUrl}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Header Name</div>
                  <div className="font-mono text-slate-300 font-bold mt-0.5">{currentCfg.headerName}</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Secret / Signatur-Schlüssel</div>
                  <div className="font-mono text-slate-300 font-bold mt-0.5 truncate">{currentCfg.defaultSecret}</div>
                </div>
              </div>
            </div>

            {/* Test Trigger Payload */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Test-Payload an Backend senden (JSON):
                </label>
                <button
                  onClick={() => setTestPayload(JSON.stringify(currentCfg.samplePayload, null, 2))}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer font-mono"
                >
                  Standard zurücksetzen
                </button>
              </div>
              <textarea
                rows={7}
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSendTestWebhook}
                disabled={isSendingTest}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all border border-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} className={isSendingTest ? 'animate-spin' : ''} />
                <span>Test-Webhook Auslösen (POST {currentCfg.endpoint})</span>
              </button>

              <button
                onClick={() => handleCopy(curlCommand, 'curl')}
                className="px-4 py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedUrl === 'curl' ? <Check size={14} className="text-emerald-400" /> : <Terminal size={14} />}
                <span>cURL Befehl</span>
              </button>
            </div>
          </div>

          {/* Right: Inbound Event History Stream */}
          <div className="lg:col-span-5 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs flex flex-col min-h-[350px]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                <span className="font-bold text-slate-200">Echtzeit Inbound Event-Log</span>
              </div>
              <span className="text-[11px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                {events.length} Ereignisse
              </span>
            </div>

            <div className="p-2 overflow-y-auto flex-1 space-y-3 max-h-[340px] mt-2">
              {events.map((ev, i) => (
                <div 
                  key={ev.id + '_' + i}
                  className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-indigo-300 uppercase">{ev.provider}</span>
                    <span className="text-slate-500">{ev.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold border border-emerald-500/20">
                      {ev.status}
                    </span>
                    <span className="text-slate-400 truncate">ID: {ev.id}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-[11px] text-slate-300 overflow-x-auto max-h-24">
                    <pre><code>{JSON.stringify(ev.payload, null, 2)}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
