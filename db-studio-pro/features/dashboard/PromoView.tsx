import React, { useState } from 'react';
import { Table, Query, Report, Form } from '../../types/index';
import { 
  Database, Table as TableIcon, Search, FileText, Layout, 
  Sparkles, Zap, Cpu, Eye, Shield, CheckCircle2, ArrowRight,
  Monitor, Smartphone, Tablet, ChevronRight, Play, Code, Star,
  DollarSign, Clock, Layers, Users, ExternalLink, ThumbsUp, Plus
} from 'lucide-react';

interface PromoViewProps {
  tables: Table[];
  queries: Query[];
  reports: Report[];
  forms: Form[];
  onNavigate: (type: 'table_create' | 'query_designer' | 'create_report' | 'create_form' | 'table_data', id?: string) => void;
}

export const PromoView: React.FC<PromoViewProps> = ({ tables, queries, reports, forms, onNavigate }) => {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFeature, setSelectedFeature] = useState<'schema' | 'forms' | 'pages' | 'export'>('schema');
  const [selectedLang, setSelectedLang] = useState<'react-node' | 'dotnet' | 'angular'>('react-node');
  const [schemaFields, setSchemaFields] = useState<Array<{name: string, type: string}>>([
    { name: 'id', type: 'uuid' },
    { name: 'name', type: 'varchar' },
    { name: 'email', type: 'varchar' },
    { name: 'role', type: 'varchar' }
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('varchar');
  const [copied, setCopied] = useState(false);

  const addSchemaField = () => {
    if (!newFieldName.trim()) return;
    setSchemaFields([...schemaFields, { name: newFieldName.toLowerCase().replace(/\s+/g, '_'), type: newFieldType }]);
    setNewFieldName('');
  };

  const codeSnippets = {
    'react-node': {
      title: 'React Client + Express API (TypeScript)',
      server: `// server.ts - Generierte Express API
import express from 'express';
import { pool } from './db';

const app = express();
app.use(express.json());

// Automatisierte Endpoint-Generierung für deine Custom-Tabelle
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT ${schemaFields.map(f => f.name).join(', ')} FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`,
      client: `// UsersPage.tsx - Generierte UI mit Tailwind
import React, { useEffect, useState } from 'react';
import { get } from '../api';

export const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    get('/users').then(res => setUsers(res.data || []));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Benutzer-Verzeichnis</h1>
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 font-semibold text-slate-700 border-b">
            <tr>
              ${schemaFields.map(f => `<th className="p-3 text-left">${f.name.toUpperCase()}</th>`).join('\n              ')}
            </tr>
          </thead>
          <tbody className="divide-y text-slate-600">
            {users.map((u, i) => (
              <tr key={i} className="hover:bg-slate-50">
                ${schemaFields.map(f => `<td className="p-3">{String(u.${f.name} ?? '')}</td>`).join('\n                ')}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};`
    },
    'dotnet': {
      title: 'ASP.NET Core API + C# Entity Framework',
      server: `// UserController.cs - Generierter Controller
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    public UsersController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        return await _context.Users
            .Select(u => new User {
                ${schemaFields.map(f => `${toPascalCase(f.name)} = u.${toPascalCase(f.name)}`).join(',\n                ')}
            }).ToListAsync();
    }
}`,
      client: `// User.cs - EF Core Entity Definition
public class User
{
    ${schemaFields.map(f => `public ${f.type === 'uuid' ? 'Guid' : 'string'} ${toPascalCase(f.name)} { get; set; }`).join('\n    ')}
}`
    },
    'angular': {
      title: 'Angular Client Component (V17+ TypeScript)',
      server: `// user.service.ts - REST Proxy Service
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  getUsers() {
    return this.http.get<any[]>('/api/users');
  }
}`,
      client: `<!-- user-list.component.html -->
<div class="p-6">
  <h2 class="text-xl font-bold mb-4">Datenexplorer</h2>
  <div class="overflow-x-auto border rounded-lg">
    <table class="w-full text-sm">
      <thead class="bg-gray-100">
        <tr>
          ${schemaFields.map(f => `<th class="p-2 text-left">${f.name}</th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let u of users()" class="border-t">
          ${schemaFields.map(f => `<td class="p-2">{{ u.${f.name} }}</td>`).join('\n          ')}
        </tr>
      </tbody>
    </table>
  </div>
</div>`
    }
  };

  function toPascalCase(str: string) {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  }

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen overflow-x-hidden font-sans">
      {/* Glow effects background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Promo Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-20 relative z-10">
        
        {/* Navigation / Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400">
              <Sparkles className="size-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">DB STUDIO PRO</h1>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-900">V2.0 ENTERPRISE</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs text-slate-400">
              <button 
                onClick={() => setDevice('desktop')} 
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${device === 'desktop' ? 'bg-indigo-600 text-white font-bold shadow' : 'hover:text-slate-200'}`}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button 
                onClick={() => setDevice('tablet')} 
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${device === 'tablet' ? 'bg-indigo-600 text-white font-bold shadow' : 'hover:text-slate-200'}`}
              >
                <Tablet size={12} /> Tablet
              </button>
              <button 
                onClick={() => setDevice('mobile')} 
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${device === 'mobile' ? 'bg-indigo-600 text-white font-bold shadow' : 'hover:text-slate-200'}`}
              >
                <Smartphone size={12} /> Mobile
              </button>
            </div>
            <button 
              onClick={() => onNavigate('table_create')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              Loslegen <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-900/40 to-slate-800 border border-indigo-800/60 rounded-full text-xs text-indigo-300 font-semibold shadow-inner">
            <Zap size={12} className="text-amber-400" />
            <span>Erstelle responsive Client-Server Apps zu 100% visuell</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
            Visuell entwerfen.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent">Produktionsreifer Code</span> herausbekommen.
          </h2>
          <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto">
            Designen Sie komplexe relationale Datenbanken, programmieren Sie Sichten, bauen Sie Drag-&-Drop Formulare mit Rollenschutz und exportieren Sie echten TypeScript-Quellcode.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
            <button 
              onClick={() => onNavigate('table_create')}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-8 py-4 rounded-xl text-sm font-bold shadow-xl shadow-indigo-600/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Erste Tabelle erstellen <Play size={14} className="fill-white" />
            </button>
            <button 
              onClick={() => {
                const element = document.getElementById('interactive-showroom');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-8 py-4 rounded-xl text-sm font-bold transition-all hover:border-slate-500 flex items-center justify-center gap-2"
            >
              Interaktive Demo ansehen <Eye size={14} />
            </button>
          </div>

          {/* Quick Realtime Badge counter adaptively reflecting current project stats */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-xs text-slate-500">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
              <span className="block text-slate-300 font-black text-lg">{tables.length || 0}</span>
              Tabellen im Entwurf
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
              <span className="block text-slate-300 font-black text-lg">{forms.length || 0}</span>
              Aktive Eingabemasken
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
              <span className="block text-slate-300 font-black text-lg">{reports.length || 0}</span>
              Analytische Berichte
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
              <span className="block text-slate-300 font-black text-lg">{queries.length || 0}</span>
              Gespeicherte DB-Sichten
            </div>
          </div>
        </div>

        {/* Live Device / App Mockup Window */}
        <div id="interactive-showroom" className="relative max-w-5xl mx-auto">
          {/* Decorative frame shadow */}
          <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl filter blur-3xl -z-10" />
          
          <div className="mt-8 transition-all duration-300">
            {/* Device Wrapper */}
            <div className={`mx-auto bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
              device === 'mobile' ? 'max-w-[360px] h-[550px]' : 
              device === 'tablet' ? 'max-w-[768px] h-[500px]' : 
              'w-full min-h-[500px]'
            }`}>
              {/* Device Top Bar */}
              <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <span className="size-3 rounded-full bg-red-500/80 block" />
                  <span className="size-3 rounded-full bg-yellow-500/80 block" />
                  <span className="size-3 rounded-full bg-green-500/80 block" />
                </div>
                <div className="bg-slate-950 px-3 py-1 rounded text-[10px] text-slate-400 font-mono select-none flex items-center gap-1.5 shadow-inner">
                  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                  https://app.dbstudio.io/deine-app-live
                </div>
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest hidden sm:block">
                  Live Preview Sandbox
                </div>
              </div>

              {/* Device Inner Content - Dynamic Showcase */}
              <div className="p-6 bg-slate-900 min-h-[420px] text-slate-300">
                
                {/* Embedded Mini-App Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Database className="text-indigo-400 size-4" />
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Kundenportal v1</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-900 font-semibold">Geprüft ✔</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/80 text-indigo-300 font-mono font-bold">Rolle: Admin</span>
                  </div>
                </div>

                {/* Sub-Feature Tab selectors */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { id: 'schema', label: '1. Tabellen', icon: Database },
                    { id: 'forms', label: '2. Formulare', icon: Layout },
                    { id: 'pages', label: '3. UI Designer', icon: Layers },
                    { id: 'export', label: '4. Code Export', icon: Code }
                  ].map(tab => {
                    const TabIconSel = tab.icon;
                    return (
                      <button 
                        key={tab.id}
                        onClick={() => setSelectedFeature(tab.id as any)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                          selectedFeature === tab.id ? 
                          'bg-indigo-600/20 border-indigo-500 text-white shadow-inner' : 
                          'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <TabIconSel size={14} className={selectedFeature === tab.id ? 'text-indigo-400' : 'text-slate-500'} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Tab content 1: Interactive Schema Maker */}
                {selectedFeature === 'schema' && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-slate-400 leading-relaxed bg-indigo-950/20 p-2.5 rounded border border-indigo-900/30">
                      💡 <strong>Füge eigene Spalten hinzu!</strong> Erlebe wie sich das Schema live aktualisiert und im "4. Code Export" Tab sofort fehlerfreier Code bereitsteht.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Input values */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wide">Feld hinzufügen</h4>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Feldname</label>
                            <input 
                              type="text" 
                              value={newFieldName}
                              onChange={e => setNewFieldName(e.target.value)}
                              placeholder="z.B. nickname, alter, status" 
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">Datentyp</label>
                            <select 
                              value={newFieldType}
                              onChange={e => setNewFieldType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500"
                            >
                              <option value="varchar">VARCHAR(255) / Text</option>
                              <option value="integer">INTEGER / Zahl</option>
                              <option value="boolean">BOOLEAN / Ja-Nein</option>
                              <option value="timestamp">TIMESTAMP / Datum</option>
                            </select>
                          </div>
                          <button 
                            onClick={addSchemaField}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                          >
                            <Plus size={12} /> Feld anlegen
                          </button>
                        </div>
                      </div>

                      {/* Right: DB Card layout diagram */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                          <span className="text-[10px] font-black font-mono text-indigo-400">table: users</span>
                          <span className="text-[9px] text-slate-500">primary key: id</span>
                        </div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {schemaFields.map((field, index) => (
                            <div key={index} className="flex justify-between items-center bg-slate-900/60 hover:bg-slate-900 px-2 py-1.5 rounded text-xs border border-slate-800/40">
                              <span className="font-mono text-slate-200 flex items-center gap-1.5">
                                <span className="size-1 rounded-full bg-slate-500" />
                                {field.name}
                              </span>
                              <span className="font-mono text-indigo-400 text-[10px] bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-950">{field.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 2: Form Designer demo */}
                {selectedFeature === 'forms' && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-slate-400 leading-relaxed bg-indigo-950/20 p-2.5 rounded border border-indigo-900/30">
                      💡 <strong>Bedingte Rollen- & Sichtbarkeitsprüfung!</strong> Du kannst Eingaben für bestimmte Rollen (z.B. nur <code>admin</code>) sperren, oder Felder bedingt ein-/ausblenden.
                    </p>
                    
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 max-w-xl mx-auto space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-300">Formular-Vorschau</span>
                        <span className="text-[9px] text-amber-500 bg-amber-950/50 border border-amber-900 px-2 py-0.5 rounded">Rollenprüfung aktiv</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1">Benutzername</label>
                          <input type="text" placeholder="Geben Sie Ihren Namen ein" disabled value="Sarah Connor" className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-400 cursor-not-allowed" />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-400 font-medium mb-1">Rolle im Unternehmen</label>
                          <select className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-300">
                            <option value="developer">Entwickler / Developer</option>
                            <option value="admin">Administrator (Schaltet Spezialfelder frei!)</option>
                          </select>
                        </div>

                        <div className="border border-indigo-950 bg-indigo-950/30 rounded-lg p-3 space-y-1.5">
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block flex items-center gap-1">
                            <Shield size={10} /> Nur für Administratoren sichtbar
                          </span>
                          <input type="text" placeholder="Spezial-ID (z.B. admin_conf_909)" className="w-full bg-slate-900 border border-indigo-900/40 rounded p-2 text-xs text-indigo-200 outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 3: Visual Page Designer showcase */}
                {selectedFeature === 'pages' && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-xs text-slate-400 bg-indigo-950/20 p-2.5 rounded border border-indigo-900/30">
                      💡 <strong>Binde Daten an Widgets!</strong> Erstelle Dashboards und Sichten, die direkte Echtzeit-Abfragen visualisieren oder interaktive Dropdown-Filter aktualisieren.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">1. Widget-Datenquelle</span>
                        <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1 text-xs">
                          <div className="font-semibold text-slate-200">Abfrage: kunden_umsatz</div>
                          <code className="text-[10px] text-indigo-400 block break-all">SELECT name, sum(revenue) FROM sales GROUP BY name</code>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Der UI Builder verknüpft dieses Query-Ergebnis direkt mit einer Visualisierung. Keine REST-Controller-Templates erforderlich.
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">2. Visualisierte Chart-Ansicht</span>
                        {/* Fake graphical chart using CSS */}
                        <div className="flex items-end justify-around h-24 pt-4 border-b border-slate-800 px-2">
                          <div className="w-8 bg-indigo-500 rounded-t h-1/3 hover:bg-indigo-400 transition-all cursor-pointer relative group">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 text-[8px] px-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">12k</div>
                          </div>
                          <div className="w-8 bg-indigo-500 rounded-t h-3/4 hover:bg-indigo-400 transition-all cursor-pointer relative group">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 text-[8px] px-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">45k</div>
                          </div>
                          <div className="w-8 bg-indigo-500 rounded-t h-2/3 hover:bg-indigo-400 transition-all cursor-pointer relative group">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 text-[8px] px-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">30k</div>
                          </div>
                          <div className="w-8 bg-indigo-500 rounded-t h-full hover:bg-indigo-400 transition-all cursor-pointer relative group">
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950 text-[8px] px-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">65k</div>
                          </div>
                        </div>
                        <div className="flex justify-around text-[9px] text-slate-500 uppercase mt-2">
                          <span>Jan</span>
                          <span>Feb</span>
                          <span>Mär</span>
                          <span>Apr</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 4: Direct Export Code Builder Preview */}
                {selectedFeature === 'export' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <p className="text-xs text-slate-400">
                        Hier ist der dynamisch erzeugte, compilierbare Quellcode für die von Ihnen definierte Schema-Tabelle.
                      </p>
                      
                      {/* Framework Switch */}
                      <div className="bg-slate-950 border border-slate-800 p-0.5 rounded-lg flex text-[10px] font-bold">
                        <button 
                          onClick={() => setSelectedLang('react-node')}
                          className={`px-2 py-1 rounded transition-all ${selectedLang === 'react-node' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          React + Express
                        </button>
                        <button 
                          onClick={() => setSelectedLang('dotnet')}
                          className={`px-2 py-1 rounded transition-all ${selectedLang === 'dotnet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          ASP.NET Core
                        </button>
                        <button 
                          onClick={() => setSelectedLang('angular')}
                          className={`px-2 py-1 rounded transition-all ${selectedLang === 'angular' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                          Angular
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* API Server File */}
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-60">
                        <div className="bg-slate-900 border-b border-slate-800/80 px-3 py-1.5 flex justify-between items-center">
                          <span className="text-[10px] text-indigo-400 font-mono font-bold">Backend Route</span>
                          <button 
                            onClick={() => copyToClipboard(codeSnippets[selectedLang].server)}
                            className="text-[9px] text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-semibold"
                          >
                            Kopieren
                          </button>
                        </div>
                        <pre className="p-3 text-[9px] font-mono text-slate-300 overflow-auto flex-1 leading-relaxed whitespace-pre bg-slate-950/90 [tab-size:4]">
                          {codeSnippets[selectedLang].server}
                        </pre>
                      </div>

                      {/* Frontend Component File */}
                      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-60">
                        <div className="bg-slate-900 border-b border-slate-800/80 px-3 py-1.5 flex justify-between items-center">
                          <span className="text-[10px] text-indigo-400 font-mono font-bold">Client Template</span>
                          <button 
                            onClick={() => copyToClipboard(codeSnippets[selectedLang].client)}
                            className="text-[9px] text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-semibold"
                          >
                            Kopieren
                          </button>
                        </div>
                        <pre className="p-3 text-[9px] font-mono text-slate-300 overflow-auto flex-1 leading-relaxed whitespace-pre bg-slate-950/90 [tab-size:4]">
                          {codeSnippets[selectedLang].client}
                        </pre>
                      </div>
                    </div>
                    
                    {copied && (
                      <div className="text-center text-xs text-green-400 font-bold bg-green-950/20 py-2 rounded border border-green-900">
                        ✔ Quellcode erfolgreich in die Zwischenablage kopiert!
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid with Elegant Bento Boxes */}
        <div className="space-y-4 max-w-6xl mx-auto">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-white">Das komplette Arsenal für Software-Entwicklung</h3>
            <p className="text-sm text-slate-400">Erzeugen Sie hochkomplexe relationale Front- und Backend Architekturen ohne Limitierungen.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-4">
                <div className="bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl w-fit text-orange-400">
                  <Database size={20} />
                </div>
                <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">Visueller Schema-Builder</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Definieren Sie Tabellen, Fremdschlüssel-Beziehungen und Primary Keys. Das System validiert automatisch die Integrität der DB und verhindert Datenkonflikte.
                </p>
              </div>
              <button onClick={() => onNavigate('table_create')} className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
                Datenbank anlegen <ChevronRight size={14} />
              </button>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl w-fit text-indigo-400">
                  <Layout size={20} />
                </div>
                <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">Drag-&-Drop FormDesigner</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bauen Sie Eingabemasken mit fortgeschrittener Sichtbarkeits-Logik. Schützen Sie sensible Felder für bestimmte Rollengruppen (z.B. user, editor, admin) mit nur einem Klick.
                </p>
              </div>
              <button onClick={() => onNavigate('create_form')} className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
                Formular zeichnen <ChevronRight size={14} />
              </button>
            </div>

            <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/40 transition-colors group">
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl w-fit text-emerald-400">
                  <Cpu size={20} />
                </div>
                <h4 className="font-extrabold text-white text-lg group-hover:text-indigo-400 transition-colors">Abfrage- & Filterengine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kompilieren Sie SQL-Abfragen, erzeugen Sie Joins und stellen Sie dynamische Dashboards mit mehreren Widget-Ansichten bereit, die globalen Suchfiltern gehorchen.
                </p>
              </div>
              <button onClick={() => onNavigate('query_designer')} className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 mt-6 pt-4 border-t border-slate-900">
                SQL Query schreiben <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Trust Factor / Testimonials */}
        <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/20 border border-indigo-900/40 rounded-3xl p-8 md:p-12 max-w-5xl mx-auto space-y-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 max-w-xl">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-amber-400" />)}
            </div>
            <h3 className="text-2xl font-black text-white leading-tight">Von Softwarehäusern & Startups weltweit geschätzt</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              "DB Studio Pro hat unseren MVP-Prozess um 80% beschleunigt. Wir entwerfen die Datenstrukturen in Workshops zusammen mit Kunden und drücken am Ende einfach auf Download, um mit dem Backend-Dev-Team loszulegen."
            </p>
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 border border-slate-700">
                M.S.
              </div>
              <div>
                <span className="block text-xs font-bold text-white">Markus Schütz</span>
                <span className="block text-[10px] text-slate-400">CTO, DevCore Solution GmbH</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 w-full md:w-80 shadow-lg">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Erhöhe die Conversion Rate</h4>
            <div className="space-y-2 text-xs">
              <div className="flex gap-2 items-center text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Interaktiver pitchbarer Showcase</span>
              </div>
              <div className="flex gap-2 items-center text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Client-spezifischer Export</span>
              </div>
              <div className="flex gap-2 items-center text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>100% responsive auf jedem Device</span>
              </div>
              <div className="flex gap-2 items-center text-slate-300">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Einsparung von Onboarding-Kosten</span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('table_create')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
            >
              Jetzt Studio öffnen!
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 DB Studio Pro Inc. Alle Rechte vorbehalten. Visuelle Softwareentwicklung der Zukunft.
          </div>
          <div className="flex gap-4">
            <a href="#interactive-showroom" className="hover:text-slate-300 transition-colors">Spezifikation</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors flex items-center gap-1">GitHub <ExternalLink size={10} /></a>
          </div>
        </div>

      </div>
    </div>
  );
};
