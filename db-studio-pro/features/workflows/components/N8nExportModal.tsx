import React, { useState } from 'react';
import { Workflow } from '../../../types/index';
import { generateN8nWorkflow, N8nWorkflowExport } from '../../../utils/generators/n8nGenerator';
import { Copy, Download, Check, ExternalLink, Zap, Layers, Sparkles, X } from 'lucide-react';

interface N8nExportModalProps {
  workflow: Workflow;
  onClose: () => void;
  onShowToast?: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const N8nExportModal: React.FC<N8nExportModalProps> = ({
  workflow,
  onClose,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000');
  
  const n8nWorkflow: N8nWorkflowExport = generateN8nWorkflow(workflow, baseUrl);
  const jsonString = JSON.stringify(n8nWorkflow, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast?.("n8n Workflow JSON in die Zwischenablage kopiert!", "success");
  };

  const handleDownload = () => {
    const filename = `${(workflow.name || 'db-studio-workflow').toLowerCase().replace(/[^a-z0-9]/g, '-')}-n8n.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast?.(`Datei '${filename}' erfolgreich heruntergeladen.`, "success");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">n8n Workflow Export</h3>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  JSON v1.1 Kompatibel
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exportieren Sie Ihren visuellen DB Studio Flow direkt als n8n Automation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 font-sans">
          {/* Info Banner */}
          <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                <Sparkles size={14} />
                <span>1-Klick n8n Import-Anleitung</span>
              </span>
              <p className="text-xs text-slate-300">
                1. Klicken Sie auf <strong>"In die Zwischenablage kopieren"</strong> oder <strong>"JSON Datei herunterladen"</strong>.
                <br />
                2. Öffnen Sie Ihre n8n Instanz, drücken Sie <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] font-mono border border-slate-700">Ctrl + V</kbd> auf dem Canvas oder wählen Sie <em>Workflow → Import from File</em>.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Download .json</span>
              </button>
            </div>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Backend API Basis-URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-xs font-mono px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="http://localhost:5000"
              />
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Konvertierte Nodes</label>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 mt-1">
                <Layers size={14} />
                <span>{n8nWorkflow.nodes.length} Knoten generiert</span>
              </div>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verbindungen (Routing)</label>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 mt-1">
                <Zap size={14} />
                <span>{Object.keys(n8nWorkflow.connections).length} Verzweigungen</span>
              </div>
            </div>
          </div>

          {/* JSON Viewer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="font-bold text-slate-300 font-mono">n8n Workflow Schema (JSON):</span>
              <span className="font-mono text-[11px]">Größe: {(jsonString.length / 1024).toFixed(1)} KB</span>
            </div>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs max-h-72 overflow-y-auto">
              <pre className="text-slate-300 leading-relaxed">
                <code>{jsonString}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Vollständig kompatibel mit n8n Cloud & Self-Hosted</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
