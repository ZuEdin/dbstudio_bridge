import React from 'react';
import { Group, AlignLeft as AlignLeftIcon } from 'lucide-react';

interface SelectionToolbarProps {
    selectedNodeIds: string[];
    handleGroupSelected: () => void;
    handleUngroupSelected: () => void;
    handleAlignTop: () => void;
    handleAlignLeft: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
    selectedNodeIds,
    handleGroupSelected,
    handleUngroupSelected,
    handleAlignTop,
    handleAlignLeft
}) => {
    if (selectedNodeIds.length <= 1) return null;

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-50 transition-colors">
            <button 
                onClick={handleGroupSelected}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                title="Zu einer Gruppe zusammenfassen"
            >
                <Group size={16} className="text-slate-500 dark:text-slate-400" />
                <span>Gruppieren</span>
            </button>
            
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            
            <button 
                onClick={handleUngroupSelected}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                title="Gruppierung aufheben"
            >
                <Group size={16} className="text-slate-500 dark:text-slate-400 opacity-50" />
                <span>Aufheben</span>
            </button>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <button 
                onClick={handleAlignTop}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                title="An der höchsten Tabelle ausrichten"
            >
                <AlignLeftIcon size={16} className="text-slate-500 dark:text-slate-400 rotate-90" />
                <span>Oben ausrichten</span>
            </button>
            
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1"></div>

            <button 
                onClick={handleAlignLeft}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                title="Am weitesten links stehenden Tabelle ausrichten"
            >
                <AlignLeftIcon size={16} className="text-slate-500 dark:text-slate-400" />
                <span>Links ausrichten</span>
            </button>
        </div>
    );
};
