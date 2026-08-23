import React from 'react';
import { TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart } from 'lucide-react';
import { getNestedValueCaseInsensitive } from '../../utils/pageViewUtils';

interface MetricCardRunnerProps {
    conf: any;
    fetchedData: any[];
    loading: boolean;
}

export const MetricCardRunner: React.FC<MetricCardRunnerProps> = ({ conf, fetchedData, loading }) => {
    const theme = conf.themeColor || 'indigo';
    const themeClasses: Record<string, string> = {
        indigo: 'bg-indigo-50/40 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400',
        emerald: 'bg-emerald-50/40 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400',
        rose: 'bg-rose-50/40 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400',
        sky: 'bg-sky-50/40 border-sky-100 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900/40 dark:text-sky-400',
        amber: 'bg-amber-50/40 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400',
        slate: 'bg-slate-50/40 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-800 dark:text-slate-400'
    };

    const iconBgClasses: Record<string, string> = {
        indigo: 'bg-indigo-100 dark:bg-indigo-900/40',
        emerald: 'bg-emerald-100 dark:bg-emerald-900/40',
        rose: 'bg-rose-100 dark:bg-rose-900/40',
        sky: 'bg-sky-100 dark:bg-sky-900/40',
        amber: 'bg-amber-100 dark:bg-amber-900/40',
        slate: 'bg-slate-200 dark:bg-slate-800'
    };

    const IconDict: Record<string, any> = {
        TrendingUp, Users, DollarSign, Activity, Calendar, Percent, Award, ShoppingCart
    };
    const MetricIcon = IconDict[conf.iconName || 'TrendingUp'] || TrendingUp;

    // Runtime calculation on fetchedData
    const getComputedVal = () => {
        if (conf.aggType === 'custom') return conf.customValue || '0';
        if (!fetchedData || fetchedData.length === 0) return '0';
        if (conf.aggType === 'count') return fetchedData.length.toString();

        const f = conf.aggField;
        if (!f) return '0';

        const numbers = fetchedData.map(r => Number(getNestedValueCaseInsensitive(r, f))).filter(val => !isNaN(val));
        if (numbers.length === 0) return '0,00';

        let res = 0;
        if (conf.aggType === 'sum') {
            res = numbers.reduce((a, b) => a + b, 0);
        } else if (conf.aggType === 'avg') {
            res = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        } else if (conf.aggType === 'min') {
            res = Math.min(...numbers);
        } else if (conf.aggType === 'max') {
            res = Math.max(...numbers);
        }

        return res.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading) {
        return (
            <div className="p-4 w-full flex justify-center text-left" id={`metric-loading-${conf.title || 'card'}`}>
                <div className="w-full max-w-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 animate-pulse rounded-2xl p-5 h-28"></div>
            </div>
        );
    }

    return (
        <div className="p-4 w-full flex justify-center text-left" id={`metric-card-${conf.title || 'card'}`}>
            <div className={`w-full max-w-sm border-2 p-5 rounded-2xl shadow-sm ${themeClasses[theme] || themeClasses.indigo}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {conf.title || 'Kennzahl'}
                        </p>
                        <h4 className="text-3xl font-bold tracking-tight mt-1 text-slate-900 dark:text-white font-sans">
                            {conf.prefix || ''}{getComputedVal()}{conf.suffix || ''}
                        </h4>
                    </div>
                    <div className={`p-2.5 rounded-xl ${iconBgClasses[theme] || iconBgClasses.indigo}`}>
                        <MetricIcon size={18} className={themeClasses[theme]?.split(' ')[2]} />
                    </div>
                </div>
                {conf.subtext && (
                    <div className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{conf.subtext}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
