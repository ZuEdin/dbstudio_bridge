import React, { useState } from 'react';
import { Ticket } from '../types/index';
import { useProjectStore } from '../stores/useProjectStore';
import { 
  Plus, CheckCircle2, Circle, Clock, Trash2, 
  User, ShieldAlert, Filter, Search, ArrowRight, CornerDownRight 
} from 'lucide-react';

interface TicketBoardProps {
  tickets: Ticket[];
  allTicketsRaw: Ticket[];
  onAddTicket: (title: string, description: string, priority: 'low' | 'medium' | 'high', assignedTo: string, linkedTableId?: string, linkedFieldId?: string) => void;
  onUpdateTicketStatus: (id: string, status: 'todo' | 'in_progress' | 'done') => void;
  onDeleteTicket: (id: string) => void;
  filterPriority: string;
  setFilterPriority: (val: string) => void;
  filterAssigned: string;
  setFilterAssigned: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const TicketBoard: React.FC<TicketBoardProps> = ({
  tickets,
  allTicketsRaw,
  onAddTicket,
  onUpdateTicketStatus,
  onDeleteTicket,
  filterPriority,
  setFilterPriority,
  filterAssigned,
  setFilterAssigned,
  searchQuery,
  setSearchQuery
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newAssigned, setNewAssigned] = useState('u1'); // Defaults to 'Me'
  const [newLinkedTableId, setNewLinkedTableId] = useState('');
  const [newLinkedFieldId, setNewLinkedFieldId] = useState('');

  const projectTables = useProjectStore(state => state.tables);

  // Drag and Drop State
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTicket(newTitle.trim(), newDesc.trim(), newPriority, newAssigned, newLinkedTableId || undefined, newLinkedFieldId || undefined);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setNewLinkedTableId('');
    setNewLinkedFieldId('');
    setShowAddForm(false);
  };

