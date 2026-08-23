import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Kunden } from '../../types';
import { get, remove } from '../../services/api';
import { Trash2, Plus, Edit, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Eye } from 'lucide-react';
import { MarkdownViewer } from '../../components/common/MarkdownViewer';

export const KundenList = () => {
  const [data, setData] = useState<{ data: Kunden[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<any | null>(null);
  const [massDeleteOpen, setMassDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Double-click Detail modal and single-select keyboard selection states
  const [activeRecord, setActiveRecord] = useState<Kunden | null>(null);
  
  const [showDetail, setShowDetail] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Kunden | null>(null);
  


  // Sorting & Filtering states
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => { setPage(1); }, [searchTerm]);
  useEffect(() => { loadItems(); }, [searchTerm, page]);

  // Global keydown listener for Enter key triggers
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && activeRecord) {
        e.preventDefault();
        setDetailRecord(activeRecord);
        setShowDetail(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeRecord]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const params: any = { page: page, pageSize: 20 };
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await get<Kunden>('Kunden', params);
      setData(res as any);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: any) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(`Kunden/${deleteId}`);
      setDeleteId(null);
      loadItems();
    }
  };

  const getRowStyle = (item: any) => {
      const rules: any[] = [];
      for(const r of rules) {
          if(!r.propName) continue;
          const val = String(item[r.propName]);
          if(r.operator === 'eq' && val === r.value) return r.style;
          if(r.operator === 'neq' && val !== r.value) return r.style;
          if(r.operator === 'contains' && val.includes(r.value)) return r.style;
          if(r.operator === 'gt' && Number(val) > Number(r.value)) return r.style;
          if(r.operator === 'lt' && Number(val) < Number(r.value)) return r.style;
      }
      return {};
  };

  const handleMassDelete = async () => {
      if(selectedIds.length === 0) return;
      setMassDeleteOpen(true);
  };
  
  const confirmMassDelete = async () => {
      for(const id of selectedIds) {
          await remove('Kunden/' + id);
      }
      setSelectedIds([]);
      setMassDeleteOpen(false);
      loadItems();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortField(null);
        setSortDir(null);
      }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Memoized local processing of items (local filtering and sorting)
  const processedItems = React.useMemo(() => {
    let items = [...data.data];
    
    // Apply column filters
    Object.keys(columnFilters).forEach(key => {
      const filterVal = columnFilters[key].toLowerCase().trim();
      if (filterVal) {
        const searchTerms = filterVal.split(/\s+/).filter(Boolean);
        items = items.filter(item => {
          const val = item[key as keyof Kunden];
          if (val === undefined || val === null) return false;
          const cellStr = String(val).toLowerCase();
          return searchTerms.every(term => cellStr.includes(term));
        });
      }
    });

    // Apply sorting
    if (sortField && sortDir) {
      items.sort((a, b) => {
        const valA = a[sortField as keyof Kunden];
        const valB = b[sortField as keyof Kunden];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
          comparison = (valA ? 1 : 0) - (valB ? 1 : 0);
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortDir === 'asc' ? comparison : -comparison;
      });
    }

    return items;
  }, [data.data, columnFilters, sortField, sortDir]);

  return (
    <div className="p-8 max-w-[95%] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">Kunden</h1>
          <div className="flex gap-4 w-full sm:w-auto">
              
              
              <button 
                  onClick={() => setShowFilterBar(prev => !prev)} 
                  className={`p-2 border rounded-lg flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition ${showFilterBar ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white'}`}
                  title="Spaltenfilter anzeigen/ausblenden"
              >
                  <Filter size={18}/>
                  <span className="hidden sm:inline">Filter</span>
              </button>

              <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-10 pr-4 py-2 border rounded-lg w-full bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <Link to="/kunden/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={18}/> <span className="hidden sm:inline">Neu anlegen</span>
              </Link>
          </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                    <tr>
                        
                        <th className="p-4 w-12 text-center text-slate-400" title="Datensatz auswählen (Enter für Details)">Auswahl</th>
                        
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('id')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Id</span>
                                {sortField === 'id' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('kundenNr')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>KundenNr</span>
                                {sortField === 'kundenNr' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('firmenname')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Firmenname</span>
                                {sortField === 'firmenname' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('ansprechpartner')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Ansprechpartner</span>
                                {sortField === 'ansprechpartner' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('email')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Email</span>
                                {sortField === 'email' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('telefon')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Telefon</span>
                                {sortField === 'telefon' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('strasse')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Strasse</span>
                                {sortField === 'strasse' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('plz')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>plz</span>
                                {sortField === 'plz' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('ort')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Ort</span>
                                {sortField === 'ort' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('uStIdNr')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>UStIdNr</span>
                                {sortField === 'uStIdNr' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('zahlungszielTage')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>ZahlungszielTage</span>
                                {sortField === 'zahlungszielTage' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                            <div className="flex items-center gap-1.5 select-none">
                                <span>Status</span>
                                {sortField === 'status' ? (
                                    sortDir === 'asc' ? <ArrowUp size={14} className="text-blue-500 shrink-0" /> : <ArrowDown size={14} className="text-blue-500 shrink-0" />
                                ) : (
                                    <ArrowUpDown size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />
                                )}
                            </div>
                        </th>
                        <th className="p-4 text-right">Aktionen</th>
                    </tr>
                    {showFilterBar && (
                        <tr className="bg-slate-100/50 dark:bg-slate-900/50 border-b dark:border-slate-700">
                            
                            <th className="p-2"></th>
                            
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['id'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'id': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['kundenNr'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'kundenNr': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['firmenname'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'firmenname': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['ansprechpartner'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'ansprechpartner': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['email'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'email': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['telefon'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'telefon': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['strasse'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'strasse': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['plz'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'plz': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['ort'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'ort': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['uStIdNr'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'uStIdNr': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['zahlungszielTage'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'zahlungszielTage': e.target.value })}
                                />
                            </th>
                            <th className="p-2">
                                <input 
                                    type="text"
                                    placeholder="Filtern..."
                                    className="w-full px-2 py-1 text-xs font-normal border rounded bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                    value={columnFilters['status'] || ''}
                                    onChange={e => setColumnFilters({ ...columnFilters, 'status': e.target.value })}
                                />
                            </th>
                            <th className="p-2 text-right">
                                {Object.keys(columnFilters).length > 0 && (
                                    <button onClick={() => setColumnFilters({})} className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center justify-end gap-1 ml-auto">
                                        <X size={12}/> Löschen
                                    </button>
                                )}
                            </th>
                        </tr>
                    )}
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {processedItems.length > 0 ? processedItems.map(i => (
                        <tr 
                            key={i.id} 
                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${activeRecord?.id === i.id ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''}`}
                            style={getRowStyle(i)}
                            onClick={() => setActiveRecord(i)}
                            onDoubleClick={() => { setDetailRecord(i); setShowDetail(true); }}
                            title="Doppelklick für Details, Einfacher Klick zur Auswahl (Enter für Details)"
                        >
                            
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={activeRecord?.id === i.id} 
                                    onChange={() => setActiveRecord(activeRecord?.id === i.id ? null : i)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                                />
                            </td>
                            <td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.id ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.kundenNr ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.firmenname ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.ansprechpartner ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.email ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.telefon ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.strasse ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.plz ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.ort ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.uStIdNr ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.zahlungszielTage ?? '')}</td><td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(i.status ?? '')}</td>
                            <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => { setDetailRecord(i); setShowDetail(true); }} className="p-2 text-slate-600 hover:bg-slate-50 rounded dark:hover:bg-slate-700" title="Details"><Eye size={16}/></button>
                                    <Link to={'/kunden/' + i.id} className="p-2 text-blue-600 hover:bg-blue-50 rounded dark:hover:bg-slate-700" title="Bearbeiten"><Edit size={16}/></Link>
                                    <button onClick={()=>handleDelete(i.id)} className="p-2 text-red-600 hover:bg-red-50 rounded dark:hover:bg-slate-700" title="Löschen"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={14} className="p-8 text-center text-slate-400 italic">Keine Einträge gefunden.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Seite <span className="font-bold">{data.page}</span> von <span className="font-bold">{data.totalPages}</span> ({data.total} Einträge)
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    disabled={data.page <= 1}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button 
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                    disabled={data.page >= data.totalPages}
                    className="p-2 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* Double click / keyboard selection Detail View Modal */}
      {showDetail && detailRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => { setShowDetail(false); setDetailRecord(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Kunden Details</span>
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ID: {String(detailRecord.id)}</span>
                </h3>
              </div>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Id</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.id;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">KundenNr</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.kundenNr;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Firmenname</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.firmenname;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ansprechpartner</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.ansprechpartner;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Email</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.email;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Telefon</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.telefon;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Strasse</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.strasse;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">plz</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.plz;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Ort</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.ort;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">UStIdNr</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.uStIdNr;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">ZahlungszielTage</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.zahlungszielTage;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-700/50">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Status</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap break-all">
                        {(() => {
                            let val: any = detailRecord.status;
                            return val === true ? '✅ Ja' : val === false ? '❌ Nein' : String(val ?? '-');
                        })()}
                      </span>
                    </div>
                    
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Link 
                to={'/kunden/' + detailRecord.id} 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <Edit size={16} /> <span>Bearbeiten</span>
              </Link>
              <button 
                onClick={() => { setShowDetail(false); setDetailRecord(null); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Datensatz löschen</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sind Sie sicher, dass Sie diesen Datensatz unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-sm font-semibold"
              >
                Abbrechen
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mass Delete Confirmation Modal */}
      {massDeleteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Mehrere Datensätze löschen</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sind Sie sicher, dass Sie {selectedIds.length} Datensätze unwiderruflich löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setMassDeleteOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition text-sm font-semibold"
              >
                Abbrechen
              </button>
              <button 
                onClick={confirmMassDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition text-sm font-semibold shadow-sm"
              >
                Ausgewählte löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};