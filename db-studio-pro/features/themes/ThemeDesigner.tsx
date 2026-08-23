import React, { useState } from 'react';
import { Palette, CheckCircle, Image as ImageIcon, Type } from 'lucide-react';
import { BackendConfig, WhitelabelConfig } from '../../types/index';

interface ThemeDesignerProps {
    config: BackendConfig;
    onUpdateConfig: (config: BackendConfig) => void;
    showMessage: (titleOrMsg: string, message?: string, type?: any) => void;
}

export const ThemeDesigner: React.FC<ThemeDesignerProps> = ({ config, onUpdateConfig, showMessage }) => {
    const defaultWhitelabel: WhitelabelConfig = {
        appName: config.projectName || 'My App',
        companyName: 'My Company',
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
    };

    const whitelabel = config.whitelabel || defaultWhitelabel;

    const handleChange = (field: keyof WhitelabelConfig, value: string) => {
        onUpdateConfig({
            ...config,
            whitelabel: {
                ...whitelabel,
                [field]: value
            }
        });
    };

    const handleSave = () => {
        showMessage('Theme settings saved successfully');
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50 relative overflow-hidden">
            <div className="bg-slate-800 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Palette className="text-pink-400" size={24} />
                    <h2 className="text-xl font-semibold m-0">Theme & Branding (Whitelabeling)</h2>
                </div>
                <div>
                     <button
                        onClick={handleSave}
                        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-medium transition-colors"
                     >
                        <CheckCircle size={16} /> 
                        Speichern
                     </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <Type size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800 m-0">General Branding</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">App Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={whitelabel.appName}
                                        onChange={e => handleChange('appName', e.target.value)}
                                        placeholder="e.g. My Awesome CRM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={whitelabel.companyName}
                                        onChange={e => handleChange('companyName', e.target.value)}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
                                    <select 
                                        className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={whitelabel.fontFamily || 'Inter'}
                                        onChange={e => handleChange('fontFamily', e.target.value)}
                                    >
                                        <option value="Inter">Inter (Sans-Serif)</option>
                                        <option value="Roboto">Roboto (Sans-Serif)</option>
                                        <option value="Open Sans">Open Sans (Sans-Serif)</option>
                                        <option value="Merriweather">Merriweather (Serif)</option>
                                        <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <Palette size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800 m-0">Color Palette</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={whitelabel.primaryColor || '#3b82f6'}
                                            onChange={e => handleChange('primaryColor', e.target.value)}
                                            className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={whitelabel.primaryColor || '#3b82f6'}
                                            onChange={e => handleChange('primaryColor', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-2 text-sm uppercase font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={whitelabel.secondaryColor || '#64748b'}
                                            onChange={e => handleChange('secondaryColor', e.target.value)}
                                            className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={whitelabel.secondaryColor || '#64748b'}
                                            onChange={e => handleChange('secondaryColor', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-2 text-sm uppercase font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={whitelabel.accentColor || '#ec4899'}
                                            onChange={e => handleChange('accentColor', e.target.value)}
                                            className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={whitelabel.accentColor || '#ec4899'}
                                            onChange={e => handleChange('accentColor', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-2 text-sm uppercase font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Success Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={whitelabel.successColor || '#22c55e'}
                                            onChange={e => handleChange('successColor', e.target.value)}
                                            className="w-10 h-10 border-0 rounded cursor-pointer p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={whitelabel.successColor || '#22c55e'}
                                            onChange={e => handleChange('successColor', e.target.value)}
                                            className="w-full border border-slate-300 rounded p-2 text-sm uppercase font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                         <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
                            <ImageIcon size={18} className="text-slate-500" />
                            <h3 className="font-semibold text-slate-800 m-0">Logo & Assets</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 rounded p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={whitelabel.logoUrl || ''}
                                    onChange={e => handleChange('logoUrl', e.target.value)}
                                    placeholder="https://example.com/logo.png"
                                />
                                {whitelabel.logoUrl && (
                                    <div className="mt-3 p-4 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center">
                                        <img src={whitelabel.logoUrl} alt="Logo preview" className="max-h-20" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
