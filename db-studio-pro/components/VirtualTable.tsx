
import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface VirtualTableProps {
  data: any[];
  headers: string[];
  headerTooltips?: Record<string, string>;
  rowHeight?: number;
  renderRow: (row: any, index: number) => React.ReactNode;
  className?: string;
  enableRowReorder?: boolean;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (header: string) => void;
  activeColumn?: string | null;
  onSelectColumn?: (header: string) => void;
}

export const VirtualTable: React.FC<VirtualTableProps> = ({ 
  data, headers, headerTooltips, rowHeight = 35, renderRow, className = '',
  enableRowReorder = false, sortColumn, sortDirection, onSort, activeColumn, onSelectColumn
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollTop(containerRef.current.scrollTop);
                // Sync horizontal scroll to header
                if (headerRef.current) {
                    headerRef.current.scrollLeft = containerRef.current.scrollLeft;
                }
            }
        };

        const container = containerRef.current;
        container.addEventListener('scroll', handleScroll);
        
        const observer = new ResizeObserver(entries => {
            if(entries[0]) setContainerHeight(entries[0].contentRect.height);
        });
        observer.observe(container);
        
        return () => {
            container.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        }
    }
  }, []);

  const totalHeight = data.length * rowHeight;
  const startIndex = Math.floor(scrollTop / rowHeight);
  // Render a buffer of 10 rows
  const visibleCount = Math.ceil(containerHeight / rowHeight) + 10; 
  const endIndex = Math.min(data.length, startIndex + visibleCount);
  const startBuffer = Math.max(0, startIndex - 5);

  const visibleRows = data.slice(startBuffer, endIndex).map((row, i) => ({
      data: row,
      index: startBuffer + i,
      offset: (startBuffer + i) * rowHeight
  }));

  return (
    <div className={`flex flex-col h-full bg-white border border-slate-200 rounded overflow-hidden ${className}`}>
      {/* Header - overflow-hidden to hide scrollbar but allow programmatic scroll */}
      <div 
        ref={headerRef}
        className="flex bg-slate-100 border-b border-slate-300 font-bold text-xs text-slate-600 uppercase tracking-wider shrink-0 shadow-sm z-10 overflow-hidden select-none"
      >
         {enableRowReorder && (
             <div className="w-8 shrink-0 border-r border-slate-200 bg-slate-100/80"></div>
         )}
         {headers.map((h, index) => {
             const isSorted = sortColumn === h;
             const isSelected = activeColumn === h;

             return (
                 <div 
                     key={`${h}-${index}`} 
                     title={headerTooltips?.[h] || `Klicken zum Sortieren nach ${h}`} 
                     onClick={() => {
                         if (onSelectColumn) onSelectColumn(h);
                         if (onSort) onSort(h);
                     }}
                     className={`p-3 w-40 shrink-0 border-r border-slate-200 last:border-0 truncate cursor-pointer flex items-center justify-between group hover:bg-slate-200 transition-colors ${
                         isSorted ? 'bg-indigo-50 text-indigo-900 font-extrabold' : ''
                     } ${isSelected ? 'ring-2 ring-inset ring-indigo-500/50' : ''}`}
                 >
                     <span className="truncate">{h}</span>
                     <span className="ml-1 shrink-0 text-slate-400 group-hover:text-slate-700">
                         {isSorted ? (
                             sortDirection === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />
                         ) : (
                             <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                         )}
                     </span>
                 </div>
             );
         })}
         {/* Spacer to match scrollbar width roughly if needed, or just let content flow */}
         <div className="w-4 shrink-0"></div>
      </div>
      
      {/* Virtual Body */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
         <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleRows.map((row) => (
                <div 
                    key={row.index}
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', // Ensure row takes full width for horizontal scrolling
                        height: rowHeight, 
                        transform: `translateY(${row.offset}px)` 
                    }}
                >
                    {renderRow(row.data, row.index)}
                </div>
            ))}
         </div>
         {data.length === 0 && <div className="p-10 text-center text-slate-400">Keine Daten.</div>}
      </div>
    </div>
  );
};
