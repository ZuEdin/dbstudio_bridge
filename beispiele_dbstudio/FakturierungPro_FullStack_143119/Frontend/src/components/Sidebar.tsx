import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database, Moon, Sun, X, Menu, LogOut, Shield, User, PieChart, Home, Calendar, Globe, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useTheme } from './theme-provider';


export const Sidebar = ({ isOpen, onClose, isTopNav }: { isOpen: boolean; onClose: () => void; isTopNav?: boolean }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  const [tablesOpen, setTablesOpen] = useState(false);
  const [queriesOpen, setQueriesOpen] = useState(false);
  
  
  const isActive = (path: string) => location.pathname.startsWith(path) ? 'bg-[#3b82f6] text-white shadow-lg font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  const getLabel = (item: any) => {
    return item.translations?.[lang] || item.title;
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'de' ? 'en' : lang === 'en' ? 'fr' : 'de';
    localStorage.setItem('app_lang', nextLang);
    setLang(nextLang);
  };

  const isDoubleRail = false;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      <aside className={`fixed inset-y-0 left-0 z-50 ${isDoubleRail ? 'w-72' : 'w-64'} bg-[#1e293b] text-slate-100 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : (isTopNav ? '-translate-x-full' : '-translate-x-full lg:translate-x-0 lg:static')}`}>
        
        {/* Simple visual Double Rail ribbon effect decoration */}
        {isDoubleRail && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-black/15 flex flex-col items-center py-6 gap-6 border-r border-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20">
              <Database size={20} className="text-white"/>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/15" onClick={toggleLanguage}>
              <Globe size={18} className="text-slate-400" />
            </div>
          </div>
        )}

        <div className={`p-6 font-bold text-xl border-b border-white/10 flex items-center justify-between ${isDoubleRail ? 'pl-20' : ''}`}>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center shadow-lg"><Database size={18} className="text-white"/></div>
                <span>FakturierungPro</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400"><X size={20}/></button>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isDoubleRail ? 'pl-20' : ''}`}>
            
            {/* Forms */}
            
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Formulare</div>
                <div className="space-y-1">
                
                    <Link to="/forms/rechnungserfassungForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/rechnungserfassungForm')}`}>
                        <Layout size={16}/> Rechnungserfassung
                    </Link>

                    <Link to="/forms/rechnungspositionensubformForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/rechnungspositionensubformForm')}`}>
                        <Layout size={16}/> Rechnungspositionen Subform
                    </Link>

                    <Link to="/forms/angebotserfassungForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/angebotserfassungForm')}`}>
                        <Layout size={16}/> Angebotserfassung
                    </Link>

                    <Link to="/forms/angebotspositionensubformForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/angebotspositionensubformForm')}`}>
                        <Layout size={16}/> Angebotspositionen Subform
                    </Link>

                    <Link to="/forms/auftragserfassungForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/auftragserfassungForm')}`}>
                        <Layout size={16}/> Auftragserfassung
                    </Link>

                    <Link to="/forms/auftragspositionensubformForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/auftragspositionensubformForm')}`}>
                        <Layout size={16}/> Auftragspositionen Subform
                    </Link>

                    <Link to="/forms/mahnungserfassungForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/mahnungserfassungForm')}`}>
                        <Layout size={16}/> Mahnungserfassung
                    </Link>

                    <Link to="/forms/gutschrifterfassungForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/gutschrifterfassungForm')}`}>
                        <Layout size={16}/> Gutschrifterfassung
                    </Link>

                    <Link to="/forms/gutschriftpositionensubformForm/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/forms/gutschriftpositionensubformForm')}`}>
                        <Layout size={16}/> Gutschriftpositionen Subform
                    </Link>
                </div>
            </div>
            

            {/* Custom Pages */}
            

            {/* Reports */}
            
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Berichte</div>
                <div className="space-y-1">
                
                    <Link to="/reports/rechnungsjournalUmsaetze" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/reports/rechnungsjournalUmsaetze')}`}>
                        <FileText size={16}/> Rechnungsjournal & Umsätze
                    </Link>
                </div>
            </div>
            

            {/* Tables */}
            
            <div>
                <button 
                    type="button" 
                    onClick={() => setTablesOpen(!tablesOpen)} 
                    className="w-full px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between hover:text-white transition"
                >
                    <span className="flex items-center gap-2"><Table size={14}/> Tabellen (11)</span>
                    {tablesOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {tablesOpen && (
                    <div className="space-y-1 pl-2 border-l border-slate-700/50 ml-3">
                    
                        <Link to="/kunden" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/kunden')}`}>
                            <Table size={16}/> Kunden
                        </Link>

                        <Link to="/artikel" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/artikel')}`}>
                            <Table size={16}/> Artikel
                        </Link>

                        <Link to="/angebote" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/angebote')}`}>
                            <Table size={16}/> Angebote
                        </Link>

                        <Link to="/angebotspositionen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/angebotspositionen')}`}>
                            <Table size={16}/> Angebotspositionen
                        </Link>

                        <Link to="/auftraege" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/auftraege')}`}>
                            <Table size={16}/> Auftraege
                        </Link>

                        <Link to="/auftragspositionen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/auftragspositionen')}`}>
                            <Table size={16}/> Auftragspositionen
                        </Link>

                        <Link to="/rechnungen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/rechnungen')}`}>
                            <Table size={16}/> Rechnungen
                        </Link>

                        <Link to="/rechnungspositionen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/rechnungspositionen')}`}>
                            <Table size={16}/> Rechnungspositionen
                        </Link>

                        <Link to="/mahnungen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/mahnungen')}`}>
                            <Table size={16}/> Mahnungen
                        </Link>

                        <Link to="/gutschriften" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/gutschriften')}`}>
                            <Table size={16}/> Gutschriften
                        </Link>

                        <Link to="/gutschriftpositionen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/gutschriftpositionen')}`}>
                            <Table size={16}/> Gutschriftpositionen
                        </Link>
                    </div>
                )}
            </div>
            
            
            {/* Queries */}
            
            <div>
                <button 
                    type="button" 
                    onClick={() => setQueriesOpen(!queriesOpen)} 
                    className="w-full px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between hover:text-white transition"
                >
                    <span className="flex items-center gap-2"><Search size={14}/> Abfragen (1)</span>
                    {queriesOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {queriesOpen && (
                    <div className="space-y-1 pl-2 border-l border-slate-700/50 ml-3">
                    
                        <Link to="/queries/offeneRechnungenMahnstufen" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/queries/offeneRechnungenMahnstufen')}`}>
                            <Search size={16}/> Offene Rechnungen & Mahnstufen
                        </Link>
                    </div>
                )}
            </div>
            
      
        </div>

        <div className={`p-4 border-t border-white/10 text-center space-y-2 ${isDoubleRail ? 'pl-20' : ''}`}>
            
            
            <div className="grid grid-cols-2 gap-1">
              <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors"
                  title="Design anpassen"
              >
                  {theme === 'dark' ? <><Sun size={12} /> Light</> : <><Moon size={12} /> Dark</>}
              </button>
              
              <button 
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors uppercase"
                  title="Sprache wechseln"
              >
                  <Globe size={12} />
                  <span>{lang}</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 flex items-center justify-center gap-1">
                <span>&copy; My Company</span>
                <span className="font-bold underline cursor-pointer" onClick={() => (window as any).dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>Strg+K</span>
            </div>
        </div>
      </aside>
    </>
  );
};