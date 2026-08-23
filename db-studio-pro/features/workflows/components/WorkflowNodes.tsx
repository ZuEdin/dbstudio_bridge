import React from 'react';
import { Handle, Position } from '@xyflow/react';
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
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Calculator
} from 'lucide-react';
import { WorkflowNodeData } from '../../../types/workflow';

interface CustomNodeProps {
  data: WorkflowNodeData;
  isConnectable?: boolean;
  selected?: boolean;
}

// ----------------------------------------------------
// 1. TRIGGER NODE
// ----------------------------------------------------
export const TriggerNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const event = data.triggerConfig?.event || 'onCreate';
  const eventLabels: Record<string, string> = {
    onCreate: 'Datensatz erstellt (onCreate)',
    onUpdate: 'Datensatz geändert (onUpdate)',
    onDelete: 'Datensatz gelöscht (onDelete)',
    onFieldChange: 'Feldwert geändert',
    onSchedule: 'Zeitgesteuert (Cron)',
    onManual: 'Manueller Start / Klick',
    onFormSubmit: 'Formular abgesendet'
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[200px] transition-all ${
      selected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-indigo-400 hover:border-indigo-500'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Play size={13} fill="currentColor" />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-700">Trigger</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Workflow Start'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
        {eventLabels[event] || event}
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 2. DATABASE ACTION NODE (Create, Update, Delete, Calculate)
// ----------------------------------------------------
export const DatabaseActionNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const dbCfg = data.databaseActionConfig || (data.actionConfig as any) || {};
  const actionType = dbCfg.actionType || 'createRecord';

  const actionIcons: Record<string, React.ReactNode> = {
    createRecord: <PlusCircle size={13} className="text-emerald-600" />,
    updateRecord: <Edit3 size={13} className="text-blue-600" />,
    deleteRecord: <Trash2 size={13} className="text-rose-600" />,
    calculateField: <Calculator size={13} className="text-amber-600" />,
    filterRecords: <Database size={13} className="text-indigo-600" />
  };

  const actionLabels: Record<string, string> = {
    createRecord: 'Datensatz anlegen',
    updateRecord: 'Datensatz aktualisieren',
    deleteRecord: 'Datensatz löschen',
    calculateField: 'Formel berechnen',
    filterRecords: 'Daten filtern'
  };

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[200px] transition-all ${
      selected ? 'border-emerald-600 ring-2 ring-emerald-200' : 'border-emerald-400 hover:border-emerald-500'
    }`}>
      {/* Input Port */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
          {actionIcons[actionType] || <Database size={13} />}
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-700">Datenbank</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Datenbank-Aktion'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
        <span>{actionLabels[actionType] || actionType}</span>
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-emerald-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 3. EMAIL ACTION NODE
// ----------------------------------------------------
export const EmailActionNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const emailCfg = (data.emailActionConfig || (data.actionConfig as any) || {}) as any;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[210px] transition-all ${
      selected ? 'border-blue-600 ring-2 ring-blue-200' : 'border-blue-400 hover:border-blue-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
          <Mail size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-blue-700">E-Mail Versand</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'E-Mail senden'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[190px]">
        An: {emailCfg.to || '{{trigger.email}}'}
      </div>
      {emailCfg.subject && (
        <div className="text-[9px] text-slate-400 truncate max-w-[190px] italic">
          "{emailCfg.subject}"
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-blue-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 4. EXPORT ACTION NODE (PDF, EXCEL, CSV)
// ----------------------------------------------------
export const ExportActionNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const exportCfg = data.exportActionConfig;
  const type = exportCfg?.exportType || 'excel';

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[200px] transition-all ${
      selected ? 'border-purple-600 ring-2 ring-purple-200' : 'border-purple-400 hover:border-purple-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
          <FileSpreadsheet size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-purple-700">Dokument-Export</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Export generieren'}</div>
      <div className="text-[10px] text-purple-600 font-bold uppercase mt-0.5">
        Format: {type.toUpperCase()}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-purple-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 5. NOTIFICATION ACTION NODE (Toast / Message Box)
// ----------------------------------------------------
export const NotificationActionNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const notifCfg = data.notificationActionConfig;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[190px] transition-all ${
      selected ? 'border-teal-600 ring-2 ring-teal-200' : 'border-teal-400 hover:border-teal-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
          <Bell size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-teal-700">Benachrichtigung</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Toast / Dialog'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[170px]">
        {notifCfg?.message || 'Benachrichtigung anzeigen'}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-teal-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 6. CONDITION NODE (IF / ELSE WITH DUAL PORTS)
// ----------------------------------------------------
export const ConditionNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const cond = data.conditionConfig;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[210px] transition-all ${
      selected ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-400 hover:border-amber-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <HelpCircle size={13} />
          </div>
          <span className="font-bold text-[10px] uppercase tracking-wider text-amber-700">Bedingung (IF)</span>
        </div>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Prüfung'}</div>
      <div className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 truncate">
        {cond?.fieldId ? `${cond.fieldId} ${cond.operator} ${cond.value || ''}` : 'Regel definieren...'}
      </div>

      {/* Dual output ports for True and False paths */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[10px] font-bold">
        <div className="flex items-center gap-1 text-emerald-600 relative">
          <span>✓ Wahr</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            isConnectable={isConnectable}
            className="!left-4 !bottom-[-16px] w-3 h-3 bg-emerald-500 border-2 border-white"
          />
        </div>
        <div className="flex items-center gap-1 text-rose-500 relative">
          <span>✗ Falsch</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            isConnectable={isConnectable}
            className="!left-auto !right-4 !bottom-[-16px] w-3 h-3 bg-rose-500 border-2 border-white"
          />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 7. LOOP NODE (FOR EACH WITH DUAL PORTS)
// ----------------------------------------------------
export const LoopNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const loopCfg = data.loopConfig;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[210px] transition-all ${
      selected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-400 hover:border-orange-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
          <RotateCcw size={13} className="animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-orange-700">Schleife (Loop)</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Für jeden Eintrag'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        Variable: <span className="font-mono font-bold text-orange-600">item</span>
      </div>

      {/* Output ports for Each and After loop */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-[10px] font-bold">
        <div className="flex items-center gap-1 text-orange-600 relative">
          <span>Schleife</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="body"
            isConnectable={isConnectable}
            className="!left-4 !bottom-[-16px] w-3 h-3 bg-orange-500 border-2 border-white"
          />
        </div>
        <div className="flex items-center gap-1 text-slate-600 relative">
          <span>Nachher</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="after"
            isConnectable={isConnectable}
            className="!left-auto !right-4 !bottom-[-16px] w-3 h-3 bg-slate-500 border-2 border-white"
          />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 8. API CALL NODE
// ----------------------------------------------------
export const ApiNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const apiCfg = data.apiConfig;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[200px] transition-all ${
      selected ? 'border-sky-600 ring-2 ring-sky-200' : 'border-sky-400 hover:border-sky-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
          <Globe size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-sky-700">REST API / Webhook</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'API Aufruf'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
        <span className="font-mono font-bold text-sky-600">{apiCfg?.method || 'POST'}</span>
        <span className="truncate max-w-[140px]">{apiCfg?.url || 'https://api.domain.com'}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-sky-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 9. DELAY NODE (Timer)
// ----------------------------------------------------
export const DelayNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  const secs = data.delayConfig?.seconds || 5;

  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[180px] transition-all ${
      selected ? 'border-slate-600 ring-2 ring-slate-200' : 'border-slate-300 hover:border-slate-400'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
          <Clock size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600">Wartezeit</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'Verzögerung'}</div>
      <div className="text-[10px] text-slate-500 mt-0.5">
        Warte <span className="font-bold text-slate-700">{secs}</span> Sekunden
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-600 border-2 border-white"
      />
    </div>
  );
};

// ----------------------------------------------------
// 10. SCRIPT NODE (Custom JS)
// ----------------------------------------------------
export const ScriptNode: React.FC<CustomNodeProps> = ({ data, isConnectable, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-md rounded-xl bg-white border-2 min-w-[190px] transition-all ${
      selected ? 'border-pink-600 ring-2 ring-pink-200' : 'border-pink-400 hover:border-pink-500'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-slate-400 border-2 border-white"
      />

      <div className="flex items-center gap-1.5 mb-1">
        <div className="p-1.5 rounded-lg bg-pink-50 text-pink-600">
          <Code2 size={13} />
        </div>
        <span className="font-bold text-[10px] uppercase tracking-wider text-pink-700">Code Script</span>
      </div>

      <div className="font-bold text-xs text-slate-800 mt-1">{data.label || 'JS Sandbox'}</div>
      <div className="text-[10px] font-mono text-pink-600 mt-0.5">
        (ctx, record) =&gt; ...
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={isConnectable}
        className="w-3 h-3 bg-pink-600 border-2 border-white"
      />
    </div>
  );
};

export const customNodeTypes = {
  triggerNode: TriggerNode,
  databaseActionNode: DatabaseActionNode,
  emailActionNode: EmailActionNode,
  exportActionNode: ExportActionNode,
  notificationActionNode: NotificationActionNode,
  conditionNode: ConditionNode,
  loopNode: LoopNode,
  apiNode: ApiNode,
  delayNode: DelayNode,
  scriptNode: ScriptNode,
  // Backwards compatibility aliases
  actionNode: DatabaseActionNode,
  uploadNode: ExportActionNode
};
