import React, { useState, useEffect, useContext } from 'react';
import { PageComponent } from '../../../types/index';
import { useProjectStore } from '../../../stores/useProjectStore';
import { 
    PageParamsContext, 
    PageViewContext, 
    getNestedValueCaseInsensitive 
} from '../utils/pageViewUtils';
import { Loader2, Plus, X, Search, Filter, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';

interface LiveTableProps {
    node: PageComponent;
    context?: Record<string, any>;
    fetchedData: any[];
    loading: boolean;
}

export const LiveTable: React.FC<LiveTableProps> = ({ node, context, fetchedData, loading }) => {
    const { queries, tables, updateTable } = useProjectStore();
    const { params, setParam } = useContext(PageParamsContext);
    const { openFormModal, showConfirm, navigate } = useContext(PageViewContext);

    // Search, filter, and pagination states
    const [globalSearch, setGlobalSearch] = useState('');
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Columns parsing
    const columns = node.props.columns ? node.props.columns.split(',').map((c: string) => c.trim()).filter(Boolean) : [];
    let finalData = fetchedData;

    // Apply runtime parameter filter (Master-Detail matching)
    if (node.props.filterParamField && node.props.filterParamName) {
        const filterField = node.props.filterParamField;
        const filterParam = node.props.filterParamName;
        const filterVal = params[filterParam];
        if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
            finalData = fetchedData.filter(row => String(getNestedValueCaseInsensitive(row, filterField) ?? '') === String(filterVal));
        } else {
            finalData = [];
        }
    }

    const displayData = columns.length > 0 ? finalData.map(row => {
        const newRow: any = {};
        columns.forEach((c: string) => newRow[c] = getNestedValueCaseInsensitive(row, c));
        return { ...newRow, _raw: row };
    }) : finalData.map(row => ({ ...row, _raw: row }));

    const tableId = node.props.dataSourceId;
    const targetTable = tables.find(t => t.id === tableId);
    const query = queries.find(q => q.id === tableId);
    const displayName = targetTable?.name || query?.name || 'Tabelle';
    const pkField = targetTable?.fields.find(f => f.isPrimaryKey) || targetTable?.fields[0];
    const pkFieldName = pkField?.name || 'Id';

    const queryColumns = query && query.type === 'SELECT' ? query.columns.filter(c => c.show).map(c => c.alias || c.fieldName) : [];
    const allColumns = columns.length > 0 ? columns : (targetTable ? targetTable.fields.map(f => f.name) : (queryColumns.length > 0 ? queryColumns : []));

    // --- Search and Filtering Logic ---
    let processedRows = displayData;

    // 1. Global Case-Insensitive partial search
    if (globalSearch.trim()) {
        const qLower = globalSearch.toLowerCase().trim();
        processedRows = processedRows.filter(row => {
            return allColumns.some(colName => {
                const val = getNestedValueCaseInsensitive(row, colName);
                return val !== undefined && val !== null && String(val).toLowerCase().includes(qLower);
            });
        });
    }

    // 2. Column-specific Case-Insensitive partial search
    Object.keys(columnFilters).forEach(colName => {
        const filterVal = columnFilters[colName].toLowerCase().trim();
        if (filterVal) {
            processedRows = processedRows.filter(row => {
                const val = getNestedValueCaseInsensitive(row, colName);
                return val !== undefined && val !== null && String(val).toLowerCase().includes(filterVal);
            });
        }
    });

    // --- Pagination Logic ---
    const itemsPerPage = 10;
    const totalItems = processedRows.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    const paginatedRows = processedRows.slice(startIndex, startIndex + itemsPerPage);

    const triggerMode = node.props.rowClickTrigger || 'click';

    const handleRowClick = (row: any) => {
        if (node.props.enableSelection) {
            const paramKey = node.props.selectionParamName || 'selectedId';
            const idVal = row._raw[pkFieldName];
            if (triggerMode === 'click') {
                if (node.props.detailsPageId) {
                    navigate(node.props.detailsPageId, { [paramKey]: idVal });
                } else {
                    setParam(paramKey, idVal);
                }
            } else {
                setParam(paramKey, idVal);
            }
        }
    };

    const handleRowDoubleClick = (row: any) => {
        if (node.props.enableSelection && triggerMode === 'dblclick') {
            const paramKey = node.props.selectionParamName || 'selectedId';
            const idVal = row._raw[pkFieldName];
            if (node.props.detailsPageId) {
                navigate(node.props.detailsPageId, { [paramKey]: idVal });
            } else {
                setParam(paramKey, idVal);
            }
        }
    };

    return (
        <div className={`p-4 w-full bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
            {/* Table Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="text-sm font-semibold text-slate-700">
                    {displayName} {node.props.filterParamField && `(Gefiltert nach ${node.props.filterParamField})`}
                </div>
                <div className="flex items-center gap-2 animate-fadeIn">
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`p-1.5 border rounded-md flex items-center justify-center transition ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white hover:bg-slate-50 text-slate-600'}`}
                        title="Spaltenfilter umschalten"
                    >
                        <Filter size={15} />
                    </button>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Suchen..." 
                            className="pl-8 pr-7 py-1 text-xs border rounded bg-white w-40 sm:w-56 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            value={globalSearch}
                            onChange={e => {
                                setGlobalSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        {globalSearch && (
                            <button 
                                onClick={() => { setGlobalSearch(''); setCurrentPage(1); }}
                                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {node.props.enableCrudActions && node.props.createFormId && (
                        <button 
                            onClick={() => openFormModal(node.props.createFormId, 'create')}
                            className="flex items-center gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-1.5 px-3 rounded shadow-sm transition"
                        >
                            <Plus size={13} /> Neu hinzufügen
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="overflow-x-auto border border-slate-100 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {allColumns.length > 0 ? allColumns.map(k => (
                                        <th key={k} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{k}</th>
                                    )) : <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Keine Einträge</th>}
                                    {node.props.enableCrudActions && <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</th>}
                                </tr>
                                {showFilters && allColumns.length > 0 && (
                                    <tr className="bg-slate-100/40">
                                        {allColumns.map(k => (
                                            <th key={k} className="px-2 py-1">
                                                <input 
                                                    type="text"
                                                    placeholder="Filtern..."
                                                    className="w-full px-2 py-1 text-[11px] font-normal border rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={columnFilters[k] || ''}
                                                    onChange={e => {
                                                        setColumnFilters({
                                                            ...columnFilters,
                                                            [k]: e.target.value
                                                        });
                                                        setCurrentPage(1);
                                                    }}
                                                />
                                            </th>
                                        ))}
                                        {node.props.enableCrudActions && <th className="px-2 py-1 text-right font-normal">
                                            {Object.keys(columnFilters).length > 0 && (
                                                <button 
                                                    onClick={() => { setColumnFilters({}); setCurrentPage(1); }} 
                                                    className="text-red-500 hover:text-red-700 text-[10px] font-semibold"
                                                >
                                                    Zurücksetzen
                                                </button>
                                            )}
                                        </th>}
                                    </tr>
                                )}
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {paginatedRows.length > 0 ? paginatedRows.map((row, idx) => {
                                    const isSelected = String(row._raw[pkFieldName]) === String(params[node.props.selectionParamName || 'selectedId']);
                                    return (
                                        <tr 
                                            key={idx} 
                                            onClick={() => handleRowClick(row)}
                                            onDoubleClick={() => handleRowDoubleClick(row)}
                                            className={`hover:bg-slate-50 transition cursor-pointer select-none ${isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''}`}
                                        >
                                            {allColumns.map((colName, vIdx) => (
                                                <td key={vIdx} className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 font-medium">
                                                    {String(getNestedValueCaseInsensitive(row, colName) ?? '')}
                                                </td>
                                            ))}
                                            
                                            {node.props.enableCrudActions && (
                                                <td className="px-3 py-1.5 whitespace-nowrap text-xs text-right font-medium space-x-1.5" onClick={e => e.stopPropagation()}>
                                                    <button 
                                                        onClick={() => {
                                                            const rowId = row._raw[pkFieldName];
                                                            const selectionKey = node.props.selectionParamName || 'selectedId';
                                                            if (node.props.detailsPageId) {
                                                                navigate(node.props.detailsPageId, { [selectionKey]: rowId });
                                                            } else {
                                                                setParam(selectionKey, rowId);
                                                            }
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2.5 py-1 rounded-md bg-indigo-50/50 hover:bg-indigo-100/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 border border-indigo-100/30 dark:border-indigo-900/30 transition shadow-xs"
                                                        title="Details anzeigen"
                                                    >
                                                        <Eye size={13} />
                                                        <span className="hidden sm:inline">Details</span>
                                                    </button>
                                                    {node.props.editFormId && (
                                                        <button 
                                                            onClick={() => {
                                                                const rowId = row._raw[pkFieldName];
                                                                openFormModal(node.props.editFormId, 'edit', rowId);
                                                            }}
                                                            className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 px-2.5 py-1 rounded-md bg-amber-50/50 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 border border-amber-100/30 dark:border-amber-900/30 transition shadow-xs"
                                                            title="Datensatz bearbeiten"
                                                        >
                                                            <Pencil size={13} />
                                                            <span className="hidden sm:inline">Bearbeiten</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            const rowId = row._raw[pkFieldName];
                                                            showConfirm(
                                                                'Datensatz löschen',
                                                                'Möchten Sie diesen Datensatz wirklich löschen?',
                                                                () => {
                                                                    if (targetTable && targetTable.data) {
                                                                        const filtered = targetTable.data.filter(r => String(r[pkFieldName]) !== String(rowId));
                                                                        updateTable({ ...targetTable, data: filtered });
                                                                    }
                                                                }
                                                            );
                                                        }}
                                                        className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2.5 py-1 rounded-md bg-red-50/50 hover:bg-red-100/60 dark:bg-red-950/20 dark:hover:bg-red-900/40 border border-red-100/30 dark:border-red-900/30 transition shadow-xs"
                                                        title="Löschen"
                                                    >
                                                        <Trash2 size={13} />
                                                        <span className="hidden sm:inline">Löschen</span>
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={allColumns.length + (node.props.enableCrudActions ? 1 : 0) || 1} className="px-3 py-8 text-center text-xs text-slate-400 italic">
                                            Keine Daten verfügbar
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls Footer */}
                    {totalItems > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-3 px-1 gap-2 text-xs text-slate-500 select-none">
                            <div>
                                Zeige <span className="font-semibold text-slate-700">{startIndex + 1}</span> bis <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> von <span className="font-semibold text-slate-700">{totalItems}</span> Einträgen
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => setCurrentPage(1)} 
                                    disabled={safeCurrentPage <= 1}
                                    className="px-2 py-1 border rounded bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition"
                                >
                                    Erste
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={safeCurrentPage <= 1}
                                    className="p-1 border rounded bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition flex items-center justify-center"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <span className="px-3 py-1 font-medium text-slate-700 bg-slate-50 border rounded">
                                    Seite {safeCurrentPage} von {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={safeCurrentPage >= totalPages}
                                    className="p-1 border rounded bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition flex items-center justify-center"
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(totalPages)} 
                                    disabled={safeCurrentPage >= totalPages}
                                    className="px-2 py-1 border rounded bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 transition"
                                >
                                    Letzte
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
