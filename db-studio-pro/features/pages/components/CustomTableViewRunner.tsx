import React, { useState, useMemo } from 'react';
import { PageComponent } from '../../../types/index';
import { Filter, ArrowUpDown } from 'lucide-react';
import { 
    getNestedValueCaseInsensitive, 
    resolvePlaceholders 
} from '../utils/pageViewUtils';

interface CustomTableViewRunnerProps {
    comp: any;
    node: PageComponent;
    context: any;
    params: any;
    setParam: (k: string, v: any) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    fetchedData: any[];
    loading: boolean;
}

export const CustomTableViewRunner: React.FC<CustomTableViewRunnerProps> = ({
    comp,
    node,
    context,
    params,
    setParam,
    navigate,
    fetchedData,
    loading
}) => {
    const conf = comp.configuration || {};

    // 1. Local States for Search, Filtering, and Sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
    const [sortField, setSortField] = useState<string>(conf.defaultSortField || '');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(conf.defaultSortOrder || 'asc');

    // 2. Extract Unique Filter Options for each active filter field dynamically
    const filterOptions = useMemo(() => {
        if (!conf.enableFilters || !conf.filterFields || conf.filterFields.length === 0) return {};
        
        const options: Record<string, string[]> = {};
        conf.filterFields.forEach((field: string) => {
            const uniqueVals = new Set<string>();
            fetchedData.forEach(row => {
                const val = getNestedValueCaseInsensitive(row, field);
                if (val !== undefined && val !== null && val !== '') {
                    uniqueVals.add(String(val));
                }
            });
            options[field] = Array.from(uniqueVals).sort();
        });
        return options;
    }, [fetchedData, conf.enableFilters, conf.filterFields]);

    // 3. Process data binding, parameters, searching, filtering, and sorting
    const processedData = useMemo(() => {
        let data = [...fetchedData];

        // A. Filter by parent/page parameter if configured (Master-Detail link)
        if (node.props.filterParamField && node.props.filterParamName) {
            const filterField = node.props.filterParamField;
            const filterParam = node.props.filterParamName;
            const filterVal = params[filterParam];
            if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
                data = data.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
            } else {
                data = [];
            }
        }

        // B. Apply search query (Global Search)
        if (conf.enableSearch && searchQuery.trim()) {
            const qLower = searchQuery.toLowerCase().trim();
            data = data.filter(row => {
                return Object.values(row).some(v => String(v).toLowerCase().includes(qLower));
            });
        }

        // C. Apply active filters (Quick-Filters Dropdowns)
        if (conf.enableFilters && conf.filterFields) {
            Object.entries(selectedFilters).forEach(([field, val]) => {
                if (val) {
                    data = data.filter(row => String(getNestedValueCaseInsensitive(row, field) ?? '') === val);
                }
            });
        }

        // D. Apply column-header sorting
        if (sortField) {
            data.sort((a, b) => {
                const valA = getNestedValueCaseInsensitive(a, sortField);
                const valB = getNestedValueCaseInsensitive(b, sortField);
                
                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;

                const numA = Number(valA);
                const numB = Number(valB);

                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortOrder === 'asc' ? numA - numB : numB - numA;
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                return sortOrder === 'asc' 
                    ? strA.localeCompare(strB, 'de') 
                    : strB.localeCompare(strA, 'de');
            });
        }

        return data;
    }, [fetchedData, node.props, params, conf, searchQuery, selectedFilters, sortField, sortOrder]);

    // 4. Toggle sorting order on column header click
    const handleSortToggle = (field: string) => {
        if (!conf.enableSorting) return;
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    if (conf.layoutMode === 'grid') {
        // --- RENDERING GRID MODE (CARDS) ---
        const gridColsClass = 
            conf.cardGridCols === 1 ? 'grid-cols-1' :
            conf.cardGridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
            conf.cardGridCols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

        const shadowClass = 
            conf.cardShadow === 'sm' ? 'shadow-sm' :
            conf.cardShadow === 'md' ? 'shadow-md' :
            conf.cardShadow === 'lg' ? 'shadow-lg' : 'shadow-none';

        const borderClass = 
            conf.cardBorder === 'indigo' ? 'border-indigo-100 bg-indigo-50/5' :
            conf.cardBorder === 'none' ? 'border-transparent' : 'border-slate-200';

        return (
            <div className="space-y-4 w-full">
                {/* Title and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                        {resolvePlaceholders(conf.title || 'Kartenübersicht', context, params)}
                    </span>
                    {conf.enableSearch && (
                        <input 
                            type="text" 
                            placeholder={conf.searchPlaceholder || 'Suchen...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md max-w-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        />
                    )}
                </div>

                {/* Filters Row */}
                {conf.enableFilters && conf.filterFields && conf.filterFields.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 select-none">
                            <Filter size={10} className="text-indigo-500" /> Filter:
                        </span>
                        {conf.filterFields.map((field: string) => (
                            <div key={field} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 shadow-sm text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold font-mono">{field}:</span>
                                <select
                                    value={selectedFilters[field] || ''}
                                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, [field]: e.target.value }))}
                                    className="bg-transparent text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none text-xs"
                                >
                                    <option value="">Alle</option>
                                    {(filterOptions[field] || []).map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid Render */}
                {processedData.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                        Keine Datensätze gefunden
                    </div>
                ) : (
                    <div className={`grid gap-4 ${gridColsClass}`}>
                        {processedData.map((row, rIdx) => (
                            <div 
                                key={rIdx} 
                                onClick={() => {
                                    if (node.props.enableSelection) {
                                        const pKey = node.props.selectionParamName || 'selectedId';
                                        setParam(pKey, row.id || row.Id || rIdx);
                                        if (node.props.detailsPageId) {
                                            navigate(node.props.detailsPageId, { [pKey]: row.id || row.Id || rIdx });
                                        }
                                    }
                                }}
                                className={`bg-white dark:bg-slate-900 border rounded-xl p-4 flex flex-col gap-2 transition cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-md ${shadowClass} ${borderClass}`}
                            >
                                {conf.cardTemplate?.map((elem: any, eIdx: number) => {
                                    const val = getNestedValueCaseInsensitive(row, elem.field);
                                    return (
                                        <div key={eIdx} className={`${elem.style || ''}`}>
                                            {elem.label && <span className="text-[10px] text-slate-400 font-semibold block uppercase">{elem.label}</span>}
                                            {elem.type === 'badge' ? (
                                                <span className={`${elem.style || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]'}`}>
                                                    {String(val ?? '')}
                                                </span>
                                            ) : elem.type === 'button' ? (
                                                <button className="mt-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] rounded font-semibold uppercase">
                                                    {String(val ?? elem.label ?? 'Button')}
                                                </button>
                                            ) : (
                                                <span className="dark:text-slate-300">{String(val ?? '')}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    } else {
        // --- RENDERING TABLE MODE ---
        return (
            <div className="space-y-4 w-full">
                {/* Header and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-850">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                        {resolvePlaceholders(conf.title || 'Umsatzübersicht', context, params)}
                    </span>
                    {conf.enableSearch && (
                        <input 
                            type="text" 
                            placeholder={conf.searchPlaceholder || 'Suchen...'} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded w-48 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                        />
                    )}
                </div>

                {/* Filters Row */}
                {conf.enableFilters && conf.filterFields && conf.filterFields.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/60">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 select-none">
                            <Filter size={10} className="text-indigo-500" /> Filter:
                        </span>
                        {conf.filterFields.map((field: string) => (
                            <div key={field} className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 shadow-sm text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold font-mono">{field}:</span>
                                <select
                                    value={selectedFilters[field] || ''}
                                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, [field]: e.target.value }))}
                                    className="bg-transparent text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none text-xs"
                                >
                                    <option value="">Alle</option>
                                    {(filterOptions[field] || []).map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Table Layout */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                {conf.columns?.map((col: any, cIdx: number) => {
                                    const isSorted = conf.enableSorting && sortField === col.field;
                                    return (
                                        <th 
                                            key={cIdx} 
                                            onClick={() => handleSortToggle(col.field)}
                                            className={`p-3 border-b border-slate-200 dark:border-slate-800 select-none ${conf.enableSorting ? 'cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/55' : ''}`}
                                            style={{ width: col.width || 'auto', textAlign: col.align || 'left' }}
                                        >
                                            <div className="flex items-center gap-1" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                                                <span>{col.title}</span>
                                                {conf.enableSorting && (
                                                    <span className={`text-[9px] shrink-0 ${isSorted ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-300 dark:text-slate-600'}`}>
                                                        {isSorted ? (sortOrder === 'desc' ? '▼' : '▲') : '↕'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {processedData.length === 0 ? (
                                <tr>
                                    <td colSpan={conf.columns?.length || 1} className="p-6 text-center text-slate-400 italic bg-white dark:bg-slate-900">
                                        Keine Datensätze gefunden
                                    </td>
                                </tr>
                            ) : (
                                processedData.map((row, rIdx) => (
                                    <tr 
                                        key={rIdx} 
                                        onClick={() => {
                                            if (node.props.enableSelection) {
                                                const pKey = node.props.selectionParamName || 'selectedId';
                                                setParam(pKey, row.id || row.Id || rIdx);
                                                if (node.props.detailsPageId) {
                                                    navigate(node.props.detailsPageId, { [pKey]: row.id || row.Id || rIdx });
                                                }
                                            }
                                        }}
                                        className={`hover:bg-indigo-50/10 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors ${conf.tableStyle === 'striped' && rIdx % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-850/30' : ''}`}
                                    >
                                        {conf.columns?.map((col: any, cIdx: number) => {
                                            const cellVal = getNestedValueCaseInsensitive(row, col.field);
                                            return (
                                                <td 
                                                    key={cIdx} 
                                                    className={`${conf.tableStyle === 'compact' ? 'p-1.5' : 'p-3'} border-b border-slate-200 dark:border-slate-800`}
                                                    style={{ textAlign: col.align || 'left' }}
                                                >
                                                    {col.type === 'badge' ? (
                                                        <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">
                                                            {String(cellVal ?? '')}
                                                        </span>
                                                    ) : col.type === 'currency' ? (
                                                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                                                            {Number(cellVal || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                                                        </span>
                                                    ) : col.type === 'date' ? (
                                                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                                                            {cellVal ? new Date(String(cellVal)).toLocaleDateString('de-DE') : ''}
                                                        </span>
                                                    ) : col.type === 'number' ? (
                                                        <span className="font-mono font-semibold dark:text-slate-200">{String(cellVal ?? '')}</span>
                                                    ) : (
                                                        <span className="dark:text-slate-300">{String(cellVal ?? '')}</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {conf.columns && conf.columns.some((col: any) => col.footerType && col.footerType !== 'none') && (
                            <tfoot className="bg-slate-50 dark:bg-slate-850 font-bold border-t border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                                <tr>
                                    {conf.columns.map((col: any, cIdx: number) => {
                                        let fVal = '';
                                        if (col.footerType === 'custom') fVal = col.footerCustomText || '';
                                        else if (col.footerType === 'count') fVal = `Anzahl: ${processedData.length}`;
                                        else if (col.footerType === 'sum' || col.footerType === 'avg') {
                                            const numbers = processedData.map(r => Number(getNestedValueCaseInsensitive(r, col.field))).filter(n => !isNaN(n));
                                            if (numbers.length > 0) {
                                                const sum = numbers.reduce((a, b) => a + b, 0);
                                                if (col.footerType === 'sum') {
                                                    fVal = `Summe: ${sum.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
                                                } else {
                                                    fVal = `Ø: ${(sum / numbers.length).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`;
                                                }
                                            } else {
                                                fVal = '0,00';
                                            }
                                        }
                                        return (
                                            <td 
                                                key={cIdx} 
                                                className="p-3 border-t border-slate-300 dark:border-slate-800"
                                                style={{ textAlign: col.align || 'left' }}
                                            >
                                                {fVal}
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        );
    }
};
