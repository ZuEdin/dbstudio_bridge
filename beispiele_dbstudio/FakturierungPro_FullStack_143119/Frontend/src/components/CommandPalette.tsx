import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    // Get flat list of available pages
    const items: any[] = [];
    const flat: any[] = [];
    const recurse = (list: any[]) => {
        list.forEach(i => {
            if (i.type === 'page') flat.push(i);
            if (i.children) recurse(i.children);
        });
    };
    recurse(items);

    const filtered = flat.filter(f => 
        f.title.toLowerCase().includes(search.toLowerCase()) || 
        f.route.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 text-slate-800">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <Search className="text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Schnellsuche (Seiten, Formulare, Tabellen)..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-white outline-none"
                        autoFocus
                    />
                    <kbd className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded">ESC</kbd>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">Keine Resultate für "{search}"</div>
                    ) : (
                        filtered.map(f => (
                            <button
                                key={f.id}
                                onClick={() => {
                                    navigate(f.route);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                            >
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{f.title}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{f.route}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};