import React from 'react';
import { MousePointer, Hand, Network, Grid3X3, Grid, Magnet, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasControlsProps {
    canvasMode: 'select' | 'pan';
    setCanvasMode: (mode: 'select' | 'pan') => void;
    handlePhysicsLayout: () => void;
    handleAutoArrange: () => void;
    snapToGrid: boolean;
    setSnapToGrid: (snap: boolean) => void;
    handleAlignAllToGrid: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomReset: () => void;
    scale: number;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
    canvasMode,
    setCanvasMode,
    handlePhysicsLayout,
    handleAutoArrange,
    snapToGrid,
    setSnapToGrid,
    handleAlignAllToGrid,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    scale
}) => {
    return (
        <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-300 dark:border-slate-800 p-1 flex items-center gap-1 z-[100] select-none transition-colors">
            {/* Interaction Modes */}
            <button 
                onClick={() => setCanvasMode('select')}
                className={`p-1.5 rounded transition-colors ${canvasMode === 'select' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Auswahl-Werkzeug (Ziehen zum Markieren mehrerer Tabellen)"
            >
                <MousePointer size={16} />
            </button>
            <button 
                onClick={() => setCanvasMode('pan')}
                className={`p-1.5 rounded transition-colors ${canvasMode === 'pan' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Hand-Werkzeug (Verschieben - oder Alt-Taste gedrückt halten)"
            >
                <Hand size={16} />
            </button>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

            {/* Layout & Grid Tools */}
            <button 
                onClick={handlePhysicsLayout}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Smart Auto-Layout (Physik-basiert)"
            >
                <Network size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Smart Layout</span>
            </button>
            <button 
                onClick={handleAutoArrange}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Tabellen automatisch anordnen (Raster)"
            >
                <Grid3X3 size={16} className="text-slate-500" />
                <span className="hidden sm:inline">Raster-Layout</span>
            </button>
            <button 
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-semibold ${snapToGrid ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title="Raster-Snapping ein-/ausschalten"
            >
                <Grid size={16} />
                <span className="hidden sm:inline">Raster</span>
            </button>
            <button 
                onClick={handleAlignAllToGrid}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                title="Alle Tabellen am 20px-Raster ausrichten"
            >
                <Magnet size={16} className="text-slate-500 dark:text-slate-400" />
            </button>

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

            {/* Zoom Controls */}
            <button 
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                title="Zoom vergrößern"
            >
                <ZoomIn size={16} />
            </button>
            <button 
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors"
                title="Zoom verkleinern"
            >
                <ZoomOut size={16} />
            </button>
            <button 
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold border-l border-slate-200 dark:border-slate-800 pl-2 bg-slate-50 dark:bg-slate-800/50"
                title="Zoom zurücksetzen"
            >
                <RotateCcw size={14} />
                <span>{Math.round(scale * 100)}%</span>
            </button>
        </div>
    );
};
