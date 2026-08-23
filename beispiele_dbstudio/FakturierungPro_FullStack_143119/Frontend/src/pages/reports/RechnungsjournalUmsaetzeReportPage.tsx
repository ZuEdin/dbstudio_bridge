import React, { useEffect, useState, useMemo } from 'react';
import { get } from '../../services/api';
import { FileText, Printer } from 'lucide-react';

export const RechnungsjournalUmsaetzeReportPage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const load = async () => {
          try {
              const res = await get<any>('rechnungen', { pageSize: 10000 }); // Fetch all for report
              const items = Array.isArray(res) ? res : (res?.data || res?.Data || res?.items || res?.Items || []);
              setData(items);
          } finally { setLoading(false); }
      };
      load();
  }, []);

  const groupedData = useMemo(() => {
      if (!data.length) return [];
      const groupBy: string | null = 'zahlungsStatus';
      
      if (!groupBy) {
          return [{ key: 'Gesamt', items: data, summaries: calculateSummaries(data) }];
      }

      const groups: Record<string, any[]> = {};
      data.forEach(item => {
          const val = item[groupBy] || 'Unbekannt';
          if (!groups[val]) groups[val] = [];
          groups[val].push(item);
      });

      return Object.keys(groups).sort().map(key => ({
          key,
          items: groups[key],
          summaries: calculateSummaries(groups[key])
      }));
  }, [data]);

  function calculateSummaries(items: any[]) {
      const sum: any = {};
      sum['BruttoBetrag'] = items.reduce((acc, curr) => acc + (Number(curr.bruttoBetrag) || 0), 0);
sum['OffenerBetrag'] = items.reduce((acc, curr) => acc + (Number(curr.offenerBetrag) || 0), 0);
      return sum;
  }

  const handlePrint = () => window.print();

  return (
    <div className="p-8 max-w-[210mm] mx-auto min-h-screen bg-white shadow-xl my-8 print:shadow-none print:m-0 text-slate-800">
        <style dangerouslySetInnerHTML={{ __html: `
            @media print {
                @page {
                    size: portrait;
                    margin: 15mm;
                }
                body {
                    -webkit-print-color-adjust: exact;
                }
            }
        ` }} />
        <div className="flex justify-between items-start border-b-4 border-slate-800 pb-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Rechnungsjournal & Umsätze</h1>
                <p className="text-slate-500 mt-1">Erstellt am: {new Date().toLocaleDateString()}</p>
            </div>
            <button onClick={handlePrint} className="print:hidden bg-slate-100 hover:bg-slate-200 p-2 rounded text-slate-600"><Printer size={20}/></button>
        </div>

        <div>
            {groupedData.map((group, idx) => (
                <div key={idx} className="mb-8 break-inside-avoid">
                    {group.key !== 'Gesamt' && (
                        <div className="bg-slate-100 p-2 font-bold text-lg text-slate-700 border-l-4 border-slate-400 mb-2">
                            {group.key}
                        </div>
                    )}
                    
                    <table className="w-full text-sm text-left mb-2">
                        <thead className="border-b border-slate-300">
                            <tr>
                                <th className="py-2 font-semibold uppercase text-xs text-slate-500">RechnungsNr</th><th className="py-2 font-semibold uppercase text-xs text-slate-500">Datum</th><th className="py-2 font-semibold uppercase text-xs text-slate-500">Fälligkeit</th><th className="py-2 font-semibold uppercase text-xs text-slate-500">Status</th><th className="py-2 font-semibold uppercase text-xs text-slate-500">Brutto (€)</th><th className="py-2 font-semibold uppercase text-xs text-slate-500">Offen (€)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.items.map((item, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0">
                                    <td className="py-2">{item['rechnungsNr'] ?? item['RechnungsNr'] ?? item['RechnungsNr'] ?? ''}</td><td className="py-2">{item['datum'] ?? item['Datum'] ?? item['Datum'] ?? ''}</td><td className="py-2">{item['faelligkeit'] ?? item['Faelligkeit'] ?? item['Fälligkeit'] ?? ''}</td><td className="py-2">{item['status'] ?? item['Status'] ?? item['Status'] ?? ''}</td><td className="py-2">{item['brutto'] ?? item['Brutto'] ?? item['Brutto (€)'] ?? ''}</td><td className="py-2">{item['offen'] ?? item['Offen'] ?? item['Offen (€)'] ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {Object.keys(group.summaries).length > 0 && (
                        <div className="bg-slate-50 p-3 flex justify-end gap-6 text-sm border-t border-slate-200">
                            {Object.entries(group.summaries).map(([k, v]: any) => (
                                <div key={k}><strong>{k}:</strong> {v}</div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
};