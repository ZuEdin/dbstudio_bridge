
import React from 'react';
import { Query } from '../../types/index';
import { FileSpreadsheet, FileText, FileJson, Download, Filter, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDataFilter } from '../../hooks/useDataFilter';

interface QueryResultsViewProps {
  query: Query;
  results: Record<string, any>[];
}

export const QueryResultsView: React.FC<QueryResultsViewProps> = ({ query, results }) => {
  if (!query) return null;

  if (query.type !== 'SELECT') {
    return <div className="p-6 text-center text-slate-500">Ergebnisse können nur für SELECT-Abfragen angezeigt werden.</div>;
  }
  
  const { 
    filteredData, filters, setFilter, clearFilters, showFilters, setShowFilters, columnStats,
    sortColumn, sortDirection, handleSort
  } = useDataFilter(results);

  const headers = query.columns.filter(c => c.show).map(c => c.alias || c.fieldName);
  const dataKeys = query.columns.filter(c => c.show).map(c => c.alias || c.fieldName);

  const getRowVal = (row: any, key: string) => {
    if (!row) return '';
    if (row[key] !== undefined && row[key] !== null) return row[key];
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    if (row[camel] !== undefined && row[camel] !== null) return row[camel];
    const pascal = key.charAt(0).toUpperCase() + key.slice(1);
    if (row[pascal] !== undefined && row[pascal] !== null) return row[pascal];
    const lower = key.toLowerCase();
    const foundKey = Object.keys(row).find(k => k.toLowerCase() === lower || k.toLowerCase().endsWith('.' + lower));
    return foundKey ? row[foundKey] : '';
  };

  const exportExcel = () => {
    if (filteredData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daten");
    XLSX.writeFile(wb, `${query.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  const exportPDF = () => {
    if (filteredData.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Abfrage: ${query.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableBody = filteredData.map(row => dataKeys.map(key => String(row[key] ?? '')));

    autoTable(doc, {
        head: [headers],
        body: tableBody,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save(`${query.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const exportJSON = () => {
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(filteredData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `${query.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      link.click();
  };

  return (
    <div className="p-4 sm:p-8 bg-slate-50 h-full overflow-hidden flex flex-col">
      <div className="max-w-full mx-auto bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden flex flex-col h-full w-full">
        <div className="bg-slate-800 text-white px-6 py-3 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
             <Download size={18} className="text-blue-400" /> Abfrageergebnis: {query.name}
          </h2>
          
          <div className="flex gap-4 items-center">
             <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs border transition-colors ${showFilters || Object.keys(filters).length > 0 ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'}`}
                title="Filter anzeigen"
              >
                  <Filter size={14} /> Filter {Object.keys(filters).length > 0 ? `(${Object.keys(filters).length})` : ''}
             </button>

             <div className="flex gap-2 border-l border-slate-600 pl-4">
                <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-xs font-medium transition-colors" title="Export als Excel">
                    <FileSpreadsheet size={14} /> Excel
                </button>
                <button onClick={exportPDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-xs font-medium transition-colors" title="Export als PDF">
                    <FileText size={14} /> PDF
                </button>
                <button onClick={exportJSON} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded text-xs font-medium transition-colors" title="Export als JSON">
                    <FileJson size={14} /> JSON
                </button>
             </div>
          </div>
        </div>

        {/* DATA FILTER BAR */}
        {showFilters && (
            <div className="bg-orange-50 border-b border-orange-200 p-2 flex overflow-x-auto gap-2 items-center animate-in slide-in-from-top-2 shadow-inner shrink-0">
                <div className="flex items-center gap-2 pr-4 border-r border-orange-200 mr-2">
                    <span className="text-xs font-bold text-orange-800 uppercase flex items-center gap-1">
                        <Filter size={12}/> Filter
                    </span>
                    <button onClick={clearFilters} className="text-orange-600 hover:text-orange-800 text-xs underline">
                        Alle löschen
                    </button>
                </div>
                {headers.map((h, i) => {
                    const key = dataKeys[i]; 
                    const stats = columnStats[key] || { uniqueValues: [], isLowCardinality: false };
                    const hasFilter = !!filters[key];
                    
                    return (
                        <div key={`filter-${i}-${key}`} className={`flex flex-col min-w-[120px] max-w-[200px] ${hasFilter ? 'bg-white rounded shadow-sm' : ''} p-1`}>
                            <label className="text-[10px] font-bold text-orange-700 mb-0.5 truncate px-1">{h}</label>
                            {stats?.isLowCardinality ? (
                                <select 
                                    value={filters[key] || ''}
                                    onChange={e => setFilter(key, e.target.value)}
                                    className={`w-full border rounded px-1 py-0.5 text-xs outline-none ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200 bg-white'}`}
                                >
                                    <option value="">(Alle)</option>
                                    {stats.uniqueValues.map(val => <option key={val} value={val}>{val}</option>)}
                                </select>
                            ) : (
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={filters[key] || ''}
                                        onChange={e => setFilter(key, e.target.value)}
                                        placeholder="Suchen..."
                                        className={`w-full border rounded px-1 py-0.5 text-xs outline-none pr-4 ${hasFilter ? 'border-orange-400 bg-orange-50' : 'border-orange-200'}`}
                                    />
                                    {filters[key] && <button onClick={() => setFilter(key, '')} className="absolute right-1 top-0.5 text-orange-400 hover:text-orange-600"><X size={10}/></button>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        <div className="overflow-auto flex-1 relative">
          {filteredData.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 shadow-sm z-10 select-none">
                <tr className="bg-slate-100 border-b border-slate-300 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {headers.map((header, i) => {
                    const key = dataKeys[i];
                    const isSorted = sortColumn === key;
                    return (
                      <th 
                        key={`hdr-${i}-${header}`} 
                        onClick={() => handleSort(key)}
                        className={`p-3 bg-slate-100 hover:bg-slate-200 cursor-pointer whitespace-nowrap transition-colors ${
                          isSorted ? 'bg-indigo-50 text-indigo-900 font-extrabold' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{header}</span>
                          <span className="text-slate-400">
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                            ) : (
                              <ArrowUpDown size={12} className="opacity-0 hover:opacity-100" />
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`} className="hover:bg-slate-50">
                    {dataKeys.map((key, colIndex) => (
                      <td key={`cell-${rowIndex}-${colIndex}`} className="p-3 text-slate-700 whitespace-nowrap">
                        {String(getRowVal(row, key) ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-slate-500">
              {results.length > 0 ? 'Keine Treffer für den aktuellen Filter.' : `Die Abfrage "${query.name}" hat keine Ergebnisse geliefert.`}
            </div>
          )}
        </div>
        <div className="bg-slate-50 border-t border-slate-200 p-2 text-xs text-slate-500 text-right shrink-0">
           {Object.keys(filters).length > 0 ? `${filteredData.length} gefiltert von ${results.length}` : `${results.length} Datensätze`}
        </div>
      </div>
    </div>
  );
};
