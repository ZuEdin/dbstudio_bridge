import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { NavigationItem } from '../types';


interface TopNavProps {
  items: NavigationItem[];
}

export const TopNav: React.FC<TopNavProps> = ({ items }) => {
  const location = useLocation();
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'de');
  

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
    return true;
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
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isSubmenu 
                ? 'w-full text-left justify-between hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200' 
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {getIconComponent(item.icon)}
              <span>{getLabel(item)}</span>
            </span>
            <Icons.ChevronDown size={12} className={`transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div 
              className={`absolute z-50 min-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
                isSubmenu ? 'left-full top-0 ml-1' : 'left-0 top-full mt-1'
              }`}
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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
          isSubmenu
            ? `hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 ${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : ''}`
            : `${active ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`
        }`}
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
};