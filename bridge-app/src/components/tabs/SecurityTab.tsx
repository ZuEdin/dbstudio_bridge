import React, { useState, useEffect } from 'react';
import { Key, Globe, Lock, Copy, CheckCircle2, RefreshCw, Trash2, Plus, Server, Download, Activity, AlertCircle, ExternalLink, Zap, FileCode, Check, FolderDown, FolderOpen } from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';
import { BridgeSettings } from '../../types/bridge';

export const SecurityTab: React.FC = () => {
  const [settings, setSettings] = useState<BridgeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Relay State
  const [relayUrlInput, setRelayUrlInput] = useState('');
  const [relayEnabled, setRelayEnabled] = useState(false);
  const [testingRelay, setTestingRelay] = useState(false);
  const [relayTestResult, setRelayTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);
  const [isDownloadingRelay, setIsDownloadingRelay] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await bridgeApi.getSettings();
    setSettings(data);
    if (data.relay) {
      setRelayUrlInput(data.relay.relayUrl || '');
      setRelayEnabled(data.relay.enabled || false);
    }
    setLoading(false);
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopy = () => {
    if (!settings?.securityToken) return;
    navigator.clipboard.writeText(settings.securityToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRelayScript = async () => {
    setIsDownloadingRelay(true);
    try {
      // 1. Speichern in den Windows Downloads-Ordner & im Explorer anzeigen
      const saveRes = await bridgeApi.saveRelayScriptToDownloads();
      
      // 2. Zusätzlich als Browser-Blob Download auslösen
      const res = await bridgeApi.getRelayScriptContent();
      if (res.success && res.script) {
        const encoded = encodeURIComponent(res.script);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = `data:application/octet-stream;charset=utf-8,${encoded}`;
        a.setAttribute('download', 'bridge_relay.php');
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 200);
      }

      if (saveRes?.success) {
        showNotification(`bridge_relay.php im Downloads-Ordner gespeichert!`);
      } else {
        showNotification('bridge_relay.php erfolgreich heruntergeladen!');
      }
    } catch {
      window.open(bridgeApi.downloadRelayScriptUrl(), '_blank');
    } finally {
      setIsDownloadingRelay(false);
    }
  };

  const handleSaveToDownloads = async () => {
    setIsDownloadingRelay(true);
    try {
      const saveRes = await bridgeApi.saveRelayScriptToDownloads();
      if (saveRes?.success) {
        showNotification(`Datei geöffnet: ${saveRes.path}`);
      } else {
        showNotification(`Hinweis: ${saveRes?.error || 'Konnte Ordner nicht öffnen'}`);
      }
    } catch (e: any) {
      showNotification(`Fehler: ${e.message}`);
    } finally {
      setIsDownloadingRelay(false);
    }
  };

  const handleCopyRelayScript = async () => {
    try {
      const res = await bridgeApi.getRelayScriptContent();
      if (res.success && res.script) {
        navigator.clipboard.writeText(res.script);
        setCopiedScript(true);
        showNotification('PHP-Script in die Zwischenablage kopiert!');
        setTimeout(() => setCopiedScript(false), 2500);
      }
    } catch {
      // Ignore
    }
  };

  const handleRegenerate = async () => {
    if (!settings) return;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let res = 'bridge_sec_';
    for (let i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const updated = { ...settings, securityToken: res };
    setSettings(updated);
    await bridgeApi.saveSettings(updated);
    showNotification('Neuer Sicherheits-Token erfolgreich gespeichert!');
  };

  const handleAddOrigin = async () => {
    if (!newOrigin.trim() || !settings) return;
    const trimmed = newOrigin.trim();
    if (!settings.allowedOrigins.includes(trimmed)) {
      const updated = {
        ...settings,
        allowedOrigins: [...settings.allowedOrigins, trimmed]
      };
      setSettings(updated);
      await bridgeApi.saveSettings(updated);
      setNewOrigin('');
      showNotification(`'${trimmed}' gespeichert!`);
    }
  };

  const handleRemoveOrigin = async (orig: string) => {
    if (!settings) return;
    const updated = {
      ...settings,
      allowedOrigins: settings.allowedOrigins.filter(o => o !== orig)
    };
    setSettings(updated);
    await bridgeApi.saveSettings(updated);
    showNotification(`'${orig}' entfernt!`);
  };

  const handleSaveRelay = async (enabledState = relayEnabled) => {
    if (!settings) return;
    const updated: BridgeSettings = {
      ...settings,
      relay: {
        enabled: enabledState,
        relayUrl: relayUrlInput.trim()
      }
    };
    setSettings(updated);
    await bridgeApi.saveSettings(updated);
    showNotification('Relay-Gateway-Einstellungen gespeichert!');
  };

  const handleTestRelay = async () => {
    if (!relayUrlInput.trim()) {
      alert('Bitte geben Sie zuerst Ihre Server-URL ein.');
      return;
    }
    setTestingRelay(true);
    setRelayTestResult(null);
    const res = await bridgeApi.testRelay(relayUrlInput.trim());
    setRelayTestResult(res);
    setTestingRelay(false);
    if (res.success) {
      showNotification('Relay erfolgreich erreichbar!');
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Lade Sicherheitseinstellungen...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {statusMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xl glow-emerald">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. PHP Cloud Relay Gateway Box */}
      <div className="bg-gradient-to-br from-[#0F172A] via-[#0E1526] to-[#0A0F1D] border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Eigener Cloud-Relay Server (PHP Gateway)</h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                  Empfohlen
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Löst alle Chrome Iframe- & Loopback-Sperren dauerhaft über Ihren eigenen Webspace mit fester HTTPS-Adresse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleCopyRelayScript}
              className="flex items-center gap-1.5 bg-[#080D17] hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-800 transition-all shadow-inner"
              title="PHP-Code in die Zwischenablage kopieren"
            >
              {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <FileCode className="w-4 h-4 text-slate-400" />}
              <span>{copiedScript ? 'Kopiert!' : 'Code kopieren'}</span>
            </button>

            <button
              onClick={handleSaveToDownloads}
              className="flex items-center gap-1.5 bg-[#080D17] hover:bg-slate-800 text-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-800 transition-all shadow-inner"
              title="Direkt im Windows Downloads-Ordner speichern und anzeigen"
            >
              <FolderOpen className="w-4 h-4 text-emerald-400" />
              <span>Im Explorer anzeigen</span>
            </button>

            <button
              onClick={handleDownloadRelayScript}
              disabled={isDownloadingRelay}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/50"
            >
              <Download className={`w-4 h-4 ${isDownloadingRelay ? 'animate-bounce' : ''}`} />
              <span>{isDownloadingRelay ? 'Speichere Datei...' : 'bridge_relay.php herunterladen'}</span>
            </button>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 relative z-10">
          <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl text-xs shadow-inner">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-mono">1</span>
              <span>Datei herunterladen</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Klicken Sie oben auf den Download. Ihr Sicherheitstoken ist bereits integriert.</p>
          </div>
          <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl text-xs shadow-inner">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-mono">2</span>
              <span>Auf Server laden</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Laden Sie <code className="text-slate-200 font-mono">bridge_relay.php</code> per FTP auf Ihre Domain hoch.</p>
          </div>
          <div className="bg-[#080D17]/80 backdrop-blur-md border border-slate-800 p-3.5 rounded-2xl text-xs shadow-inner">
            <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] flex items-center justify-center font-mono">3</span>
              <span>In DB Studio nutzen</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">Tragen Sie Ihre Server-URL in DB Studio ein. Fertig!</p>
          </div>
        </div>

        {/* Relay Configuration Form */}
        <div className="space-y-3 pt-3 border-t border-slate-800/80 relative z-10">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="https://meine-domain.de/bridge_relay.php"
                value={relayUrlInput}
                onChange={(e) => setRelayUrlInput(e.target.value)}
                className="w-full bg-[#080D17] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 shadow-inner placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={handleTestRelay}
              disabled={testingRelay}
              className="flex items-center justify-center gap-1.5 bg-[#080D17] hover:bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-800 transition-all shadow-inner shrink-0"
            >
              {testingRelay ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <Zap className="w-4 h-4 text-emerald-400" />}
              <span>Verbindung testen</span>
            </button>
            <button
              onClick={() => {
                const nextState = !relayEnabled;
                setRelayEnabled(nextState);
                handleSaveRelay(nextState);
              }}
              className={`flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0 shadow-sm ${
                relayEnabled
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white glow-emerald'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{relayEnabled ? '● Relay Aktiv' : 'Relay Aktivieren'}</span>
            </button>
          </div>

          {relayTestResult && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 shadow-sm ${
              relayTestResult.success ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 glow-emerald' : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}>
              {relayTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{relayTestResult.success ? 'Relay-Server antwortet einwandfrei! Sie können die URL nun in DB Studio verwenden.' : `Verbindung fehlgeschlagen: ${relayTestResult.error}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Security Token Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Bridge Authentifizierungs-Token</h3>
            <p className="text-xs text-slate-400">Jede Web-Anfrage von DB Studio muss diesen Token im Header <code className="text-emerald-400 font-mono">X-Bridge-Token</code> mitsenden.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                readOnly
                value={settings.securityToken}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
              />
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Neu generieren</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORS Whitelist Origins */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">CORS & Erlaubte Web-Domains</h3>
            <p className="text-xs text-slate-400">Nur Browser-Tabs dieser autorisierten URLs dürfen Code an die lokale Bridge senden (unterstützt auch Wildcards wie <code className="text-emerald-400 font-mono">*.run.app</code>).</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="z. B. *.europe-west2.run.app oder https://dbstudio.app"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOrigin()}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleAddOrigin}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hinzufügen</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-2 max-h-80 overflow-y-auto pr-1">
            {settings.allowedOrigins.map((origin) => (
              <div key={origin} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-300">
                <span className="truncate mr-2">{origin}</span>
                <button
                  onClick={() => handleRemoveOrigin(origin)}
                  className="text-slate-500 hover:text-rose-400 transition-colors text-xs font-bold shrink-0 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Entfernen</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
