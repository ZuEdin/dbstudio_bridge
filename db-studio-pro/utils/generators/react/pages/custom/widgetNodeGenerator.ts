import { GeneratorContext } from './types';
import { compilePlaceholders } from './simpleNodeGenerator';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateWidgetNode = (node: any, ctx: GeneratorContext): string => {
  const { states, effects, imports } = ctx;
  const props = node.props || {};
  const nodeSuffix = (node.id || 'widget').replace(/[^a-zA-Z0-9]/g, '_');

  switch (node.type) {
    case 'grid_layout': {
      const cols = props.columns || 3;
      const gap = props.gap || 4;
      const gridColClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : cols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-3';
      const childrenStr = (node.children || []).map((c: any) => ctx.generateNode(c, ctx)).join('\n');
      return `<div className="grid ${gridColClass} gap-${gap} w-full ${props.className || ''}">${childrenStr}</div>`;
    }

    case 'tabs_container': {
      const tabs = props.tabs || [
        { id: 'tab1', label: 'Übersicht' },
        { id: 'tab2', label: 'Details' }
      ];
      const tabStateVar = `activeTab_${nodeSuffix}`;
      const defaultTab = props.defaultTab || tabs[0]?.id || 'tab1';
      states.push(`const [${tabStateVar}, set${toPascalCase(tabStateVar)}] = useState<string>('${defaultTab}');`);

      const childrenStr = (node.children || []).map((c: any) => ctx.generateNode(c, ctx)).join('\n');

      return `
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full my-3">
          <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto">
              ${tabs.map((tab: any) => `
              <button
                  type="button"
                  onClick={() => set${toPascalCase(tabStateVar)}('${tab.id}')}
                  className={\`px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x \${
                      ${tabStateVar} === '${tab.id}'
                          ? 'bg-white border-slate-200 border-b-transparent text-indigo-700 -mb-[1px]'
                          : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
                  }\`}
              >
                  ${tab.label}
              </button>`).join('\n')}
          </div>
          <div className="p-4">
              ${childrenStr}
          </div>
      </div>`;
    }

    case 'stat_card':
    case 'kpi_widget': {
      imports.add('TrendingUp');
      const colorsMap: Record<string, { ring: string, iconBg: string }> = {
        indigo: { ring: 'border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700' },
        emerald: { ring: 'border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700' },
        amber: { ring: 'border-amber-100', iconBg: 'bg-amber-100 text-amber-700' },
        rose: { ring: 'border-rose-100', iconBg: 'bg-rose-100 text-rose-700' },
        blue: { ring: 'border-blue-100', iconBg: 'bg-blue-100 text-blue-700' },
      };
      const theme = colorsMap[props.accentColor || 'indigo'] || colorsMap.indigo;
      const label = compilePlaceholders(props.label || 'KPI Kennzahl', ctx.currentContextVar);
      const value = compilePlaceholders(props.value || '0', ctx.currentContextVar);
      const unit = props.unit ? `<span className="text-sm font-semibold text-slate-500">${props.unit}</span>` : '';
      const trendHtml = props.trend ? `
      <div className="flex items-center gap-1 mt-1 text-[11px]">
          <span className="font-bold ${props.trendDirection === 'down' ? 'text-rose-600' : 'text-emerald-600'}">
              ${props.trend}
          </span>
          ${props.trendLabel ? `<span className="text-slate-400">${props.trendLabel}</span>` : ''}
      </div>` : '';

      return `
      <div className="p-4 rounded-xl bg-white border ${theme.ring} shadow-xs w-full flex items-center justify-between">
          <div>
              <div className="text-xs font-semibold text-slate-500">{${label}}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                  {${value}}
                  ${unit}
              </div>
              ${trendHtml}
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center ${theme.iconBg} shrink-0">
              <TrendingUp size={20} />
          </div>
      </div>`;
    }

    case 'alert_box': {
      imports.add('AlertCircle');
      imports.add('CheckCircle');
      const typesMap: Record<string, { bg: string, border: string, text: string, icon: string }> = {
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', icon: 'AlertCircle' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'CheckCircle' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'AlertCircle' },
        danger: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', icon: 'AlertCircle' },
      };
      const aTheme = typesMap[props.alertType || 'info'] || typesMap.info;
      const title = props.title ? `{${compilePlaceholders(props.title, ctx.currentContextVar)}}` : '';
      const message = props.message ? `{${compilePlaceholders(props.message, ctx.currentContextVar)}}` : '';

      return `
      <div className="p-3.5 rounded-xl border ${aTheme.border} ${aTheme.bg} ${aTheme.text} w-full flex items-start gap-2.5 my-2">
          <${aTheme.icon} size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
              ${props.title ? `<div className="font-bold text-xs">${title}</div>` : ''}
              <div className="text-xs mt-0.5 text-slate-700">${message}</div>
          </div>
      </div>`;
    }

    case 'badge_pill': {
      imports.add('Tag');
      const pillColors: Record<string, string> = {
        emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        amber: 'bg-amber-100 text-amber-800 border-amber-200',
        rose: 'bg-rose-100 text-rose-800 border-rose-200',
        indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        slate: 'bg-slate-100 text-slate-800 border-slate-200',
      };
      const cClass = pillColors[props.colorScheme || 'emerald'] || pillColors.emerald;
      const label = compilePlaceholders(props.label || 'Status: Aktiv', ctx.currentContextVar);

      return `
      <div className="inline-block my-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cClass}">
              <Tag size={12} /> {${label}}
          </span>
      </div>`;
    }

    case 'action_group': {
      const actions = props.actions || [
        { label: 'Exportieren', icon: 'Download', variant: 'secondary' },
        { label: 'Speichern', icon: 'Check', variant: 'primary' }
      ];
      return `
      <div className="flex flex-wrap items-center gap-2 my-2">
          ${actions.map((act: any) => {
            const btnColor = act.variant === 'primary' 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : act.variant === 'danger' 
              ? 'bg-rose-600 text-white hover:bg-rose-700' 
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
            return `
            <button
                type="button"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition ${btnColor}"
            >
                ${act.label}
            </button>`;
          }).join('\n')}
      </div>`;
    }

    case 'search_filter_bar': {
      imports.add('Search');
      return `
      <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs w-full space-y-2 my-2">
          <div className="flex items-center gap-2">
              <div className="relative flex-1">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
                  <input
                      type="text"
                      value={searchParams.get('searchTerm') || ''}
                      onChange={(e) => setSearchParams(prev => {
                          const next = new URLSearchParams(prev);
                          if (e.target.value) next.set('searchTerm', e.target.value);
                          else next.delete('searchTerm');
                          return next;
                      })}
                      placeholder="${props.placeholder || 'Suche nach Datensätzen...'}"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500"
                  />
              </div>
          </div>
      </div>`;
    }

    default:
      return '';
  }
};
