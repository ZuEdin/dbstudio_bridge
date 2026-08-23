import { NodeGeneratorContext } from './types';
import { compileAngularPlaceholders } from './basicNodes';
import { toCamelCase, toPascalCase } from '../../../common';

export const generateWidgetNode = (node: any, context: NodeGeneratorContext, generateNodeFn: (n: any, ctx: NodeGeneratorContext) => string): string => {
  const { states, isBootstrap } = context;
  const props = node.props || {};
  const nodeSuffix = (node.id || 'widget').replace(/[^a-zA-Z0-9]/g, '_');

  switch (node.type) {
    case 'grid_layout': {
      const cols = props.columns || 3;
      const gap = props.gap || 4;
      const childrenStr = (node.children || []).map((c: any) => generateNodeFn(c, context)).join('\n');
      
      if (isBootstrap) {
        return `<div class="row row-cols-1 row-cols-md-${cols} g-${gap} w-100 ${props.className || ''}">${childrenStr}</div>`;
      }
      const gridColClass = cols === 2 ? 'grid-cols-1 md:grid-cols-2' : cols === 4 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' : cols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-1 md:grid-cols-3';
      return `<div class="grid ${gridColClass} gap-${gap} w-full ${props.className || ''}">${childrenStr}</div>`;
    }

    case 'tabs_container': {
      const tabs = props.tabs || [
        { id: 'tab1', label: 'Übersicht' },
        { id: 'tab2', label: 'Details' }
      ];
      const tabStateVar = `activeTab_${nodeSuffix}`;
      const defaultTab = props.defaultTab || tabs[0]?.id || 'tab1';
      states.push(`${tabStateVar}: string = '${defaultTab}';`);

      const childrenStr = (node.children || []).map((c: any) => generateNodeFn(c, context)).join('\n');

      if (isBootstrap) {
        return `
        <div class="card shadow-sm border rounded-3 overflow-hidden w-100 my-3 ${props.className || ''}">
            <ul class="nav nav-tabs bg-light px-3 pt-2 border-bottom">
                ${tabs.map((tab: any) => `
                <li class="nav-item">
                    <button
                        type="button"
                        (click)="${tabStateVar} = '${tab.id}'"
                        class="nav-link"
                        [ngClass]="{'active fw-bold text-primary': ${tabStateVar} === '${tab.id}', 'text-secondary': ${tabStateVar} !== '${tab.id}'}"
                    >
                        ${tab.label}
                    </button>
                </li>`).join('\n')}
            </ul>
            <div class="card-body p-3">
                ${childrenStr}
            </div>
        </div>`;
      }

      return `
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full my-3 ${props.className || ''}">
          <div class="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto">
              ${tabs.map((tab: any) => `
              <button
                  type="button"
                  (click)="${tabStateVar} = '${tab.id}'"
                  class="px-4 py-2 text-xs font-bold rounded-t-lg transition border-t border-x"
                  [ngClass]="${tabStateVar} === '${tab.id}' ? 'bg-white border-slate-200 border-b-transparent text-indigo-700 -mb-[1px]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'"
              >
                  ${tab.label}
              </button>`).join('\n')}
          </div>
          <div class="p-4">
              ${childrenStr}
          </div>
      </div>`;
    }

    case 'stat_card':
    case 'kpi_widget': {
      const colorsMap: Record<string, { ring: string, iconBg: string, bsBorder: string, bsBg: string }> = {
        indigo: { ring: 'border-indigo-100', iconBg: 'bg-indigo-100 text-indigo-700', bsBorder: 'border-primary', bsBg: 'bg-primary text-white' },
        emerald: { ring: 'border-emerald-100', iconBg: 'bg-emerald-100 text-emerald-700', bsBorder: 'border-success', bsBg: 'bg-success text-white' },
        amber: { ring: 'border-amber-100', iconBg: 'bg-amber-100 text-amber-700', bsBorder: 'border-warning', bsBg: 'bg-warning text-dark' },
        rose: { ring: 'border-rose-100', iconBg: 'bg-rose-100 text-rose-700', bsBorder: 'border-danger', bsBg: 'bg-danger text-white' },
        blue: { ring: 'border-blue-100', iconBg: 'bg-blue-100 text-blue-700', bsBorder: 'border-info', bsBg: 'bg-info text-dark' },
      };
      const theme = colorsMap[props.accentColor || 'indigo'] || colorsMap.indigo;
      const label = compileAngularPlaceholders(props.label || 'KPI Kennzahl', context.currentContextVar);
      const value = compileAngularPlaceholders(props.value || '0', context.currentContextVar);
      const unit = props.unit ? `<span class="text-secondary small fw-bold">${props.unit}</span>` : '';

      if (isBootstrap) {
        return `
        <div class="card p-3 shadow-sm border ${theme.bsBorder} rounded-3 w-100 d-flex flex-row align-items-center justify-content-between my-2">
            <div>
                <div class="small fw-semibold text-muted text-uppercase">${label}</div>
                <div class="fs-4 fw-bold text-dark mt-1 d-flex align-items-baseline gap-1">
                    ${value}
                    ${unit}
                </div>
                ${props.trend ? `
                <div class="small mt-1 text-muted">
                    <span class="fw-bold ${props.trendDirection === 'down' ? 'text-danger' : 'text-success'}">${props.trend}</span>
                    ${props.trendLabel ? `<span class="ms-1">${props.trendLabel}</span>` : ''}
                </div>` : ''}
            </div>
            <div class="rounded-3 p-2.5 d-flex align-items-center justify-content-center ${theme.bsBg}">
                📈
            </div>
        </div>`;
      }

      return `
      <div class="p-4 rounded-xl bg-white border ${theme.ring} shadow-xs w-full flex items-center justify-between my-2">
          <div>
              <div class="text-xs font-semibold text-slate-500">${label}</div>
              <div class="text-2xl font-bold text-slate-900 mt-1 flex items-baseline gap-1">
                  ${value}
                  ${props.unit ? `<span class="text-sm font-semibold text-slate-500">${props.unit}</span>` : ''}
              </div>
              ${props.trend ? `
              <div class="flex items-center gap-1 mt-1 text-[11px]">
                  <span class="font-bold ${props.trendDirection === 'down' ? 'text-rose-600' : 'text-emerald-600'}">
                      ${props.trend}
                  </span>
                  ${props.trendLabel ? `<span class="text-slate-400">${props.trendLabel}</span>` : ''}
              </div>` : ''}
          </div>
          <div class="w-11 h-11 rounded-xl flex items-center justify-center ${theme.iconBg} shrink-0 text-lg">
              📈
          </div>
      </div>`;
    }

    case 'alert_box': {
      const typesMap: Record<string, { bg: string, border: string, text: string, bsClass: string, icon: string }> = {
        info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', bsClass: 'alert-info', icon: 'ℹ️' },
        success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', bsClass: 'alert-success', icon: '✓' },
        warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', bsClass: 'alert-warning', icon: '⚠️' },
        danger: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', bsClass: 'alert-danger', icon: '⚠️' },
      };
      const aTheme = typesMap[props.alertType || 'info'] || typesMap.info;
      const title = props.title ? compileAngularPlaceholders(props.title, context.currentContextVar) : '';
      const message = props.message ? compileAngularPlaceholders(props.message, context.currentContextVar) : '';

      if (isBootstrap) {
        return `
        <div class="alert ${aTheme.bsClass} d-flex align-items-start gap-2 my-2 py-2 px-3 rounded-3">
            <span class="fs-5">${aTheme.icon}</span>
            <div>
                ${props.title ? `<div class="fw-bold small">${title}</div>` : ''}
                <div class="small">${message}</div>
            </div>
        </div>`;
      }

      return `
      <div class="p-3.5 rounded-xl border ${aTheme.border} ${aTheme.bg} ${aTheme.text} w-full flex items-start gap-2.5 my-2">
          <span class="text-sm shrink-0 mt-0.5">${aTheme.icon}</span>
          <div class="flex-1">
              ${props.title ? `<div class="font-bold text-xs">${title}</div>` : ''}
              <div class="text-xs mt-0.5 text-slate-700">${message}</div>
          </div>
      </div>`;
    }

    case 'badge_pill': {
      const pillColors: Record<string, { tw: string, bs: string }> = {
        emerald: { tw: 'bg-emerald-100 text-emerald-800 border-emerald-200', bs: 'bg-success' },
        amber: { tw: 'bg-amber-100 text-amber-800 border-amber-200', bs: 'bg-warning text-dark' },
        rose: { tw: 'bg-rose-100 text-rose-800 border-rose-200', bs: 'bg-danger' },
        indigo: { tw: 'bg-indigo-100 text-indigo-800 border-indigo-200', bs: 'bg-primary' },
        blue: { tw: 'bg-blue-100 text-blue-800 border-blue-200', bs: 'bg-info text-dark' },
        slate: { tw: 'bg-slate-100 text-slate-800 border-slate-200', bs: 'bg-secondary' },
      };
      const cClass = pillColors[props.colorScheme || 'emerald'] || pillColors.emerald;
      const label = compileAngularPlaceholders(props.label || 'Status: Aktiv', context.currentContextVar);

      if (isBootstrap) {
        return `
        <div class="d-inline-block my-1">
            <span class="badge ${cClass.bs} rounded-pill px-2.5 py-1.5 small">
                🏷 ${label}
            </span>
        </div>`;
      }

      return `
      <div class="inline-block my-1">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cClass.tw}">
              🏷 ${label}
          </span>
      </div>`;
    }

    case 'action_group': {
      const actions = props.actions || [
        { label: 'Exportieren', icon: 'Download', variant: 'secondary' },
        { label: 'Speichern', icon: 'Check', variant: 'primary' }
      ];

      if (isBootstrap) {
        return `
        <div class="d-flex flex-wrap align-items-center gap-2 my-2">
            ${actions.map((act: any) => {
              const btnClass = act.variant === 'primary' ? 'btn-primary' : act.variant === 'danger' ? 'btn-danger' : 'btn-outline-secondary';
              return `<button type="button" class="btn btn-sm ${btnClass} shadow-sm">${act.label}</button>`;
            }).join('\n')}
        </div>`;
      }

      return `
      <div class="flex flex-wrap items-center gap-2 my-2">
          ${actions.map((act: any) => {
            const btnColor = act.variant === 'primary' 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : act.variant === 'danger' 
              ? 'bg-rose-600 text-white hover:bg-rose-700' 
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
            return `
            <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition ${btnColor}"
            >
                ${act.label}
            </button>`;
          }).join('\n')}
      </div>`;
    }

    case 'search_filter_bar': {
      if (isBootstrap) {
        return `
        <div class="card p-2 bg-white shadow-sm border rounded-3 w-100 my-2">
            <div class="input-group input-group-sm">
                <span class="input-group-text bg-light">🔍</span>
                <input
                    type="text"
                    [ngModel]="queryParams['searchTerm'] || ''"
                    (ngModelChange)="queryParams['searchTerm'] = $event"
                    placeholder="${props.placeholder || 'Suche nach Datensätzen...'}"
                    class="form-control"
                />
            </div>
        </div>`;
      }

      return `
      <div class="p-3 bg-white border border-slate-200 rounded-xl shadow-xs w-full space-y-2 my-2">
          <div class="flex items-center gap-2">
              <div class="relative flex-1">
                  <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
                  <input
                      type="text"
                      [ngModel]="queryParams['searchTerm'] || ''"
                      (ngModelChange)="queryParams['searchTerm'] = $event"
                      placeholder="${props.placeholder || 'Suche nach Datensätzen...'}"
                      class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
              </div>
          </div>
      </div>`;
    }

    default:
      return '';
  }
};
