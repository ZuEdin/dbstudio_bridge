import React from 'react';
import { PageComponent } from '../../../../types/index';
import { resolvePlaceholders, getNestedValueCaseInsensitive } from '../../utils/pageViewUtils';
import { LiveForm } from '../LiveForm';
import { CustomTableViewRunner } from '../CustomTableViewRunner';
import { MetricCardRunner } from './MetricCardRunner';
import { KanbanBoardRunner } from './kanban/KanbanBoardRunner';
import { CalendarRunner } from './CalendarRunner';
import { useProjectStore } from '../../../../stores/useProjectStore';

interface CustomComponentRunnerProps {
    comp: any;
    node: PageComponent;
    context: any;
    params: any;
    setParam: (k: string, v: any) => void;
    navigate: (pageId: string, initialParams?: Record<string, any>) => void;
    fetchedData: any[];
    loading: boolean;
}

export const CustomComponentRunner: React.FC<CustomComponentRunnerProps> = ({ 
    comp, node, context, params, setParam, navigate, fetchedData, loading 
}) => {
    const conf = comp.configuration || {};

    switch (comp.type) {
        case 'table_view': {
            return (
                <CustomTableViewRunner
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

        case 'form_view': {
            const formNode = {
                id: node.id + '_form',
                type: 'form_view' as const,
                props: {
                    formId: conf.formId,
                    hideHeader: conf.hideHeader,
                    hideActions: conf.hideActions
                }
            };
            return <LiveForm node={formNode} context={context} />;
        }

        case 'text': {
            const txtSize = conf.fontSize || 'text-base';
            const txtWeight = conf.fontWeight || 'font-normal';
            const txtColor = conf.colorClass || 'text-slate-700';
            const txtAlign = conf.alignment || 'text-left';
            return (
                <div className={`w-full ${txtSize} ${txtWeight} ${txtColor} ${txtAlign} p-2 text-left`}>
                    {resolvePlaceholders(conf.text || '', context, params)}
                </div>
            );
        }

        case 'button': {
            const handleButtonClick = () => {
                if (conf.actionType === 'navigate' && conf.targetPageId) {
                    navigate(conf.targetPageId);
                } else if (conf.actionType === 'setParam' && conf.targetParamKey) {
                    setParam(conf.targetParamKey, conf.targetParamVal);
                }
            };
            return (
                <div className="text-left">
                    <button 
                        onClick={handleButtonClick}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded font-medium shadow-sm hover:bg-indigo-700 transition-colors m-2 ${
                            conf.variant === 'secondary' ? 'bg-slate-100 text-slate-700 border hover:bg-slate-200' :
                            conf.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                            conf.variant === 'outline' ? 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' : ''
                        }`}
                    >
                        {conf.label || 'Aktions-Button'}
                    </button>
                </div>
            );
        }

        case 'dropdown': {
            return (
                <div className="p-2 w-full text-left">
                    {conf.label && <label className="block text-xs font-semibold text-slate-600 mb-1">{conf.label}</label>}
                    <select 
                        className="border border-slate-300 rounded px-3 py-2 bg-white w-full max-w-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs text-slate-800"
                        onChange={(e) => {
                            if (conf.valueField) {
                                setParam('selectedId', e.target.value);
                            }
                        }}
                    >
                        <option value="">{conf.placeholder || '-- Bitte wählen --'}</option>
                        {fetchedData.map((row, idx) => {
                            const val = getNestedValueCaseInsensitive(row, conf.valueField || 'id');
                            const lbl = getNestedValueCaseInsensitive(row, conf.displayField || 'Name');
                            return <option key={idx} value={val}>{lbl}</option>;
                        })}
                    </select>
                </div>
            );
        }

        case 'metric_card': {
            return (
                <MetricCardRunner
                    conf={conf}
                    fetchedData={fetchedData}
                    loading={loading}
                />
            );
        }

        case 'kanban_board': {
            return (
                <KanbanBoardRunner
                    conf={conf}
                    fetchedData={fetchedData}
                    loading={loading}
                    setParam={setParam}
                />
            );
        }

        case 'layout_container': {
            const layoutType = conf.layoutType || 'row';
            const gap = conf.gap || 'gap-4';
            const padding = conf.padding || 'p-4';
            const bgStyle = conf.bgStyle || 'bg-white dark:bg-slate-900';
            const shadow = conf.shadow || 'shadow-sm';
            const borderStyle = conf.borderStyle || '';
            const children = conf.children || [];

            const getGridClass = () => {
                const c = conf.cols || 3;
                if (c === 1) return 'grid-cols-1';
                if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
                if (c === 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
                if (c === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
                if (c === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
                return 'grid-cols-1 sm:grid-cols-3';
            };

            const containerClasses = layoutType === 'grid'
                ? `grid ${getGridClass()} ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
                : layoutType === 'col'
                    ? `flex flex-col ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`
                    : `flex flex-col sm:flex-row flex-wrap sm:items-stretch ${gap} ${padding} ${bgStyle} ${shadow} ${borderStyle}`;

            // We need useProjectStore to resolve references
            const store = useProjectStore();
            const { customComponents = [] } = store;

            return (
                <div className={`${containerClasses} transition-all text-left w-full`}>
                    {children.map((child: any, cIdx: number) => {
                        const widthClass = layoutType === 'row' ? (child.width || 'flex-1') : 'w-full';
                        return (
                            <div key={child.id || cIdx} className={`${widthClass} min-w-0 flex flex-col justify-center`}>
                                {child.type === 'text' && (
                                    <div className={`${child.config?.fontSize || 'text-xs'} ${child.config?.fontWeight || 'font-normal'} ${child.config?.colorClass || 'text-slate-700 dark:text-slate-300'} ${child.config?.alignment || 'text-left'} leading-relaxed`}>
                                        {resolvePlaceholders(child.config?.text || '', context, params)}
                                    </div>
                                )}

                                {child.type === 'button' && (
                                    <div className="py-1">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const btnConf = child.config || {};
                                                if (btnConf.actionType === 'navigate' && btnConf.targetPageId) {
                                                    navigate(btnConf.targetPageId);
                                                } else if (btnConf.actionType === 'setParam' && btnConf.targetParamKey) {
                                                    setParam(btnConf.targetParamKey, btnConf.targetParamVal);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:scale-[1.01] transition-transform ${
                                                child.config?.variant === 'danger'
                                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                                    : child.config?.variant === 'secondary'
                                                        ? 'bg-slate-200 hover:bg-slate-350 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                                                        : child.config?.variant === 'outline'
                                                            ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            {child.config?.label || 'Aktion'}
                                        </button>
                                    </div>
                                )}

                                {child.type === 'metric_card' && (() => {
                                    const theme = child.config?.themeColor || 'indigo';
                                    const themeClasses: Record<string, string> = {
                                        indigo: 'border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400',
                                        emerald: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
                                        rose: 'border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400',
                                        amber: 'border-amber-100 dark:border-amber-950 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
                                    };
                                    return (
                                        <div className={`p-3 rounded-xl border ${themeClasses[theme] || themeClasses.indigo} flex flex-col justify-center min-h-[64px]`}>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{child.config?.title || 'Kennzahl'}</span>
                                            <span className="text-base font-bold text-slate-800 dark:text-white mt-0.5 truncate">
                                                {child.config?.customValue || '0'}{child.config?.suffix || ''}
                                            </span>
                                        </div>
                                    );
                                })()}

                                {child.type === 'component_ref' && (() => {
                                    const referenced = customComponents.find(c => c.id === child.config?.refComponentId);
                                    if (!referenced) return null;
                                    return (
                                        <CustomComponentRunner
                                            comp={referenced}
                                            node={node}
                                            context={context}
                                            params={params}
                                            setParam={setParam}
                                            navigate={navigate}
                                            fetchedData={fetchedData}
                                            loading={loading}
                                        />
                                    );
                                })()}
                            </div>
                        );
                    })}
                </div>
            );
        }

        case 'calendar_view': {
            return (
                <CalendarRunner
                    comp={comp}
                    node={node}
                    fetchedData={fetchedData}
                    loading={loading}
                    setParam={setParam}
                />
            );
        }

        default:
            return (
                <div className="p-3 bg-slate-50 text-slate-500 text-xs italic border rounded text-center">
                    [Custom Component {comp.name} ({comp.type}) geladen]
                </div>
            );
    }
};
export default CustomComponentRunner;
