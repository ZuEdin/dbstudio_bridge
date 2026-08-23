import React, { useState } from 'react';
import { FileCode2, Copy, CheckCircle2, Send, Cpu } from 'lucide-react';
import { bridgeApi } from '../../services/bridgeApi';

export const ApiDocsTab: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const sampleJson = `{
  "projectId": "proj_kunde_01",
  "projectName": "KundenVerwaltung",
  "targetFramework": "dotnet10",
  "frontendFramework": "react",
  "backendPort": 5000,
  "frontendPort": 3000,
  "autoInstall": true,
  "autoRun": true,
  "authToken": "bridge_sec_k98xLm720Pa_dbstudio",
  "files": [
    {
      "path": "Backend/Program.cs",
      "content": "var builder = WebApplication.CreateBuilder(args);\\nvar app = builder.Build();\\napp.MapGet(\\"/api/health\\", () => Results.Ok(new { status = \\"healthy\\" }));\\napp.Run();"
    },
    {
      "path": "Backend/KundenVerwaltung.csproj",
      "content": "<Project Sdk=\\"Microsoft.NET.Sdk.Web\\">\\n  <PropertyGroup>\\n    <TargetFramework>net10.0</TargetFramework>\\n  </PropertyGroup>\\n</Project>"
    }
  ]
}`;

  const sampleFetchCode = `// Aufruf aus der DB Studio Online-Webseite:
const deployToLocalBridge = async (projectData) => {
  const response = await fetch("http://127.0.0.1:5050/api/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Bridge-Token": "bridge_sec_k98xLm720Pa_dbstudio"
    },
    body: JSON.stringify(projectData)
  });
  const result = await response.json();
  console.log("Bridge Deployment Result:", result);
};`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTestSend = async () => {
    setIsSending(true);
    setTestResult(null);
    try {
      const payload = JSON.parse(sampleJson);
      const res = await bridgeApi.deployProject(payload);
      setTestResult(`[OK] 200: ${res.message}`);
    } catch (e: any) {
      setTestResult(`[FEHLER]: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Introduction Card */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center glow-emerald">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">DB Studio ↔ Bridge Schnittstellen-Spezifikation</h3>
            <p className="text-xs text-slate-400">Verbindungs- und Payload-Vertrag für den Empfang von C#/.NET und React Projekten.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs font-mono">
          <div className="bg-[#080D17] p-3.5 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">REST Deployment Endpoint</span>
            <span className="text-emerald-400 font-bold">POST http://127.0.0.1:5050/api/deploy</span>
          </div>
          <div className="bg-[#080D17] p-3.5 rounded-2xl border border-slate-800 shadow-inner">
            <span className="text-slate-500 block mb-1 text-[10px] uppercase font-semibold">WebSocket Live Log Stream</span>
            <span className="text-cyan-400 font-bold">WS ws://127.0.0.1:5050/logs</span>
          </div>
        </div>
      </div>

      {/* JSON Payload Schema */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">JSON Payload Format</h4>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(sampleJson, 'json')}
              className="flex items-center gap-1 bg-[#080D17] hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition-all shadow-inner"
            >
              {copied === 'json' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>JSON kopieren</span>
            </button>
            <button
              onClick={handleTestSend}
              disabled={isSending}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-emerald-950/50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sende...' : 'Test-Payload ausführen'}</span>
            </button>
          </div>
        </div>

        <pre className="bg-[#080D17] p-4.5 rounded-2xl border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto max-h-72 shadow-inner">
          {sampleJson}
        </pre>

        {testResult && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs p-3.5 rounded-2xl font-mono shadow-sm glow-emerald">
            {testResult}
          </div>
        )}
      </div>

      {/* Client-Side JavaScript Fetch Example */}
      <div className="bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">JavaScript Integration (Client-Side im Web-Studio)</h4>
          <button
            onClick={() => copyToClipboard(sampleFetchCode, 'js')}
            className="flex items-center gap-1.5 bg-[#080D17] hover:bg-slate-800 text-slate-200 text-xs px-3 py-1.5 rounded-xl border border-slate-800 transition-all shadow-inner"
          >
            {copied === 'js' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Code kopieren</span>
          </button>
        </div>

        <pre className="bg-[#080D17] p-4.5 rounded-2xl border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
          {sampleFetchCode}
        </pre>
      </div>
    </div>
  );
};
