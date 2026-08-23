
import React, { useState } from 'react';
import { WhitelabelConfig, MultiTenancyConfig, LicensingConfig } from '../../types/index';
import { X, Save, Palette, Users, Key, Briefcase, Database, Code } from 'lucide-react';

interface WhitelabelModalProps {
  whitelabel: WhitelabelConfig | undefined;
  multiTenancy: MultiTenancyConfig | undefined;
  licensing: LicensingConfig | undefined;
  onSave: (w: WhitelabelConfig, m: MultiTenancyConfig, l: LicensingConfig) => void;
  onClose: () => void;
}

export const WhitelabelModal: React.FC<WhitelabelModalProps> = ({ whitelabel, multiTenancy, licensing, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'tenancy' | 'license' | 'css'>('branding');

  // Local State
  const [wlConfig, setWlConfig] = useState<WhitelabelConfig>(() => {
      const defaultWl = {
          appName: 'My App',
          companyName: 'My Company',
          primaryColor: '#3b82f6',
          secondaryColor: '#1e293b',
          accentColor: '#f59e0b',
          successColor: '#10b981',
          warningColor: '#f59e0b',
          errorColor: '#ef4444',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: 'md' as const,
          elevation: 'sm' as const,
          darkModeColors: {
              primary: '#3b82f6',
              secondary: '#1e293b',
              background: '#0f172a'
          },
          removeBranding: true
      };
      if (!whitelabel) return defaultWl;
      return {
          ...defaultWl,
          ...whitelabel,
          darkModeColors: {
              ...defaultWl.darkModeColors,
              ...(whitelabel.darkModeColors || {})
          }
      };
  });

  const [mtConfig, setMtConfig] = useState<MultiTenancyConfig>(multiTenancy || {
      enabled: false,
      strategy: 'discriminator',
      tenantField: 'TenantId'
  });

  const [licConfig, setLicConfig] = useState<LicensingConfig>(licensing || {
      enabled: false,
      validateOnline: false,
      licenseKey: ''
  });

  const handleSave = () => {
      onSave(wlConfig, mtConfig, licConfig);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-slate-300 flex flex-col h-[650px] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-indigo-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
               <Briefcase size={24} className="text-yellow-400"/> Whitelabeling & Branding
            </h2>
            <p className="text-indigo-200 text-sm mt-1">Konfigurieren Sie die kommerziellen Aspekte Ihrer generierten App.</p>
          </div>
          <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('branding')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'branding' ? 'bg-white shadow text-indigo-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Palette size={18} /> Branding (Whitelabel)
                </button>
                <button 
                    onClick={() => setActiveTab('tenancy')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'tenancy' ? 'bg-white shadow text-indigo-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Users size={18} /> Mandantenfähigkeit
                </button>
                <button 
                    onClick={() => setActiveTab('license')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'license' ? 'bg-white shadow text-indigo-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Key size={18} /> Lizenzierung
                </button>
                <button 
                    onClick={() => setActiveTab('css')}
                    className={`w-full text-left p-3 rounded flex items-center gap-3 transition-colors ${activeTab === 'css' ? 'bg-white shadow text-indigo-600 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                    <Code size={18} /> Design System (CSS)
                </button>
            </div>

            <div className="flex-1 p-8 overflow-y-auto bg-white">
                
                {/* BRANDING TAB */}
                {activeTab === 'branding' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded text-sm text-indigo-800">
                            Entfernen Sie jeglichen Bezug zu "DB Studio Pro" und verwenden Sie Ihr eigenes Corporate Identity.
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">App Name</label>
                                <input 
                                    type="text" 
                                    value={wlConfig.appName}
                                    onChange={e => setWlConfig({...wlConfig, appName: e.target.value})}
                                    className="w-full border p-2 rounded"
                                    placeholder="Mein CRM"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Firmenname (Footer)</label>
                                <input 
                                    type="text" 
                                    value={wlConfig.companyName}
                                    onChange={e => setWlConfig({...wlConfig, companyName: e.target.value})}
                                    className="w-full border p-2 rounded"
                                    placeholder="ACME Corp."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Primärfarbe (Header/Buttons)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={wlConfig.primaryColor}
                                        onChange={e => setWlConfig({...wlConfig, primaryColor: e.target.value})}
                                        className="h-10 w-10 p-0 border rounded cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={wlConfig.primaryColor}
                                        onChange={e => setWlConfig({...wlConfig, primaryColor: e.target.value})}
                                        className="flex-1 border p-2 rounded font-mono"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Sekundärfarbe (Sidebar/Menü)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={wlConfig.secondaryColor}
                                        onChange={e => setWlConfig({...wlConfig, secondaryColor: e.target.value})}
                                        className="h-10 w-10 p-0 border rounded cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={wlConfig.secondaryColor}
                                        onChange={e => setWlConfig({...wlConfig, secondaryColor: e.target.value})}
                                        className="flex-1 border p-2 rounded font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Akzent- & Systemfarben */}
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                Erweiterte Farben & System-Statusfarben
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Akzentfarbe (Auswahl/Links)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={wlConfig.accentColor || '#f59e0b'}
                                            onChange={e => setWlConfig({...wlConfig, accentColor: e.target.value})}
                                            className="h-9 w-9 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.accentColor || '#f59e0b'}
                                            onChange={e => setWlConfig({...wlConfig, accentColor: e.target.value})}
                                            className="flex-1 border p-1.5 text-sm rounded font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Erfolgsfarbe (Success/Aktiv)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={wlConfig.successColor || '#10b981'}
                                            onChange={e => setWlConfig({...wlConfig, successColor: e.target.value})}
                                            className="h-9 w-9 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.successColor || '#10b981'}
                                            onChange={e => setWlConfig({...wlConfig, successColor: e.target.value})}
                                            className="flex-1 border p-1.5 text-sm rounded font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Warnfarbe (Hinweise/Ausstehend)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={wlConfig.warningColor || '#f59e0b'}
                                            onChange={e => setWlConfig({...wlConfig, warningColor: e.target.value})}
                                            className="h-9 w-9 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.warningColor || '#f59e0b'}
                                            onChange={e => setWlConfig({...wlConfig, warningColor: e.target.value})}
                                            className="flex-1 border p-1.5 text-sm rounded font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Fehlerfarbe (Error/Ungültig)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={wlConfig.errorColor || '#ef4444'}
                                            onChange={e => setWlConfig({...wlConfig, errorColor: e.target.value})}
                                            className="h-9 w-9 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.errorColor || '#ef4444'}
                                            onChange={e => setWlConfig({...wlConfig, errorColor: e.target.value})}
                                            className="flex-1 border p-1.5 text-sm rounded font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout & Element-Styling (Borders & Elevation) */}
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                Layout- & UI-Styling (Ecken, Schatten & Schriften)
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Eckenabrundung (Buttons/Cards)</label>
                                    <select 
                                        value={wlConfig.borderRadius || 'md'}
                                        onChange={e => setWlConfig({...wlConfig, borderRadius: e.target.value as any})}
                                        className="w-full border p-2 text-sm rounded bg-white"
                                    >
                                        <option value="none">Scharfkantig (0px)</option>
                                        <option value="sm">Subtil abgerundet (2px)</option>
                                        <option value="md">Standard abgerundet (4px)</option>
                                        <option value="lg">Stark abgerundet (8px)</option>
                                        <option value="full">Kreisförmig / Kapsel (9999px)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">UI-Schattenstärke (Elevation)</label>
                                    <select 
                                        value={wlConfig.elevation || 'sm'}
                                        onChange={e => setWlConfig({...wlConfig, elevation: e.target.value as any})}
                                        className="w-full border p-2 text-sm rounded bg-white"
                                    >
                                        <option value="none">Kein Schatten (Flat)</option>
                                        <option value="sm">Subtil (sm)</option>
                                        <option value="md">Mittel (md)</option>
                                        <option value="lg">Hoch (lg)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Haupt-Schriftart (Font Family)</label>
                                    <select 
                                        value={wlConfig.fontFamily || 'Inter, system-ui, sans-serif'}
                                        onChange={e => setWlConfig({...wlConfig, fontFamily: e.target.value})}
                                        className="w-full border p-2 text-sm rounded bg-white"
                                    >
                                        <option value="Inter, system-ui, sans-serif">Inter (Modern & Clean)</option>
                                        <option value="Space Grotesk, sans-serif">Space Grotesk (Tech-Forward)</option>
                                        <option value="JetBrains Mono, monospace">JetBrains Mono (Technical)</option>
                                        <option value="Playfair Display, serif">Playfair Display (Elegant)</option>
                                        <option value="system-ui, sans-serif">System Standard (Native)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Dark-Mode Farbpalette */}
                        <div className="border-t border-slate-100 pt-4">
                            <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                                Dark-Mode Farbpalette (Vorschau & Prototyping)
                            </h4>
                            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dark Primär</label>
                                    <div className="flex gap-1.5">
                                        <input 
                                            type="color" 
                                            value={wlConfig.darkModeColors?.primary || '#3b82f6'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    primary: e.target.value
                                                }
                                            })}
                                            className="h-8 w-8 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.darkModeColors?.primary || '#3b82f6'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    primary: e.target.value
                                                }
                                            })}
                                            className="flex-1 border p-1 text-xs rounded font-mono bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dark Sekundär</label>
                                    <div className="flex gap-1.5">
                                        <input 
                                            type="color" 
                                            value={wlConfig.darkModeColors?.secondary || '#1e293b'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    secondary: e.target.value
                                                }
                                            })}
                                            className="h-8 w-8 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.darkModeColors?.secondary || '#1e293b'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    secondary: e.target.value
                                                }
                                            })}
                                            className="flex-1 border p-1 text-xs rounded font-mono bg-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dark Hintergrund</label>
                                    <div className="flex gap-1.5">
                                        <input 
                                            type="color" 
                                            value={wlConfig.darkModeColors?.background || '#0f172a'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    background: e.target.value
                                                }
                                            })}
                                            className="h-8 w-8 p-0 border rounded cursor-pointer"
                                        />
                                        <input 
                                            type="text" 
                                            value={wlConfig.darkModeColors?.background || '#0f172a'}
                                            onChange={e => setWlConfig({
                                                ...wlConfig,
                                                darkModeColors: {
                                                    ...(wlConfig.darkModeColors || {}),
                                                    background: e.target.value
                                                }
                                            })}
                                            className="flex-1 border p-1 text-xs rounded font-mono bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Logo URL (Optional)</label>
                            <input 
                                type="text" 
                                value={wlConfig.logoUrl || ''}
                                onChange={e => setWlConfig({...wlConfig, logoUrl: e.target.value})}
                                className="w-full border p-2 rounded text-sm"
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded border border-slate-200">
                            <input 
                                type="checkbox" 
                                checked={wlConfig.removeBranding || false}
                                onChange={e => setWlConfig({...wlConfig, removeBranding: e.target.checked})}
                                className="rounded text-indigo-600"
                            />
                            <span className="text-sm font-bold text-slate-700">"Generated by DB Studio Pro" entfernen</span>
                        </label>
                    </div>
                )}

                {/* TENANCY TAB */}
                {activeTab === 'tenancy' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800">
                            <strong>Multi-Tenancy (SaaS):</strong> Trennen Sie Kundendaten strikt voneinander.
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={mtConfig.enabled || false}
                                    onChange={e => setMtConfig({...mtConfig, enabled: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </div>
                            <span className="font-bold text-slate-800">Mandantenfähigkeit aktivieren</span>
                        </label>

                        {mtConfig.enabled && (
                            <div className="space-y-4 pl-4 border-l-4 border-indigo-200">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Strategie</label>
                                    <select 
                                        className="w-full border p-2 rounded bg-white"
                                        value={mtConfig.strategy}
                                        onChange={e => setMtConfig({...mtConfig, strategy: e.target.value as any})}
                                    >
                                        <option value="discriminator">Discriminator Column (Gemeinsame DB)</option>
                                        <option value="database">Database per Tenant (Isolierte DBs)</option>
                                    </select>
                                    
                                    {mtConfig.strategy === 'discriminator' ? (
                                        <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
                                            Jede Tabelle erhält eine Spalte <code>{mtConfig.tenantField}</code>. Alle Kunden teilen sich eine Datenbank. Günstig und einfach zu warten.
                                        </div>
                                    ) : (
                                        <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 flex gap-2">
                                            <Database size={16} className="shrink-0"/>
                                            <div>
                                                <strong>Höchste Isolation:</strong> Jeder Kunde hat eine eigene Datenbank.
                                                <br/>Das Backend wählt die Verbindung basierend auf der Tenant-ID dynamisch: 
                                                <br/><code>DB_Name</code> &rarr; <code>DB_Name_{"{TenantId}"}</code>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {mtConfig.strategy === 'discriminator' && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Feldname</label>
                                        <input 
                                            type="text" 
                                            value={mtConfig.tenantField || ''}
                                            onChange={e => setMtConfig({...mtConfig, tenantField: e.target.value})}
                                            className="w-full border p-2 rounded font-mono"
                                            placeholder="TenantId"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* LICENSE TAB */}
                {activeTab === 'license' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded text-sm text-slate-600">
                            Schützen Sie die generierte App vor unbefugter Nutzung (Kopierschutz).
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={licConfig.enabled || false}
                                onChange={e => setLicConfig({...licConfig, enabled: e.target.checked})}
                                className="rounded text-indigo-600"
                            />
                            <span className="font-bold text-slate-700">Lizenzprüfung im Backend aktivieren</span>
                        </label>

                        {licConfig.enabled && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Initialer Lizenzschlüssel</label>
                                    <input 
                                        type="text" 
                                        value={licConfig.licenseKey || ''}
                                        onChange={e => setLicConfig({...licConfig, licenseKey: e.target.value})}
                                        className="w-full border p-2 rounded font-mono text-sm"
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Dieser Schlüssel wird in die <code>appsettings.json</code> oder <code>.env</code> geschrieben.</p>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={licConfig.validateOnline || false}
                                        onChange={e => setLicConfig({...licConfig, validateOnline: e.target.checked})}
                                        className="rounded text-indigo-600"
                                    />
                                    <span className="text-sm text-slate-700">Online-Validierung (Call Home)</span>
                                </label>
                            </div>
                        )}
                    </div>
                )}

                {/* CSS TAB */}
                {activeTab === 'css' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded text-sm text-slate-600">
                            Binden Sie Ihr eigenes Design-System (z. B. Bootstrap) oder eigene CSS-Regeln ein, damit das Prototyping mit Ihrem Corporate Design übereinstimmt.
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded border border-slate-200">
                            <input 
                                type="checkbox" 
                                checked={wlConfig.useBootstrap || false}
                                onChange={e => setWlConfig({...wlConfig, useBootstrap: e.target.checked})}
                                className="rounded text-indigo-600"
                            />
                            <span className="font-bold text-slate-700">Bootstrap (CDN) global laden</span>
                        </label>
                        {wlConfig.useBootstrap && (
                            <p className="text-xs text-slate-500 ml-8 -mt-4">Läd Bootstrap 5 via CDN, damit Sie Bootstrap-Klassen in den Custom-Views verwenden können.</p>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Custom NPM Packages</label>
                            <p className="text-xs text-slate-500 mb-2">Kommagetrennte Liste von NPM-Paketen, die beim Start der generierten App automatisch mitinstalliert werden sollen (z.B. <code>@mycompany/design-system, lodash</code>).</p>
                            <input 
                                type="text"
                                value={wlConfig.customNpmPackages || ''}
                                onChange={e => setWlConfig({...wlConfig, customNpmPackages: e.target.value})}
                                className="w-full border p-2 rounded font-mono text-sm"
                                placeholder="@mycompany/ui, moment"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Custom CSS Injection</label>
                            <p className="text-xs text-slate-500 mb-2">Dieses CSS wird dynamisch in das DB Studio und die generierte App injiziert. Sie können Tailwind-Klassen überschreiben oder eigene verwenden.</p>
                            <textarea 
                                value={wlConfig.customCss || ''}
                                onChange={e => setWlConfig({...wlConfig, customCss: e.target.value})}
                                className="w-full h-64 border p-3 rounded font-mono text-sm bg-slate-800 text-green-400"
                                placeholder=".my-custom-btn {&#10;  background-color: var(--primary);&#10;  border-radius: 8px;&#10;}"
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 bg-slate-50 border-t border-slate-200 shrink-0">
          <button onClick={onClose} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Abbrechen
          </button>
          <button onClick={handleSave} className="bg-indigo-900 hover:bg-black text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
            <Save size={18} /> Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
