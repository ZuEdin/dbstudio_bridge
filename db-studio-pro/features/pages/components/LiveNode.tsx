import React, { useState, useEffect, useContext } from 'react';
import { PageComponent } from '../../../types/index';
import { useProjectStore } from '../../../stores/useProjectStore';
import { executeSelectQuery } from '../../queries/utils/queryExecution';
import { LiveTable } from './LiveTable';
import { LiveForm } from './LiveForm';
import { LiveSubform } from './LiveSubform';
import { CustomComponentRunner } from './runner/CustomComponentRunner';
import { exportDataToFile } from '../../../utils/exportHelper';
import { 
    PageParamsContext, 
    PageViewContext, 
    getNestedValueCaseInsensitive, 
    resolvePlaceholders, 
    getRowLabelAndValue 
} from '../utils/pageViewUtils';
import { Loader2, AlertCircle, TrendingUp, CheckCircle, Tag, Search, Download, Check, Plus, Trash2, ArrowRight } from 'lucide-react';

interface LiveNodeProps {
    node: PageComponent;
    context?: Record<string, any>;
}

export const LiveNode: React.FC<LiveNodeProps> = ({ node, context }) => {
    const { queries, tables, relationships, pages, forms, updateTable, customComponents = [] } = useProjectStore();
    const { params, setParam } = useContext(PageParamsContext);
    const { openFormModal, showConfirm, navigate, openMacroModal, openSmartImportModal, activeRole } = useContext(PageViewContext);
    
    // Role-Based Visibility Check
    if (node.props.allowedRoles && node.props.allowedRoles.length > 0) {
        if (!activeRole || !node.props.allowedRoles.includes(activeRole)) {
            return null;
        }
    }

    const [fetchedData, setFetchedData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('');

    // Load data binding or query records
    useEffect(() => {
        if (node.type === 'dropdown' && node.props.queryId) {
            setLoading(true);
            const query = queries.find(q => q.id === node.props.queryId);
            if (query && query.type === 'SELECT') {
                const data = executeSelectQuery(query as any, tables, relationships);
                setFetchedData(data);
            }
            setLoading(false);
        } else if ((node.type === 'table_view' || node.type === 'container') && node.props.dataSourceType) {
            setLoading(true);
            try {
                if (node.props.dataSourceType === 'table' && node.props.dataSourceId) {
                    const table = tables.find(t => t.id === node.props.dataSourceId);
                    if (table) setFetchedData(table.data || []);
                } else if (node.props.dataSourceType === 'query' && node.props.dataSourceId) {
                    const query = queries.find(q => q.id === node.props.dataSourceId);
                    if (query && query.type === 'SELECT') {
                        const data = executeSelectQuery(query as any, tables, relationships);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                 console.error(err);
            }
            setLoading(false);
        } else if (node.type === 'list_repeater' && node.props.dataSourceId) {
            setLoading(true);
            try {
                if (node.props.dataSourceType === 'table') {
                    const table = tables.find(t => t.id === node.props.dataSourceId);
                    if (table) setFetchedData(table.data || []);
                } else {
                    const query = queries.find(q => q.id === node.props.dataSourceId);
                    if (query && query.type === 'SELECT') {
                        const data = executeSelectQuery(query as any, tables, relationships);
                        setFetchedData(data);
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        } else if (node.type === 'custom_component' && node.props.customComponentId) {
            setLoading(true);
            try {
                const comp = customComponents.find(c => c.id === node.props.customComponentId);
                if (comp) {
                    const conf = comp.configuration || {};
                    const dsType = conf.dataSourceType || (conf.tableId ? 'table' : '');
                    const dsId = conf.dataSourceId || conf.tableId;
                    if (dsType === 'table' && dsId) {
                        const table = tables.find(t => t.id === dsId);
                        if (table) setFetchedData(table.data || []);
                    } else if (dsType === 'query' && dsId) {
                        const query = queries.find(q => q.id === dsId);
                        if (query && query.type === 'SELECT') {
                            const data = executeSelectQuery(query as any, tables, relationships);
                            setFetchedData(data);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        }
    }, [node.type, node.props.queryId, node.props.dataSourceType, node.props.dataSourceId, node.props.customComponentId, queries, tables, relationships, customComponents]);

    // Handle conditional visibility (ngIf)
    if (node.props.visibilityField) {
        const vField = node.props.visibilityField;
        const vOperator = node.props.visibilityOperator || '==';
        const vExpected = node.props.visibilityValue || '';

        // Check in loop context first, then fallback to parameters
        let actualVal = '';
        const contextVal = context ? getNestedValueCaseInsensitive(context, vField) : undefined;
        if (contextVal !== undefined) {
            actualVal = String(contextVal);
        } else {
            const paramVal = params ? getNestedValueCaseInsensitive(params, vField) : undefined;
            if (paramVal !== undefined) {
                actualVal = String(paramVal);
            }
        }

        let isVisible = false;
        if (vOperator === '==') isVisible = (actualVal === vExpected);
        else if (vOperator === '!=') isVisible = (actualVal !== vExpected);
        else if (vOperator === '>') isVisible = (parseFloat(actualVal) > parseFloat(vExpected));
        else if (vOperator === '<') isVisible = (parseFloat(actualVal) < parseFloat(vExpected));
        else if (vOperator === 'contains') isVisible = actualVal.toLowerCase().includes(vExpected.toLowerCase());
        else if (vOperator === 'not_empty') isVisible = (actualVal !== '' && actualVal !== 'undefined' && actualVal !== 'null');
        else if (vOperator === 'empty') isVisible = (actualVal === '' || actualVal === 'undefined' || actualVal === 'null');

        if (!isVisible) return null;
    }

    let content = null;

    switch (node.type) {
        case 'grid_layout': {
            const cols = node.props.columns || 3;
            const gap = node.props.gap || 4;
            const gridColClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : cols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-3';
            content = (
                <div className={`grid ${gridColClass} gap-${gap} w-full ${node.props.className || ''}`} style={node.props.style}>
                    {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                </div>
            );
            break;
        }

        case 'tabs_container': {
            const tabs = node.props.tabs || [
                { id: 'tab1', label: 'Tab 1' },
                { id: 'tab2', label: 'Tab 2' }
            ];
            const currentTab = activeTab || node.props.defaultTab || tabs[0]?.id || 'tab1';
            content = (
                <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full ${node.props.className || ''}`} style={node.props.style}>
                    <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1">
                        {tabs.map((tab: any) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x ${
                                    currentTab === tab.id 
                                        ? 'bg-white border-slate-200 border-b-transparent text-indigo-700 -mb-[1px]' 
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-4">
                        {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                    </div>
                </div>
            );
            break;
        }

        case 'subform': {
            content = <LiveSubform node={node} context={context} />;
            break;
        }

        case 'stat_card':
        case 'kpi_widget': {
            const colorsMap: Record<string, { bg: string, text: string, ring: string, iconBg: string }> = {
                indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-700', ring: 'border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700' },
                emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', ring: 'border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700' },
                amber: { bg: 'bg-amber-50/50', text: 'text-amber-700', ring: 'border-amber-100', iconBg: 'bg-amber-100 text-amber-700' },
                rose: { bg: 'bg-rose-50/50', text: 'text-rose-700', ring: 'border-rose-100', iconBg: 'bg-rose-100 text-rose-700' },
                blue: { bg: 'bg-blue-50/50', text: 'text-blue-700', ring: 'border-blue-100', iconBg: 'bg-blue-100 text-blue-700' },
            };
            const cTheme = colorsMap[node.props.accentColor || 'indigo'] || colorsMap.indigo;
            const resolvedValue = resolvePlaceholders(node.props.value || '0', context, params);
            const resolvedLabel = resolvePlaceholders(node.props.label || 'KPI Kennzahl', context, params);

            content = (
                <div className={`p-4 rounded-xl bg-white border ${cTheme.ring} shadow-sm w-full flex items-center justify-between ${node.props.className || ''}`} style={node.props.style}>
                    <div>
                        <div className="text-xs font-semibold text-slate-500">{resolvedLabel}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                            {resolvedValue}
                            {node.props.unit && <span className="text-sm font-semibold text-slate-500">{node.props.unit}</span>}
                        </div>
                        {node.props.trend && (
                            <div className="flex items-center gap-1 mt-1 text-[11px]">
                                <span className={`font-bold ${node.props.trendDirection === 'down' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {node.props.trend}
                                </span>
                                {node.props.trendLabel && <span className="text-slate-400">{node.props.trendLabel}</span>}
                            </div>
                        )}
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${cTheme.iconBg} shrink-0`}>
                        <TrendingUp size={22} />
                    </div>
                </div>
            );
            break;
        }

        case 'alert_box': {
            const typesMap: Record<string, { bg: string, border: string, text: string, icon: any }> = {
                info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: AlertCircle },
                success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: CheckCircle },
                warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: AlertCircle },
                danger: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: AlertCircle },
            };
            const aTheme = typesMap[node.props.alertType || 'info'] || typesMap.info;
            const IconComp = aTheme.icon;

            content = (
                <div className={`p-3.5 rounded-xl border ${aTheme.border} ${aTheme.bg} ${aTheme.text} w-full flex items-start gap-2.5 ${node.props.className || ''}`} style={node.props.style}>
                    <IconComp size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                        {node.props.title && <div className="font-bold text-xs">{resolvePlaceholders(node.props.title, context, params)}</div>}
                        <div className="text-xs mt-0.5 text-slate-700">{resolvePlaceholders(node.props.message || '', context, params)}</div>
                    </div>
                </div>
            );
            break;
        }

        case 'badge_pill': {
            const pillColors: Record<string, string> = {
                emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                amber: 'bg-amber-100 text-amber-800 border-amber-200',
                rose: 'bg-rose-100 text-rose-800 border-rose-200',
                indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                blue: 'bg-blue-100 text-blue-800 border-blue-200',
                slate: 'bg-slate-100 text-slate-800 border-slate-200',
            };
            const cClass = pillColors[node.props.colorScheme || 'emerald'] || pillColors.emerald;
            const lbl = resolvePlaceholders(node.props.label || 'Status: Aktiv', context, params);

            content = (
                <div className="inline-block">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cClass}`}>
                        <Tag size={12} /> {lbl}
                    </span>
                </div>
            );
            break;
        }

        case 'action_group': {
            const actions = node.props.actions || [
                { label: 'Exportieren', icon: 'Download', variant: 'secondary' },
                { label: 'Speichern', icon: 'Check', variant: 'primary' }
            ];
            content = (
                <div className={`flex flex-wrap items-center gap-2 ${node.props.className || ''}`}>
                    {actions.map((act: any, idx: number) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => {
                                if (act.action === 'export') {
                                    exportDataToFile({
                                        title: 'Export',
                                        data: fetchedData.length > 0 ? fetchedData : (tables[0]?.data || []),
                                        format: 'CSV' as any,
                                        filename: `Export_${Date.now()}`
                                    });
                                } else if (act.action === 'navigate' && act.targetPageId) {
                                    navigate(act.targetPageId, params);
                                }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition ${
                                act.variant === 'primary' 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                    : act.variant === 'danger'
                                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {act.label}
                        </button>
                    ))}
                </div>
            );
            break;
        }

        case 'search_filter_bar':
            content = (
                <div className={`p-3 bg-white border border-slate-200 rounded-xl shadow-xs w-full space-y-2 ${node.props.className || ''}`}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                value={params.searchTerm || ''}
                                onChange={(e) => setParam('searchTerm', e.target.value)}
                                placeholder={node.props.placeholder || 'Suche nach Datensätzen...'}
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            );
            break;

        case 'row': {
             content = (
                  <div className={`w-full flex flex-row ${node.props.gap ? `gap-${node.props.gap}` : 'gap-4'} ${node.props.wrap ? 'flex-wrap' : ''} ${node.props.alignItems ? `items-${node.props.alignItems}` : 'items-start'} ${node.props.justifyContent ? `justify-${node.props.justifyContent}` : 'justify-start'} ${node.props.className || ''}`} style={node.props.style}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                  </div>
             );
             break;
        }
        case 'column': {
             content = (
                  <div className={`flex flex-col ${node.props.gap ? `gap-${node.props.gap}` : 'gap-4'} ${node.props.alignItems ? `items-${node.props.alignItems}` : 'items-stretch'} ${node.props.justifyContent ? `justify-${node.props.justifyContent}` : 'justify-start'} ${node.props.className || ''}`} style={{ flex: node.props.flex || '1 1 0%', ...node.props.style }}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                  </div>
             );
             break;
        }
        case 'card': {
             content = (
                  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${node.props.className || ''}`} style={node.props.style}>
                       {node.props.title && (
                           <div className={`px-4 py-3 border-b border-slate-200 bg-slate-50 font-medium text-slate-800 ${node.props.headerClassName || ''}`}>
                               {resolvePlaceholders(node.props.title, context, params)}
                           </div>
                       )}
                       <div className={`p-4 ${node.props.bodyClassName || ''}`}>
                          {node.children?.map(c => <LiveNode key={c.id} node={c} context={context} />)}
                       </div>
                  </div>
             );
             break;
        }
        case 'container': {
             let finalData = fetchedData;
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

             const containerContext = (finalData && finalData.length > 0)
                 ? { ...context, ...finalData[0] }
                 : context;

             content = (
                  <div className={`w-full ${node.props.className || ''}`} style={node.props.style}>
                     {node.children?.map(c => <LiveNode key={c.id} node={c} context={containerContext} />)}
                  </div>
             );
             break;
        }

        case 'text': {
             const resolvedText = resolvePlaceholders(node.props.text || '', context, params);
             content = <div className={`w-full break-words ${node.props.className || ''}`} style={node.props.style}>{resolvedText}</div>;
             break;
        }

        case 'button': {
             const handleButtonClick = (e: React.MouseEvent) => {
                 e.stopPropagation();
                 const actType = node.props.actionType;
                 console.log('Button clicked!', { actType, props: node.props, params, context });
                 if (!actType || actType === 'none') return;

                 if (actType === 'open_form' && node.props.formId) {
                     const mode = node.props.formMode || 'create';
                     const rId = mode === 'edit' ? params.selectedId : undefined;
                     
                     const defaultValues: Record<string, any> = {};
                     if (node.props.navigateTargetParams && Array.isArray(node.props.navigateTargetParams)) {
                         node.props.navigateTargetParams.forEach((m: any) => {
                             let val: any;
                             const sourceVal = context ? getNestedValueCaseInsensitive(context, m.sourceKey) : undefined;
                             if (sourceVal !== undefined) {
                                 val = sourceVal;
                             } else if (params[m.sourceKey] !== undefined) {
                                 val = params[m.sourceKey];
                             } else if (m.sourceKey === 'id' && context) {
                                 val = context.id;
                             } else {
                                 val = m.sourceKey;
                             }
                             
                             if (val !== undefined && val !== '') {
                                 defaultValues[m.targetKey] = (val !== null && !isNaN(Number(val))) ? Number(val) : val;
                             }
                         });
                     }
                     
                     if (Object.keys(defaultValues).length === 0) {
                         Object.keys(params).forEach(key => {
                             const val = params[key];
                             defaultValues[key] = (val !== null && val !== '' && !isNaN(Number(val))) ? Number(val) : val;
                         });
                     }

                     console.log('Opening modal', { formId: node.props.formId, mode, rId, defaultValues });
                     openFormModal(node.props.formId, mode, rId, undefined, defaultValues);
                 } else if (actType === 'delete_record' && node.props.targetTableId) {
                     const tableId = node.props.targetTableId;
                     const paramName = node.props.paramKey || 'selectedId';
                     const idVal = params[paramName];
                     if (!idVal) return;

                     showConfirm(
                         'Datensatz löschen',
                         `Sind Sie sicher, dass Sie den Datensatz mit ID "${idVal}" löschen möchten?`,
                         () => {
                             const targetT = tables.find(t => t.id === tableId);
                             if (targetT && targetT.data) {
                                 const pkField = targetT.fields.find(f => f.isPrimaryKey) || targetT.fields[0];
                                 const updatedData = targetT.data.filter(row => String(row[pkField?.name || 'Id']) !== String(idVal));
                                 updateTable({ ...targetT, data: updatedData });
                             }
                         }
                     );
                 } else if (actType === 'set_parameter' && node.props.paramName) {
                     const pName = node.props.paramName;
                     const pValRaw = node.props.paramValue || '';
                     const pVal = resolvePlaceholders(pValRaw, context, params);
                     setParam(pName, pVal);
                 } else if (actType === 'navigate_to_page' && node.props.targetPageId) {
                     const mappings = node.props.navigateTargetParams || [];
                     const targetParams: Record<string, any> = {};
                     mappings.forEach((m: any) => {
                         if (m.sourceKey && m.targetKey) {
                             const resolvedVal = resolvePlaceholders(m.sourceKey, context, params);
                             targetParams[m.targetKey] = resolvedVal;
                         }
                     });
                     
                     if (mappings.length === 0) {
                         if (params.selectedId) {
                             targetParams.selectedId = params.selectedId;
                             targetParams.id = params.selectedId;
                         }
                         const targetPage = pages.find(p => p.id === node.props.targetPageId);
                         const expected = targetPage?.expectedParams || [];
                         expected.forEach((pName: string) => {
                             const paramVal = params ? getNestedValueCaseInsensitive(params, pName) : undefined;
                             if (paramVal !== undefined) {
                                 targetParams[pName] = paramVal;
                             } else if (context) {
                                 const contextVal = getNestedValueCaseInsensitive(context, pName);
                                 if (contextVal !== undefined) {
                                     targetParams[pName] = contextVal;
                                 }
                             }
                         });
                     }

                     navigate(node.props.targetPageId, targetParams);
                 } else if (actType === 'run_macro') {
                     if (openMacroModal) openMacroModal();
                 } else if (actType === 'smart_import') {
                     if (openSmartImportModal) openSmartImportModal(node.props.targetTableId);
                 } else if (actType === 'export_report') {
                     const fmt = node.props.exportFormat || 'PDF';
                     const tbl = tables.find(t => t.id === node.props.targetTableId);
                     const qry = queries.find(q => q.id === node.props.queryId);
                     let dataToExport: any[] = [];
                     let title = 'Export';

                     if (tbl) {
                         dataToExport = tbl.data || [];
                         title = `Export_${tbl.name}`;
                     } else if (qry && (!qry.type || qry.type === 'SELECT')) {
                         dataToExport = executeSelectQuery(qry as any, tables, relationships);
                         title = `Export_${qry.name}`;
                     }

                     exportDataToFile({
                         title,
                         data: dataToExport,
                         format: fmt as any,
                         filename: `${title}_${Date.now()}`
                     });
                 }
             };

             content = (
                 <button 
                     onClick={handleButtonClick}
                     className={`px-4 py-2 bg-indigo-600 text-white rounded font-medium shadow-sm hover:bg-indigo-700 transition-colors m-2 ${node.props.className || ''}`} 
                     style={node.props.style}
                 >
                     {resolvePlaceholders(node.props.label || 'Button', context, params)}
                 </button>
             );
             break;
        }

        case 'dropdown': {
             let finalData = fetchedData;
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

             content = (
                  <div className={`p-2 ${node.props.className || ''}`}>
                       <select 
                           className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                           style={node.props.style}
                           onChange={(e) => {
                               if (node.props.valueField) {
                                   setParam('selectedId', e.target.value);
                               }
                           }}
                       >
                           <option value="">{node.props.placeholder || 'Bitte wählen...'}</option>
                           {loading && <option disabled>Lade Daten...</option>}
                           {!loading && finalData.map((row, idx) => {
                               const { val, label } = getRowLabelAndValue(row, node.props, idx);
                               return <option key={idx} value={val}>{label}</option>;
                           })}
                       </select>
                  </div>
             );
             break;
        }

        case 'table_view': {
             content = <LiveTable node={node} context={context} fetchedData={fetchedData} loading={loading} />;
             break;
        }

        case 'list_repeater': {
             let finalData = fetchedData;
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

             content = (
                  <div className={`w-full space-y-3 ${node.props.className || ''}`} style={node.props.style}>
                       {loading ? (
                           <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                       ) : (
                           finalData.map((row, idx) => (
                               <div key={idx} className="bg-slate-50/50 p-4 rounded-lg border border-slate-150 relative hover:border-slate-300 hover:bg-slate-50 transition">
                                   {node.children?.map(c => <LiveNode key={c.id} node={c} context={row} />)}
                               </div>
                           ))
                       )}
                       {!loading && finalData.length === 0 && (
                           <div className="text-center p-4 text-xs text-slate-400 italic">Keine Einträge für Repeater</div>
                       )}
                   </div>
             );
             break;
        }

        case 'subpage_container': {
             const subPage = pages?.find(p => p.id === node.props.subPageId);
             if (!subPage) {
                 content = (
                     <div className="p-4 bg-yellow-50 text-yellow-700 text-xs border border-yellow-200 rounded flex items-center gap-2">
                         <AlertCircle size={14} /> Keine Unterseite konfiguriert oder gefunden
                     </div>
                 );
                 break;
             }

             const mappedParams: Record<string, any> = {};
             
             // 1. Automatic Parameter takeover
             const expected = subPage.expectedParams || [];
             expected.forEach((paramName: string) => {
                 const paramVal = params ? getNestedValueCaseInsensitive(params, paramName) : undefined;
                 if (paramVal !== undefined && paramVal !== null) {
                     mappedParams[paramName] = paramVal;
                 } else if (context) {
                     const contextVal = getNestedValueCaseInsensitive(context, paramName);
                     if (contextVal !== undefined && contextVal !== null) {
                         mappedParams[paramName] = contextVal;
                     }
                 }
             });

             // 2. Explicit mappings
             const mappings = node.props.parameterMappings || [];
             for (const mapping of mappings) {
                 if (mapping.sourceKey && mapping.targetKey) {
                     const resolvedVal = mapping.sourceKey.startsWith('{{') && mapping.sourceKey.endsWith('}}')
                         ? resolvePlaceholders(mapping.sourceKey, context, params)
                         : params[mapping.sourceKey] !== undefined ? params[mapping.sourceKey] : mapping.sourceKey;
                     mappedParams[mapping.targetKey] = resolvedVal;
                 }
             }

             content = (
                 <div className="w-full bg-slate-50/20 border border-dashed border-slate-200 hover:border-slate-300 rounded-lg p-3 transition relative group">
                     <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition duration-150 flex gap-1 pointer-events-none select-none">
                         <span className="text-[8px] bg-slate-800 text-slate-300 font-mono font-bold px-1 py-0.5 rounded shadow-sm">
                             sub-page: {subPage.name}
                         </span>
                         {Object.keys(mappedParams).length > 0 && (
                             <span className="text-[8px] bg-emerald-100 text-emerald-800 font-mono font-bold px-1 py-0.5 rounded shadow-sm">
                                 params: {Object.keys(mappedParams).join(', ')}
                             </span>
                         )}
                     </div>
                     <PageParamsContext.Provider value={{ params: mappedParams, setParam: (k, v) => setParam(k, v) }}>
                         <LiveNode node={subPage.layout} context={context} />
                     </PageParamsContext.Provider>
                 </div>
             );
             break;
        }

        case 'custom_component': {
             const comp = customComponents.find(c => c.id === node.props.customComponentId);
             if (!comp) {
                 content = (
                     <div className="p-3 bg-amber-50 text-amber-700 text-xs border border-amber-200 rounded italic text-center">
                         Custom Component nicht verknüpft oder nicht gefunden
                     </div>
                 );
             } else {
                 content = (
                     <CustomComponentRunner 
                         comp={comp}
                         node={node}
                         context={context}
                         params={params}
                         setParam={setParam}
                         navigate={navigate}
                         fetchedData={fetchedData}
                         loading={loading}
                     />
                 );
             }
             break;
        }

        case 'form_view': {
             content = <LiveForm node={node} context={context} />;
             break;
        }

        case 'chart_view':
        case 'image':
        case 'html':
        case 'divider':
             content = <div className={`p-4 m-2 bg-slate-100 rounded border flex items-center justify-center border-slate-200 text-center text-sm text-slate-500 ${node.props.className || ''}`}>{node.type} Not Fully Implemented Live</div>;
             break;
    }

    return content;
};
