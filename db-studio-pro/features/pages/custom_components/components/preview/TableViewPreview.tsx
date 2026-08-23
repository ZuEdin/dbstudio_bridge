import React from 'react';
import { Filter, HelpCircle } from 'lucide-react';

interface TableViewPreviewProps {
  configObj: any;
  mockRows: any[];
  calculateAggregate: (colField: string, footerType: string, customText?: string) => string;
}

export const TableViewPreview: React.FC<TableViewPreviewProps> = ({
  configObj,
  mockRows,
  calculateAggregate
}) => {
  return (
    <div className="space-y-4">
      {/* Table Header toolbar preview */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{configObj.title || 'Tabellentitel'}</span>
        {configObj.enableSearch && (
          <input 
            type="text" 
            disabled 
            placeholder={configObj.searchPlaceholder || 'Suchen...'} 
            className="px-2 py-1 text-[11px] border dark:border-slate-700 rounded bg-white dark:bg-slate-800 w-48 opacity-60 cursor-not-allowed dark:text-white"
          />
        )}
      </div>

      {/* Filter toolbar preview */}
      {configObj.enableFilters && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg border border-slate-150 dark:border-slate-800/60 text-[10px]">
          <span className="text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider select-none">
            <Filter size={10} className="text-indigo-500" /> Schnellfilter:
          </span>
          {(!configObj.filterFields || configObj.filterFields.length === 0) ? (
            <span className="text-slate-400 italic">Keine Filterspalten ausgewählt</span>
          ) : (
            configObj.filterFields.map((field: string) => (
              <div key={field} className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-600 dark:text-slate-300 gap-1 shadow-sm font-mono text-[9px]">
                <span>{field}:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold font-sans">Alle</span>
                <span className="text-[8px] text-slate-400">▼</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TABLE MODE PREVIEW WITH EXPLICIT WIREFRAME HIGHLIGHTING */}
      {configObj.layoutMode === 'table' ? (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-400">
            {/* 1. STATIC HEADER THEAD */}
            <thead className="relative bg-slate-100 dark:bg-slate-850 border-2 border-indigo-400 border-dashed">
              <tr className="relative">
                {(!configObj.columns || configObj.columns.length === 0) ? (
                  <th className="p-3 text-slate-400 italic">Keine Spalten definiert</th>
                ) : (
                  configObj.columns.map((col: any, cIdx: number) => {
                    const isSortedField = configObj.enableSorting && configObj.defaultSortField === col.field;
                    return (
                      <th 
                        key={cIdx} 
                        className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800"
                        style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                      >
                        <div className="flex items-center gap-1" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                          <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none shrink-0">
                            Header
                          </span>
                          <span className="truncate">{col.title}</span>
                          {configObj.enableSorting && (
                            <span className={`text-[10px] select-none ml-1 shrink-0 ${isSortedField ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-300 dark:text-slate-600'}`}>
                              {isSortedField ? (configObj.defaultSortOrder === 'desc' ? '▼' : '▲') : '↕'}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
              {/* Absolute Badge overlay for the static Header (Nested in valid row + cell) */}
              <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                <th colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                  <div className="absolute right-2 -top-2.5 bg-indigo-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                    Statischer Tabellen-Header &lt;thead&gt;
                  </div>
                </th>
              </tr>
            </thead>

            {/* 2. REPEATING BODY ROWS (TRs) */}
            <tbody className="relative bg-white dark:bg-slate-900 border-2 border-amber-400 border-dashed">
              {mockRows.slice(0, 3).map((row, rIdx) => (
                <tr 
                  key={rIdx} 
                  className={`relative ${rIdx > 0 ? 'opacity-40 select-none' : 'bg-amber-50/10 dark:bg-amber-950/5'} ${configObj.tableStyle === 'striped' && rIdx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-950/30' : ''}`}
                >
                  {(!configObj.columns || configObj.columns.length === 0) ? (
                    <td className="p-3 text-slate-300">-</td>
                  ) : (
                    configObj.columns.map((col: any, cIdx: number) => {
                      const cellVal = row[col.field];
                      return (
                        <td 
                          key={cIdx} 
                          className={`${configObj.tableStyle === 'compact' ? 'p-1.5' : 'p-3'} border-b border-slate-200 dark:border-slate-800 font-medium`}
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {rIdx === 0 && (
                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none">
                              Loop
                            </span>
                          )}
                          
                          {/* Style cells based on visual selection format */}
                          {col.type === 'badge' ? (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">
                              {String(cellVal ?? 'Status')}
                            </span>
                          ) : col.type === 'currency' ? (
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                              {Number(cellVal || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                            </span>
                          ) : col.type === 'date' ? (
                            <span className="text-slate-500 dark:text-slate-400 font-mono">
                              {cellVal ? new Date(String(cellVal)).toLocaleDateString('de-DE') : '13.07.2026'}
                            </span>
                          ) : col.type === 'number' ? (
                            <span className="font-mono font-semibold dark:text-slate-200">{String(cellVal ?? 0)}</span>
                          ) : (
                            <span className="dark:text-slate-300">{String(cellVal ?? '-')}</span>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
              {/* Absolute Badge overlay for the dynamic Row Repeat Loop (Nested in valid row + cell) */}
              <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                <td colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                  <div className="absolute right-2 top-1.5 bg-amber-500 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                    Wiederholter Bereich &lt;tr&gt; (Loop über jeden DB-Eintrag)
                  </div>
                </td>
              </tr>
            </tbody>

            {/* 3. STATIC FOOTER TFOOT */}
            {configObj.columns && configObj.columns.some((col: any) => col.footerType && col.footerType !== 'none') && (
              <tfoot className="relative bg-slate-50 dark:bg-slate-950 border-2 border-purple-400 border-dashed">
                <tr className="relative">
                  {configObj.columns.map((col: any, cIdx: number) => (
                    <td 
                      key={cIdx} 
                      className="p-3 font-bold text-slate-700 dark:text-slate-300 border-t border-slate-300 dark:border-slate-800"
                      style={{ textAlign: col.align || 'left' }}
                    >
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-400 text-[8px] font-bold px-1 py-0.5 rounded mr-1 inline-block uppercase select-none">
                        Footer
                      </span>
                      {calculateAggregate(col.field, col.footerType, col.footerCustomText)}
                    </td>
                  ))}
                </tr>
                {/* Absolute Badge overlay for the static Footer (Nested in valid row + cell) */}
                <tr className="h-0 p-0 m-0 border-none select-none pointer-events-none">
                  <td colSpan={configObj.columns?.length || 1} className="p-0 border-none relative h-0">
                    <div className="absolute right-2 -bottom-2.5 bg-purple-600 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none pointer-events-none uppercase">
                      Statischer Tabellen-Footer &lt;tfoot&gt;
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : (
        /* CARDS REPEATER GRID VIEW PREVIEW */
        <div className={`grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-${configObj.cardGridCols || 3}`}>
          {mockRows.slice(0, 3).map((row, rIdx) => {
            const shadowStyle = 
              configObj.cardShadow === 'sm' ? 'shadow-sm' :
              configObj.cardShadow === 'md' ? 'shadow-md' :
              configObj.cardShadow === 'lg' ? 'shadow-lg' : 'shadow-none';

            const borderStyle = 
              configObj.cardBorder === 'indigo' ? 'border-indigo-200 bg-indigo-50/10' :
              configObj.cardBorder === 'none' ? 'border-transparent' : 'border-slate-200 dark:border-slate-800';

            return (
              <div 
                key={rIdx}
                className={`relative bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col gap-2 transition ${shadowStyle} ${borderStyle} ${rIdx === 0 ? 'ring-2 ring-amber-400 ring-dashed' : 'opacity-40 select-none'}`}
              >
                {/* Card Wireframe Marker Label */}
                {rIdx === 0 && (
                  <div className="absolute -top-3 left-3 bg-amber-500 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none uppercase z-10">
                    Wiederholte Card-Vorlage (Template Loop)
                  </div>
                )}

                {/* Card contents constructed by designer */}
                {(!configObj.cardTemplate || configObj.cardTemplate.length === 0) ? (
                  <div className="text-center p-3 text-xs text-slate-300 italic">
                    Leere Karte (Fügen Sie links Elemente hinzu)
                  </div>
                ) : (
                  configObj.cardTemplate.map((elem: any, eIdx: number) => {
                    const val = row[elem.field];
                    return (
                      <div key={eIdx} className={`${elem.style || ''}`}>
                        {elem.label && <span className="text-[10px] text-slate-400 font-semibold block uppercase">{elem.label}</span>}
                        {elem.type === 'badge' ? (
                          <span className={`${elem.style || 'bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px]'}`}>
                            {String(val ?? 'Badge')}
                          </span>
                        ) : elem.type === 'button' ? (
                          <button disabled className="mt-1 px-3 py-1 bg-indigo-600/70 text-white text-[10px] rounded hover:bg-indigo-700/70 font-semibold pointer-events-none opacity-80 uppercase">
                            {String(val ?? elem.label ?? 'CTA Button')}
                          </button>
                        ) : (
                          <span className="dark:text-slate-200">{String(val ?? '-')}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="text-xs text-slate-400 italic bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded p-3 font-medium flex items-start gap-1.5 mt-2">
        <HelpCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="dark:text-slate-300">
          <strong>Für Designer:</strong> Der orange/amber umrandete Bereich stellt die Vorlage (<strong>&lt;tr&gt; Zeile</strong> bzw. <strong>&lt;Card&gt;</strong>) dar. Dieser wird vom SDUI Engine Renderer automatisch über jeden Datensatz Ihrer IndexedDB-Tabelle geloopt! Header und Footer bleiben statisch.
        </p>
      </div>
    </div>
  );
};