  // Drag-and-Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (id) {
      onUpdateTicketStatus(id, targetStatus);
    }
    setDraggingId(null);
  };

  // Status counts for metrics
  const countByStatus = (status: 'todo' | 'in_progress' | 'done') => {
    return allTicketsRaw.filter(t => t.status === status).length;
  };

  // Helper for priority badge colors
  const getPriorityBadgeClass = (p: 'low' | 'medium' | 'high') => {
    switch (p) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  // Render a single Ticket card
  const renderCard = (ticket: Ticket) => {
    const linkedTable = ticket.linkedTableId ? projectTables.find(t => t.id === ticket.linkedTableId) : null;
    const linkedField = ticket.linkedFieldId && linkedTable ? linkedTable.fields.find(f => f.id === ticket.linkedFieldId) : null;

    return (
      <div
        key={ticket.id}
        draggable
        onDragStart={(e) => handleDragStart(e, ticket.id)}
        className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition duration-150 cursor-grab active:cursor-grabbing relative group"
      >
        <div className="flex justify-between items-start gap-1 mb-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getPriorityBadgeClass(ticket.priority)}`}>
            {ticket.priority.toUpperCase()}
          </span>
          <button
            onClick={() => onDeleteTicket(ticket.id)}
            title="Ticket löschen"
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-0.5 rounded transition"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <h4 className="text-xs font-bold text-slate-800 leading-tight mb-1">
          {ticket.title}
        </h4>
        
        {ticket.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-normal">
            {ticket.description}
          </p>
        )}

        {linkedTable && (
          <div className="mt-1.5 mb-2 p-1 rounded bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-100/50 dark:border-slate-700/60 text-[10px] text-indigo-700 dark:text-indigo-400 flex items-center justify-between gap-1">
            <span className="flex items-center gap-1 font-semibold truncate" title={`Verknüpft: ${linkedTable.name}${linkedField ? `.${linkedField.name}` : ''}`}>
              <CornerDownRight size={10} className="text-indigo-400 shrink-0" />
              <span className="truncate">🔗 {linkedTable.name}{linkedField ? `.${linkedField.name}` : ''}</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('navigate-app-view', {
                  detail: { type: 'table_edit', tableId: linkedTable.id }
                }));
              }}
              className="text-[9px] bg-indigo-100 hover:bg-indigo-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-300 px-1 py-0.5 rounded font-bold transition shrink-0"
              title="Zur Tabelle springen"
            >
              Öffnen
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 mt-2">
          <div className="flex items-center gap-1">
            <User size={10} className="text-slate-500" />
            <span className="font-medium text-slate-600 truncate max-w-[80px]" title={`Zugewiesen an: ${ticket.assignedToName}`}>
              {ticket.assignedToName}
            </span>
          </div>
          <span className="text-[9px] opacity-70">
            {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Quick status moves for click/mobile support */}
        <div className="flex gap-1 mt-2 pt-1 border-t border-dashed border-slate-100 opacity-0 group-hover:opacity-100 transition duration-150 justify-end">
          {ticket.status !== 'todo' && (
            <button
              onClick={() => onUpdateTicketStatus(ticket.id, 'todo')}
              className="text-[9px] text-blue-600 hover:underline px-1 py-0.5 rounded"
            >
              Zu Todo
            </button>
          )}
          {ticket.status !== 'in_progress' && (
            <button
              onClick={() => onUpdateTicketStatus(ticket.id, 'in_progress')}
              className="text-[9px] text-amber-600 hover:underline px-1 py-0.5 rounded"
            >
              Zu In Arbeit
            </button>
          )}
          {ticket.status !== 'done' && (
            <button
              onClick={() => onUpdateTicketStatus(ticket.id, 'done')}
              className="text-[9px] text-emerald-600 hover:underline px-1 py-0.5 rounded"
            >
              Erledigt
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Quick Stats Metrics */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-slate-100 border-b border-slate-200 shrink-0">
        <div className="bg-white p-1.5 rounded border border-slate-200 text-center shadow-xs">
          <div className="text-[9px] text-slate-400 uppercase font-bold">Todo</div>
          <div className="text-xs font-black text-slate-700">{countByStatus('todo')}</div>
        </div>
        <div className="bg-white p-1.5 rounded border border-slate-200 text-center shadow-xs">
          <div className="text-[9px] text-amber-500 uppercase font-bold">In Arbeit</div>
          <div className="text-xs font-black text-amber-600">{countByStatus('in_progress')}</div>
        </div>
        <div className="bg-white p-1.5 rounded border border-slate-200 text-center shadow-xs">
          <div className="text-[9px] text-emerald-500 uppercase font-bold">Erledigt</div>
          <div className="text-xs font-black text-emerald-600">{countByStatus('done')}</div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="p-3 bg-white border-b border-slate-200 space-y-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Aufgaben durchsuchen..."
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs pl-7 focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition"
          >
            {showAddForm ? 'Schließen' : <><Plus size={14} /> Neu</>}
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5">
            <Filter size={10} className="text-slate-400 mr-1" />
            <select
              className="bg-transparent border-0 text-[10px] w-full focus:outline-none text-slate-600 font-medium cursor-pointer"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">Alle Prioritäten</option>
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
          </div>

          <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5">
            <User size={10} className="text-slate-400 mr-1" />
            <select
              className="bg-transparent border-0 text-[10px] w-full focus:outline-none text-slate-600 font-medium cursor-pointer"
              value={filterAssigned}
              onChange={(e) => setFilterAssigned(e.target.value)}
            >
              <option value="all">Alle Zuständigen</option>
              <option value="u1">Mir zugewiesen (Me)</option>
              <option value="u2">Sarah Lee</option>
              <option value="u3">Tom H.</option>
              <option value="all">Zusammenarbeit (All)</option>
            </select>
          </div>
        </div>

        {/* Create Ticket Expandable Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="border border-slate-200 bg-slate-50 rounded-lg p-2.5 mt-2 space-y-2 animate-fadeIn">
            <div className="text-xs font-bold text-slate-700 mb-1">Neues Ticket erstellen</div>
            
            <input
              type="text"
              placeholder="Titel (z.B. Tabelle 'sys_users' indizieren)"
              required
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <textarea
              placeholder="Beschreibung der Aufgabe..."
              rows={2}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 resize-none"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Priorität</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Zuständig</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                >
                  <option value="u1">Me (Aktueller User)</option>
                  <option value="u2">Sarah Lee (DB-Design)</option>
                  <option value="u3">Tom H. (Backend/API)</option>
                  <option value="all">Alle (All)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-200/50 pt-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">🔗 Tabelle verknüpfen (optional)</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs"
                  value={newLinkedTableId}
                  onChange={(e) => {
                    setNewLinkedTableId(e.target.value);
                    setNewLinkedFieldId('');
                  }}
                >
                  <option value="">-- Keine Tabelle --</option>
                  {projectTables.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-0.5">🔗 Feld verknüpfen (optional)</label>
                <select
                  className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs disabled:opacity-50"
                  value={newLinkedFieldId}
                  disabled={!newLinkedTableId}
                  onChange={(e) => setNewLinkedFieldId(e.target.value)}
                >
                  <option value="">-- Gesamte Tabelle --</option>
                  {newLinkedTableId && projectTables.find(t => t.id === newLinkedTableId)?.fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2 py-1 border border-slate-300 text-slate-600 rounded text-xs hover:bg-slate-100 transition"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-xs hover:bg-blue-700 transition"
              >
                Ticket anlegen
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto p-3 bg-slate-50 flex gap-3 h-full select-none">
        
        {/* Column: To Do */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'todo')}
          className="flex-1 min-w-[180px] bg-slate-200/60 rounded-lg p-2 flex flex-col h-full border border-slate-200"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Circle size={12} className="text-slate-400" />
              Todo
            </span>
            <span className="text-[10px] bg-slate-300 px-1.5 py-0.5 rounded-full text-slate-600 font-bold">
              {tickets.filter(t => t.status === 'todo').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-10">
            {tickets.filter(t => t.status === 'todo').map(renderCard)}
            {tickets.filter(t => t.status === 'todo').length === 0 && (
              <div className="text-[10px] text-slate-400 text-center py-6 border border-dashed border-slate-300 rounded-lg bg-white/40">
                Keine Aufgaben
              </div>
            )}
          </div>
        </div>

        {/* Column: In Progress */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'in_progress')}
          className="flex-1 min-w-[180px] bg-amber-100/30 rounded-lg p-2 flex flex-col h-full border border-amber-100"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <Clock size={12} className="text-amber-500" />
              In Arbeit
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
              {tickets.filter(t => t.status === 'in_progress').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-10">
            {tickets.filter(t => t.status === 'in_progress').map(renderCard)}
            {tickets.filter(t => t.status === 'in_progress').length === 0 && (
              <div className="text-[10px] text-slate-400 text-center py-6 border border-dashed border-amber-200/60 rounded-lg bg-white/40">
                Aufgabe hierher ziehen
              </div>
            )}
          </div>
        </div>

        {/* Column: Done */}
        <div 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'done')}
          className="flex-1 min-w-[180px] bg-emerald-100/20 rounded-lg p-2 flex flex-col h-full border border-emerald-100/50"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-500" />
              Erledigt
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
              {tickets.filter(t => t.status === 'done').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-10">
            {tickets.filter(t => t.status === 'done').map(renderCard)}
            {tickets.filter(t => t.status === 'done').length === 0 && (
              <div className="text-[10px] text-slate-400 text-center py-6 border border-dashed border-emerald-200/50 rounded-lg bg-white/40">
                Erledigte Aufgaben
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
