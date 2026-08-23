import React, { useEffect, useState } from 'react';
import { get } from '../../services/api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const OffeneRechnungenMahnstufenQueryPage = () => {
  const [data, setData] = useState<{ data: any[], total: number, page: number, totalPages: number }>({ data: [], total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, search]);

  const getCellValue = (item: any, alias: string, fieldName: string) => {
      if (!item) return '';
      if (item[alias] !== undefined && item[alias] !== null) return item[alias];
      const camelAlias = alias ? alias.charAt(0).toLowerCase() + alias.slice(1) : '';
      if (camelAlias && item[camelAlias] !== undefined && item[camelAlias] !== null) return item[camelAlias];
      if (fieldName && item[fieldName] !== undefined && item[fieldName] !== null) return item[fieldName];
      const camelField = fieldName ? fieldName.charAt(0).toLowerCase() + fieldName.slice(1) : '';
      if (camelField && item[camelField] !== undefined && item[camelField] !== null) return item[camelField];
      const target = (alias || fieldName).toLowerCase();
      const foundKey = Object.keys(item).find(k => k.toLowerCase() === target);
      return foundKey ? item[foundKey] : '';
  };

  const load = async () => {
      setLoading(true);
      try {
          const res: any = await get('queries/offeneRechnungenMahnstufen', { page, pageSize: 20, search });
          let items: any[] = [];
          let total = 0;
          let curPage = page;
          let totalPages = 1;

          if (Array.isArray(res)) {
              items = res;
              total = res.length;
          } else if (res && typeof res === 'object') {
              items = res.data || res.Data || res.items || res.Items || [];
              total = res.total ?? res.Total ?? items.length;
              curPage = res.page ?? res.Page ?? page;
              totalPages = (res.totalPages ?? res.TotalPages ?? Math.ceil(total / 20)) || 1;
          }
          setData({ data: items, total, page: curPage, totalPages });
      } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-[95%] mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold dark:text-white">Offene Rechnungen & Mahnstufen</h1>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-4 pr-4 py-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700 text-slate-500 uppercase text-xs font-semibold">
                        <tr><th className="p-4">RechnungsNr</th>
<th className="p-4">Firmenname</th>
<th className="p-4">FaelligDatum</th>
<th className="p-4">ZahlungsStatus</th>
<th className="p-4">OffenerBetrag</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.data.length > 0 ? data.data.map((item, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, "RechnungsNr", "RechnungsNr") ?? '')}</td>
<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, "Firmenname", "Firmenname") ?? '')}</td>
<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, "FaelligDatum", "FaelligDatum") ?? '')}</td>
<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, "ZahlungsStatus", "ZahlungsStatus") ?? '')}</td>
<td className="p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{String(getCellValue(item, "OffenerBetrag", "OffenerBetrag") ?? '')}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Keine Daten.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="text-sm text-slate-500">Seite {data.page} von {data.totalPages}</div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                    <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page>=data.totalPages} className="p-2 border rounded bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
            </div>
        </div>
    </div>
  );
};