import { Table, Form, Report, VirtualFile, BackendConfig, Query, CustomPage } from '../../../../types/index';
import { toPascalCase, toCamelCase } from '../../common';

export const generateSidebar = (
  tables: Table[],
  forms: Form[],
  reports: Report[],
  config: BackendConfig,
  root: string,
  queries: Query[] = [],
  pages: CustomPage[] = [],
  useAuth: boolean,
  wl: any
): VirtualFile => {
  let sidebarMainContent = '';
  
  if (config.navigationConfig && config.navigationConfig.length > 0) {
      const compileItem = (item: any, indent = 12): string => {
          const requiredRoles = item.requiredRoles || [];
          const rolesStr = requiredRoles.map((r: any) => `'${r}'`).join(', ');
          const hasRolesCheck = useAuth && requiredRoles.length > 0;
          const checkStart = hasRolesCheck ? `{user && [${rolesStr}].includes(user.role) && (` : '';
          const checkEnd = hasRolesCheck ? ')}' : '';

          let iconName = 'BookOpen';
          if (item.icon === 'home') iconName = 'Home';
          else if (item.icon === 'database') iconName = 'Database';
          else if (item.icon === 'search') iconName = 'Search';
          else if (item.icon === 'file-text') iconName = 'FileText';
          else if (item.icon === 'form') iconName = 'Layout';
          else if (item.icon === 'calendar') iconName = 'Calendar';
          else if (item.icon === 'chart') iconName = 'PieChart';
          else if (item.icon === 'shield') iconName = 'Shield';
          else if (item.icon === 'settings') iconName = 'Sun';
          else if (item.icon === 'folder') iconName = 'Table';

          if (item.type === 'folder') {
              const childrenJsx = (item.children || []).map((c: any) => compileItem(c, indent + 4)).join('\n');
              return `${checkStart}
              <div className="mt-4">
                  <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                       <Table size={12}/> {getLabel(${JSON.stringify(item)})}
                  </div>
                  <div className="space-y-1 pl-3 border-l border-white/5">
                      ${childrenJsx}
                  </div>
              </div>
              ${checkEnd}`;
          } else {
              let realRoute = item.route;
              if (item.targetType === 'form' && item.targetId) {
                const f = forms.find(x => x.id === item.targetId);
                if (f) realRoute = `/forms/${toPascalCase(f.name).toLowerCase()}Form/1`;
              } else if (item.targetType === 'report' && item.targetId) {
                const r = reports.find(x => x.id === item.targetId);
                if (r) realRoute = `/reports/${toCamelCase(r.name)}`;
              } else if (item.targetType === 'table' && item.targetId) {
                const t = tables.find(x => x.id === item.targetId);
                if (t) realRoute = `/${toCamelCase(t.name)}`;
              } else if (item.targetType === 'query' && item.targetId) {
                const q = queries.find(x => x.id === item.targetId);
                if (q) realRoute = `/queries/${toCamelCase(q.name)}`;
              } else if ((item.targetType === 'page' || item.targetType === 'custom_page') && item.targetId) {
                const p = pages.find(x => x.id === item.targetId);
                if (p) realRoute = `/custom/${toCamelCase(p.name)}`;
              }
              const badgeHtml = item.badgeCountQuery ? `
                  <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full animate-pulse shadow-sm">
                    {(${JSON.stringify(item.badgeCountQuery)}.length % 5) + 3}
                  </span>
              ` : '';
              return `${checkStart}
              <Link to="${realRoute}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('${realRoute}')}\`}>
                  <${iconName} size={16}/> <span>{getLabel(${JSON.stringify(item)})}</span>
                  ${badgeHtml}
              </Link>
              ${checkEnd}`;
          }
      };
      
      sidebarMainContent = config.navigationConfig.map(it => compileItem(it)).join('\n');

      const isQueryInNav = (q: Query, items: any[]): boolean => {
        for (const item of items) {
          if ((item.targetType === 'query' && item.targetId === q.id) ||
              (item.route && item.route.includes(toCamelCase(q.name)))) {
            return true;
          }
          if (item.children && isQueryInNav(q, item.children)) return true;
        }
        return false;
      };

      const isFormInNav = (f: Form, items: any[]): boolean => {
        for (const item of items) {
          if ((item.targetType === 'form' && item.targetId === f.id) ||
              (item.route && item.route.includes(toPascalCase(f.name).toLowerCase()))) {
            return true;
          }
          if (item.children && isFormInNav(f, item.children)) return true;
        }
        return false;
      };

      const unmappedQueries = queries.filter(q => (q.type === 'SELECT' || q.type === 'UPDATE' || !q.type) && !isQueryInNav(q, config.navigationConfig || []));
      if (unmappedQueries.length > 0) {
        sidebarMainContent += `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Abfragen</div>
                <div className="space-y-1">
                ${unmappedQueries.map(q => {
                    const iconName = q.type === 'UPDATE' ? 'RefreshCw' : 'Search';
                    return `
                    <Link to="/queries/${toCamelCase(q.name)}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/queries/${toCamelCase(q.name)}')}\`}>
                        <${iconName} size={16}/> ${q.name}
                    </Link>`;
                }).join('\n')}
                </div>
            </div>
        `;
      }

      const unmappedForms = forms.filter(f => !isFormInNav(f, config.navigationConfig || []));
      if (unmappedForms.length > 0) {
        sidebarMainContent += `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Formulare</div>
                <div className="space-y-1">
                ${unmappedForms.map(f => {
                    const formSlug = toPascalCase(f.name).toLowerCase();
                    return `
                    <Link to="/forms/${formSlug}Form/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/forms/${formSlug}Form')}\`}>
                        <Layout size={16}/> ${f.name}
                    </Link>`;
                }).join('\n')}
                </div>
            </div>
        `;
      }
  } else {
      sidebarMainContent = `
            {/* Forms */}
            ${forms.length > 0 ? `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Formulare</div>
                <div className="space-y-1">
                ${forms.map(f => {
                    const formSlug = toPascalCase(f.name).toLowerCase();
                    return `
                    <Link to="/forms/${formSlug}Form/new" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/forms/${formSlug}Form')}\`}>
                        <Layout size={16}/> ${f.name}
                    </Link>`;
                }).join('\n')}
                </div>
            </div>
            ` : ''}

            {/* Custom Pages */}
            ${pages.filter(p => !p.isSubpage).length > 0 ? `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Eigene Seiten</div>
                <div className="space-y-1">
                ${pages.filter(p => !p.isSubpage).map(p => `
                    <Link to="/custom/${toCamelCase(p.name)}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/custom/${toCamelCase(p.name)}')}\`}>
                        <Layout size={16}/> ${p.name}
                    </Link>`).join('\n')}
                </div>
            </div>
            ` : ''}

            {/* Reports */}
            ${reports.length > 0 ? `
            <div>
                <div className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Berichte</div>
                <div className="space-y-1">
                ${reports.map(r => `
                    <Link to="/reports/${toCamelCase(r.name)}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/reports/${toCamelCase(r.name)}')}\`}>
                        <FileText size={16}/> ${r.name}
                    </Link>`).join('\n')}
                </div>
            </div>
            ` : ''}

            {/* Tables */}
            ${tables.length > 0 ? `
            <div>
                <button 
                    type="button" 
                    onClick={() => setTablesOpen(!tablesOpen)} 
                    className="w-full px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between hover:text-white transition"
                >
                    <span className="flex items-center gap-2"><Table size={14}/> Tabellen (${tables.length})</span>
                    {tablesOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {tablesOpen && (
                    <div className="space-y-1 pl-2 border-l border-slate-700/50 ml-3">
                    ${tables.map(t => {
                        const isSystem = t.name.startsWith('sys_');
                        const cond = isSystem && useAuth ? `{user?.role === 'Admin' && (` : ``;
                        const closeCond = isSystem && useAuth ? `)}` : ``;
                        return `${cond}
                        <Link to="/${toCamelCase(t.name)}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/${toCamelCase(t.name)}')}\`}>
                            ${isSystem ? '<Shield size={16}/>' : '<Table size={16}/>'} ${t.name}
                        </Link>${closeCond}`;
                    }).join('\n')}
                    </div>
                )}
            </div>
            ` : ''}
            
            {/* Queries */}
            ${queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').length > 0 ? `
            <div>
                <button 
                    type="button" 
                    onClick={() => setQueriesOpen(!queriesOpen)} 
                    className="w-full px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between hover:text-white transition"
                >
                    <span className="flex items-center gap-2"><Search size={14}/> Abfragen (${queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').length})</span>
                    {queriesOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                </button>
                {queriesOpen && (
                    <div className="space-y-1 pl-2 border-l border-slate-700/50 ml-3">
                    ${queries.filter(q => q.type === 'SELECT' || q.type === 'UPDATE').map(q => {
                        const iconName = q.type === 'UPDATE' ? 'RefreshCw' : 'Search';
                        return `
                        <Link to="/queries/${toCamelCase(q.name)}" onClick={() => { if (window.innerWidth < 1024) onClose(); }} className={\`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all \${isActive('/queries/${toCamelCase(q.name)}')}\`}>
                            <${iconName} size={16}/> ${q.name}
                        </Link>`;
                    }).join('\n')}
                    </div>
                )}
            </div>
            ` : ''}
      `;
  }

  const sidebarTsx = `import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Table, Layout, FileText, Search, Database, Moon, Sun, X, Menu, LogOut, Shield, User, PieChart, Home, Calendar, Globe, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useTheme } from './theme-provider';
${useAuth ? "import { useAuth } from '../context/AuthContext';" : ""}

export const Sidebar = ({ isOpen, onClose, isTopNav }: { isOpen: boolean; onClose: () => void; isTopNav?: boolean }) => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  const [tablesOpen, setTablesOpen] = useState(false);
  const [queriesOpen, setQueriesOpen] = useState(false);
  ${useAuth ? "const { logout, user } = useAuth();" : ""}
  
  const isActive = (path: string) => location.pathname.startsWith(path) ? 'bg-[${wl.primaryColor}] text-white shadow-lg font-bold' : 'text-slate-300 hover:bg-slate-800 hover:text-white';

  const getLabel = (item: any) => {
    return item.translations?.[lang] || item.title;
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'de' ? 'en' : lang === 'en' ? 'fr' : 'de';
    localStorage.setItem('app_lang', nextLang);
    setLang(nextLang);
  };

  const isDoubleRail = ${config.navigationPreset === 'double_rail' ? 'true' : 'false'};

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      <aside className={\`fixed inset-y-0 left-0 z-50 \${isDoubleRail ? 'w-72' : 'w-64'} bg-[${wl.secondaryColor}] text-slate-100 flex flex-col transition-transform duration-300 \${isOpen ? 'translate-x-0' : (isTopNav ? '-translate-x-full' : '-translate-x-full lg:translate-x-0 lg:static')}\`}>
        
        {/* Simple visual Double Rail ribbon effect decoration */}
        {isDoubleRail && (
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-black/15 flex flex-col items-center py-6 gap-6 border-r border-white/5">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20">
              <Database size={20} className="text-white"/>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/15" onClick={toggleLanguage}>
              <Globe size={18} className="text-slate-400" />
            </div>
          </div>
        )}

        <div className={\`p-6 font-bold text-xl border-b border-white/10 flex items-center justify-between \${isDoubleRail ? 'pl-20' : ''}\`}>
            <div className="flex items-center gap-2">
                ${wl.logoUrl ? `<img src="${wl.logoUrl}" alt="Logo" className="w-8 h-8 object-contain" />` : 
                `<div className="w-8 h-8 bg-[${wl.primaryColor}] rounded-lg flex items-center justify-center shadow-lg"><Database size={18} className="text-white"/></div>`}
                <span>${wl.appName}</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400"><X size={20}/></button>
        </div>
        
        <div className={\`flex-1 overflow-y-auto p-4 space-y-6 \${isDoubleRail ? 'pl-20' : ''}\`}>
            ${sidebarMainContent}
        </div>

        <div className={\`p-4 border-t border-white/10 text-center space-y-2 \${isDoubleRail ? 'pl-20' : ''}\`}>
            ${useAuth ? `<div className="text-xs text-slate-400 mb-2">Eingeloggt als: {user?.username} ({user?.role})</div>
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors mb-2">
                <User size={16} /> Profil
            </Link>
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full bg-red-600/20 hover:bg-red-600/40 text-red-200 py-2 rounded-lg text-sm font-medium transition-colors">
                <LogOut size={16} /> Abmelden
            </button>` : ''}
            
            <div className="grid grid-cols-2 gap-1">
              <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors"
                  title="Design anpassen"
              >
                  {theme === 'dark' ? <><Sun size={12} /> Light</> : <><Moon size={12} /> Dark</>}
              </button>
              
              <button 
                  onClick={toggleLanguage}
                  className="flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-[11px] font-bold transition-colors uppercase"
                  title="Sprache wechseln"
              >
                  <Globe size={12} />
                  <span>{lang}</span>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 pt-2 flex items-center justify-center gap-1">
                <span>&copy; ${wl.companyName}</span>
                <span className="font-bold underline cursor-pointer" onClick={() => (window as any).dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>Strg+K</span>
            </div>
        </div>
      </aside>
    </>
  );
};`;

  return { name: 'Sidebar.tsx', path: `${root}/src/components/Sidebar.tsx`, content: sidebarTsx, language: 'typescript' };
};

export const generateTopNav = (root: string, useAuth: boolean): VirtualFile => {
  const topNavTsx = `import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { NavigationItem } from '../types';
${useAuth ? "import { useAuth } from '../context/AuthContext';" : ""}

interface TopNavProps {
  items: NavigationItem[];
}

export const TopNav: React.FC<TopNavProps> = ({ items }) => {
  const location = useLocation();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  ${useAuth ? "const { user } = useAuth();" : ""}

  useEffect(() => {
    const handleLangChange = () => {
      setLang(localStorage.getItem('app_lang') || 'de');
    };
    window.addEventListener('storage', handleLangChange);
    const interval = setInterval(handleLangChange, 500);
    return () => {
      window.removeEventListener('storage', handleLangChange);
      clearInterval(interval);
    };
  }, []);

  const getLabel = (item: any) => {
    return item.translations?.[lang] || item.title;
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const hasAccess = (item: NavigationItem) => {
    const requiredRoles = item.requiredRoles || [];
    if (requiredRoles.length === 0) return true;
    ${useAuth ? "return user && requiredRoles.includes(user.role);" : "return true;"}
  };

  const getIconComponent = (name: string, size = 14) => {
    let iconName = 'BookOpen';
    if (name === 'home') iconName = 'Home';
    else if (name === 'database') iconName = 'Database';
    else if (name === 'search') iconName = 'Search';
    else if (name === 'file-text') iconName = 'FileText';
    else if (name === 'form') iconName = 'Layout';
    else if (name === 'calendar') iconName = 'Calendar';
    else if (name === 'chart') iconName = 'PieChart';
    else if (name === 'shield') iconName = 'Shield';
    else if (name === 'settings') iconName = 'Sun';
    else if (name === 'folder') iconName = 'Folder';
    
    const IconComponent = (Icons as any)[iconName] || Icons.BookOpen;
    return <IconComponent size={size} />;
  };

  const NavItem: React.FC<{ item: NavigationItem; isSubmenu?: boolean }> = ({ item, isSubmenu = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<any>(null);

    if (!hasAccess(item)) return null;

    const handleMouseEnter = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsOpen(true);
    };

    const handleMouseLeave = () => {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    };

    const active = item.route ? isActive(item.route) : false;

    if (item.type === 'folder') {
      const visibleChildren = (item.children || []).filter(hasAccess);
      if (visibleChildren.length === 0) return null;

      return (
        <div 
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            type="button"
            className={\`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer \${
              isSubmenu 
                ? 'w-full text-left justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }\`}
          >
            <span className="flex items-center gap-1.5">
              {getIconComponent(item.icon)}
              <span>{getLabel(item)}</span>
            </span>
            <Icons.ChevronDown size={12} className={\`transition-transform duration-200 text-slate-400 \${isOpen ? 'rotate-180' : ''}\`} />
          </button>

          {isOpen && (
            <div 
              className={\`absolute z-50 min-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 \${
                isSubmenu ? 'left-full top-0 ml-1' : 'left-0 top-full mt-1'
              }\`}
            >
              {visibleChildren.map((child: any) => (
                <NavItem key={child.id} item={child} isSubmenu={true} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        to={item.route}
        className={\`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 \${
          isSubmenu
            ? \`hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 \${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : ''}\`
            : \`\${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`
        }\`}
      >
        {getIconComponent(item.icon)}
        <span>{getLabel(item)}</span>
      </Link>
    );
  };

  return (
    <nav className="flex items-center gap-1">
      {items.map(item => (
        <NavItem key={item.id} item={item} />
      ))}
    </nav>
  );
};`;
  return { name: 'TopNav.tsx', path: `${root}/src/components/TopNav.tsx`, content: topNavTsx, language: 'typescript' };
};

export const generateLayout = (config: BackendConfig, root: string, wl: any): VirtualFile => {
  const layoutTsx = `import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Menu, Command } from 'lucide-react';
import { CommandPalette } from './CommandPalette';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isTopNav = ${config.navigationPreset === 'top_nav' ? 'true' : 'false'};
    const menuItems: any[] = ${JSON.stringify(config.navigationConfig || [])};

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isTopNav={isTopNav} />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white shrink-0">
                            <Menu size={20} />
                        </button>
                        
                        <span className="font-bold text-base dark:text-white flex items-center gap-2 mr-4 shrink-0">
                            <span>${wl.appName}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300 py-0.5 px-2 rounded-full font-mono font-bold hidden md:inline">STRG+K</span>
                        </span>

                        {isTopNav && (
                            <div className="hidden lg:block overflow-x-auto">
                                <TopNav items={menuItems} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button 
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                            className="bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600 dark:text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer font-semibold shadow-sm text-slate-600"
                        >
                            <Command size={12} />
                            <span>Suche</span>
                        </button>
                    </div>
                </header>
                
                <div className="flex-1 overflow-auto p-4 sm:p-8">
                    {children}
                </div>
            </main>

            {/* Generated Command Palette */}
            <CommandPalette />
        </div>
    );
};`;
  return { name: 'Layout.tsx', path: `${root}/src/components/Layout.tsx`, content: layoutTsx, language: 'typescript' };
};

export const generateForbidden = (root: string): VirtualFile => {
  const forbiddenCode = `import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Forbidden = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4 font-sans">
        <ShieldAlert size={80} className="text-red-500 mb-6 drop-shadow-md" />
        <h1 className="text-5xl font-black text-slate-800 dark:text-white tracking-widest mb-2 uppercase">NO ACCESS</h1>
        <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">Sie haben keine Berechtigung, auf diese Seite zuzugreifen. Bitte kontaktieren Sie einen Administrator.</p>
        <Link to="/" className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-lg hover:shadow-red-600/30 transform hover:-translate-y-1">
            Zurück zur Startseite
        </Link>
    </div>
);`;
  return { name: 'Forbidden.tsx', path: `${root}/src/pages/auth/Forbidden.tsx`, content: forbiddenCode, language: 'typescript' };
};

export const generateProtectedRoute = (root: string): VirtualFile => {
  const protectedRouteCode = `import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { user, loading } = useAuth() || { user: { role: 'User' }, loading: false }; // Mock fallback for demo
    
    if (loading) return <div>Lade...</div>;
    if (!user) return <Navigate to="/login" replace />;
    
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/forbidden" replace />;
    }
    
    return <Layout><Outlet /></Layout>;
};`;
  return { name: 'ProtectedRoute.tsx', path: `${root}/src/components/ProtectedRoute.tsx`, content: protectedRouteCode, language: 'typescript' };
};
