
import React, { useState, useEffect } from 'react';
import { X, User, Search, Check, Loader2, ShieldAlert, Terminal } from 'lucide-react';
import { getApiUrl } from '../../../stores/useConfigStore';

interface AdUser {
    username: string;
    displayName: string;
    email: string;
    department?: string;
    groups?: string[];
}

interface UserPickerModalProps {
    initialTab?: 'me' | 'search';
    onSelect: (username: string, displayName: string) => void;
    onClose: () => void;
}

export const UserPickerModal: React.FC<UserPickerModalProps> = ({ initialTab = 'me', onSelect, onClose }) => {
    const [activeTab, setActiveTab] = useState<'me' | 'search'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // WhoAmI State
    const [me, setMe] = useState<AdUser | null>(null);

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AdUser[]>([]);

    useEffect(() => {
        if (activeTab === 'me') loadMe();
    }, [activeTab]);

    // Robust Helper to find property value regardless of casing (username, UserName, USERNAME)
    const getPropCaseInsensitive = (obj: any, candidates: string[]) => {
        if (!obj) return null;
        const keys = Object.keys(obj);
        for (const candidate of candidates) {
            // Direct match
            if (obj[candidate] !== undefined) return obj[candidate];
            // Case insensitive match
            const foundKey = keys.find(k => k.toLowerCase() === candidate.toLowerCase());
            if (foundKey) return obj[foundKey];
        }
        return null;
    };

    const normalizeUser = (item: any): AdUser => {
        console.log("Processing User Item:", item); // DEBUG LOG
        return {
            username: getPropCaseInsensitive(item, ['username', 'userName', 'samAccountName', 'id']) || 'Unbekannt',
            displayName: getPropCaseInsensitive(item, ['displayName', 'name', 'fullName']) || 'Unbekannter Name',
            email: getPropCaseInsensitive(item, ['email', 'mail', 'emailAddress']) || '',
            department: getPropCaseInsensitive(item, ['department', 'dept']) || '',
            groups: item.groups || item.Groups || []
        };
    };

    const loadMe = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching /api/ad/me...");
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            const res = await fetch(getApiUrl('/api/ad/me'), { 
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
                credentials: 'include' 
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                console.log("API Response (ME):", data);
                setMe(normalizeUser(data));
            } else {
                console.warn("API Error:", res.status, res.statusText);
                throw new Error(`Fehler: ${res.status}`);
            }
        } catch (e) {
            const err = e as Error;
            console.error("LoadMe Exception:", err);
            
            // Fallback for Preview if API fails
            setMe({
                username: 'preview.user',
                displayName: 'Vorschau User (API Fehler)',
                email: 'debug@local',
                department: 'Debug Mode',
                groups: []
            });
            setError(`Konnte Benutzer nicht laden: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!query || query.length < 2) return;
        setLoading(true);
        setError(null);
        try {
            console.log(`Searching /api/ad/search?q=${query}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const res = await fetch(getApiUrl(`/api/ad/search?q=${query}`), {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const rawData = await res.json();
                console.log("API Response (Search):", rawData);
                
                // Handle different array structures (pure array or { data: [] })
                const arr = Array.isArray(rawData) ? rawData : (rawData.data || []);
                
                if (Array.isArray(arr)) {
                    setResults(arr.map(normalizeUser));
                } else {
                    console.error("Data is not an array:", rawData);
                    setResults([]);
                }
            } else {
                throw new Error(`Backend Error ${res.status}`);
            }
        } catch (e) {
            const err = e as Error;
            console.error("Search Exception:", err);
            setError("Suche fehlgeschlagen. Prüfen Sie die Konsole (F12).");
            
            // Fallback Mock data so UI isn't empty during dev
            setResults([
               { username: 'mock.user', displayName: 'Mock User (Fallback)', email: 'mock@test.com', department: 'Test' } 
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[250] flex items-center justify-center animate-in fade-in-25 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden flex flex-col h-[500px]">
                
                {/* Header */}
                <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
                    <h3 className="font-bold flex items-center gap-2">
                        <User className="text-blue-400" size={20}/> Benutzer auswählen
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('me')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'me' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Aktueller User
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'search' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                        Suchen
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-50 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-10">
                            <Loader2 className="animate-spin text-blue-600 mb-2" size={32}/>
                            <span className="text-sm font-semibold text-slate-600">Lade Daten...</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-800 rounded text-xs flex items-center gap-2">
                            <ShieldAlert size={16} className="shrink-0"/> 
                            <span>{error}</span>
                        </div>
                    )}

                    {activeTab === 'me' && me && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner">
                                {me.displayName ? me.displayName.substring(0,2).toUpperCase() : '?'}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-800">{me.displayName}</h4>
                                <p className="text-slate-500 text-sm font-mono">{me.username}</p>
                                <p className="text-slate-400 text-xs mt-1">{me.email}</p>
                            </div>
                            <div className="bg-white border p-3 rounded w-full text-left text-xs text-slate-600 space-y-1">
                                <p><strong>Abteilung:</strong> {me.department || '-'}</p>
                                <p><strong>Gruppen:</strong> {me.groups?.join(', ') || '-'}</p>
                            </div>
                            <button 
                                onClick={() => onSelect(me.username, me.displayName)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm mt-4"
                            >
                                <Check size={18}/> Als "{me.username}" übernehmen
                            </button>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="h-full flex flex-col">
                            <div className="flex gap-2 mb-4">
                                <input 
                                    type="text" 
                                    className="flex-1 border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Name oder Kürzel..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    autoFocus
                                />
                                <button onClick={handleSearch} className="bg-slate-700 text-white px-4 rounded hover:bg-slate-800">
                                    <Search size={18}/>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto space-y-2 border border-slate-200 rounded bg-white min-h-[200px]">
                                {results.length > 0 ? results.map((u, idx) => (
                                    <div key={`${u.username}-${idx}`} className="p-3 hover:bg-blue-50 border-b border-slate-100 last:border-0 flex justify-between items-center group cursor-pointer" onClick={() => onSelect(u.username, u.displayName)}>
                                        <div>
                                            <div className="font-bold text-slate-700 text-sm">{u.displayName}</div>
                                            <div className="text-xs text-slate-500 font-mono">{u.username}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-slate-400">{u.department}</div>
                                            <button className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100">Wählen</button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        {query ? 'Keine Treffer.' : 'Bitte Suchbegriff eingeben.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
