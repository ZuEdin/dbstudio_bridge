import React from 'react';
import { 
  Play, 
  Database, 
  Mail, 
  FileSpreadsheet, 
  Bell, 
  HelpCircle, 
  RotateCcw, 
  Globe, 
  Clock, 
  Code2, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Calculator,
  Calendar,
  Zap
} from 'lucide-react';

export const WorkflowToolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string, defaultAction?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (defaultAction) {
      event.dataTransfer.setData('application/defaultAction', defaultAction);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-68 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto" id="workflow-toolbox">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Zap size={16} className="text-indigo-600" />
          <span>Workflow Toolbox</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Elemente per Drag &amp; Drop auf die Arbeitsfläche ziehen
        </p>
      </div>

      <div className="p-3.5 space-y-6">

        {/* 1. TRIGGERS */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-1 rounded mb-2.5 flex items-center justify-between">
            <span>1. Trigger (Auslöser)</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'triggerNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                <Play size={13} fill="currentColor" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Event-Trigger</div>
                <div className="text-[10px] text-slate-400">onCreate, onUpdate, onDelete...</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DATABASE ACTIONS */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-1 rounded mb-2.5">
            <span>2. Datenbank-Aktionen</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'databaseActionNode', 'createRecord')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                <PlusCircle size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Datensatz anlegen</div>
                <div className="text-[10px] text-slate-400">Neuen Eintrag in Zieltabelle</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'databaseActionNode', 'updateRecord')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Edit3 size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Datensatz bearbeiten</div>
                <div className="text-[10px] text-slate-400">Felder per Regel ändern</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'databaseActionNode', 'deleteRecord')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                <Trash2 size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Datensatz löschen</div>
                <div className="text-[10px] text-slate-400">Einträge nach Filter entfernen</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'databaseActionNode', 'calculateField')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                <Calculator size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Formel berechnen</div>
                <div className="text-[10px] text-slate-400">Excel-Formeln anwenden</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMMUNICATION */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-1 rounded mb-2.5">
            <span>3. Kommunikation &amp; Benachrichtigung</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'emailActionNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                <Mail size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">E-Mail senden</div>
                <div className="text-[10px] text-slate-400">Mit Variablen &amp; PDF-Anhang</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'notificationActionNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-teal-100 text-teal-700 group-hover:scale-105 transition-transform">
                <Bell size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Toast / Dialog</div>
                <div className="text-[10px] text-slate-400">Benutzer-Meldung anzeigen</div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. EXPORTS & DOCUMENTS */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-1 rounded mb-2.5">
            <span>4. Dokumente &amp; Export</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'exportActionNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-purple-100 text-purple-700 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">PDF / Excel Export</div>
                <div className="text-[10px] text-slate-400">XLSX, PDF, CSV generieren</div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. LOGIC & FLOW */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-1 rounded mb-2.5">
            <span>5. Ablaufsteuerung &amp; Logik</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'conditionNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                <HelpCircle size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Bedingung (IF / ELSE)</div>
                <div className="text-[10px] text-slate-400">Verzweigung mit Wahr/Falsch</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'loopNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-orange-100 text-orange-700 group-hover:scale-105 transition-transform">
                <RotateCcw size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Schleife (For-Each)</div>
                <div className="text-[10px] text-slate-400">Über Datensätze iterieren</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50/60 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'delayNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-slate-100 text-slate-700 group-hover:scale-105 transition-transform">
                <Clock size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Wartezeit (Delay)</div>
                <div className="text-[10px] text-slate-400">X Sekunden pausieren</div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. INTEGRATION & CODE */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-1 rounded mb-2.5">
            <span>6. API &amp; Scripting</span>
          </div>
          <div className="space-y-1.5">
            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'apiNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-sky-100 text-sky-700 group-hover:scale-105 transition-transform">
                <Globe size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">REST API / Webhook</div>
                <div className="text-[10px] text-slate-400">HTTP POST, GET, Webhooks</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-pink-400 hover:bg-pink-50/40 cursor-grab active:cursor-grabbing transition-all group shadow-2xs"
              onDragStart={(e) => onDragStart(e, 'scriptNode')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-pink-100 text-pink-700 group-hover:scale-105 transition-transform">
                <Code2 size={13} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">JavaScript Code</div>
                <div className="text-[10px] text-slate-400">Freies TypeScript/JS Script</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
