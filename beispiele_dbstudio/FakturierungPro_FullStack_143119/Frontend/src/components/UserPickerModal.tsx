import React, { useState, useEffect } from 'react';
import { X, User, Search, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AdUser {
    username: string;
    displayName: string;
    email: string;
    department?: string;
    groups?: string[];
}

interface UserPickerModalProps {
    isOpen: boolean;
    initialTab?: 'me' | 'search';
    onSelect: (username: string, displayName: string) => void;
    onClose: () => void;
}

export const UserPickerModal: React.FC<UserPickerModalProps> = ({ isOpen, initialTab = 'me', onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'search'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [me, setMe] = useState<AdUser | null>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdUser[]>([]);

    useEffect(() => {
        if (isOpen && activeTab === 'me') loadMe();
    }, [isOpen, activeTab]);

    const loadMe = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/ad/me');
            const userData = (res as any).data || res;
            setMe(userData);
        } catch (e) {
            console.warn(e);
            setError("Konnte Benutzer nicht laden.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/ad/search?q=${query}`);
            const searchData = (res as any).data || res;
            setResults(Array.isArray(searchData) ? searchData : []);
        } catch (e) {
            setError("Suche fehlgeschlagen.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex items-center gap-2"><User size={20}/> Benutzer auswählen</h3>
                    <button onClick={onClose}><X size={20}/></button>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <button onClick={() => setActiveTab('me')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'me' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Aktueller User</button>
                    <button onClick={() => setActiveTab('search')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'search' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>Suchen</button>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 relative">
                    {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"><Loader2 className="animate-spin text-blue-600" size={32}/></div>}
                    {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-xs">{error}</div>}
                    
                    {activeTab === 'me' && me && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">{me.displayName?.substring(0,2).toUpperCase()}</div>
                            <div><h4 className="text-xl font-bold dark:text-white">{me.displayName}</h4><p className="text-slate-500 text-sm font-mono">{me.username}</p></div>
                            <button onClick={() => onSelect(me.username, me.displayName)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4"><Check size={18}/> Als "{me.username}" übernehmen</button>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="h-full flex flex-col">
                            <div className="flex gap-2 mb-4">
                                <input type="text" className="flex-1 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm dark:bg-slate-800 dark:text-white" placeholder="Name..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} autoFocus />
                                <button onClick={handleSearch} className="bg-slate-700 text-white px-4 rounded hover:bg-slate-800"><Search size={18}/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {results.map((u) => (
                                    <div key={u.username} className="p-3 hover:bg-blue-50 dark:hover:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center cursor-pointer" onClick={() => onSelect(u.username, u.displayName)}>
                                        <div><div className="font-bold text-sm dark:text-white">{u.displayName}</div><div className="text-xs text-slate-500 font-mono">{u.username}</div></div>
                                        <button className="text-blue-600 dark:text-blue-400 text-xs font-bold">Wählen</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};