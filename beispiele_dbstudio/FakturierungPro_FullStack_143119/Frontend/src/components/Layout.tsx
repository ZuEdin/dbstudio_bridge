import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Menu, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isTopNav = false;
    const menuItems: any[] = [];

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isTopNav={isTopNav} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white shrink-0">
                            <Menu size={20} />
                        </button>
                        
                        <span className="font-bold text-base dark:text-white flex items-center gap-2 mr-4 shrink-0">
                            <span>FakturierungPro</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full font-mono font-bold hidden md:inline">STRG+K</span>
                        </span>

                        {isTopNav && (
                            <div className="hidden lg:block overflow-x-auto">
                                <TopNav items={menuItems} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer font-semibold shadow-sm text-slate-600"
                        >
                            <Command size={12} />
                            <span>Suche</span>
                        </button>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </div>
            </main>

            {/* Generated Command Palette */}
            <CommandPalette />
        </div>
    );
};