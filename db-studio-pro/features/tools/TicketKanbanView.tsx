import React, { useState } from 'react';
import { Ticket } from '../../types/index';
import { Plus, GripVertical, Trash2 } from 'lucide-react';

interface TicketKanbanViewProps {
  tickets: Ticket[];
  onUpdateTickets: (tickets: Ticket[]) => void;
}

export const TicketKanbanView: React.FC<TicketKanbanViewProps> = ({ tickets, onUpdateTickets }) => {
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-slate-300' },
    { id: 'in_progress', title: 'In Arbeit', color: 'border-blue-400' },
    { id: 'done', title: 'Fertig', color: 'border-emerald-400' }
  ];

  const handleDragStart = (id: string) => {
    setDraggedTicketId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Ticket['status']) => {
    if (!draggedTicketId) return;
    const newTickets = tickets.map(t => t.id === draggedTicketId ? { ...t, status } : t);
    onUpdateTickets(newTickets);
    setDraggedTicketId(null);
  };

  const createTicket = (status: Ticket['status']) => {
    const newTicket: Ticket = {
      id: crypto.randomUUID(),
      title: 'Neues Ticket',
      description: '',
      status,
      priority: 'medium',
      assignedTo: 'all',
      assignedToName: 'All',
      createdBy: 'u1',
      createdByName: 'Me',
      createdAt: Date.now()
    };
    onUpdateTickets([...tickets, newTicket]);
  };

  const deleteTicket = (id: string) => {
    onUpdateTickets(tickets.filter(t => t.id !== id));
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    onUpdateTickets(tickets.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden p-6 gap-6">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold text-slate-800">Dev Kanban Board</h2>
        <p className="text-slate-500 text-sm">Tickets und Tasks für dieses Schema-Projekt (Gespeichert in IndexedDB)</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map(col => {
          const colTickets = tickets.filter(t => t.status === col.id);
          
          return (
            <div 
              key={col.id}
              className={`flex-1 min-w-[300px] max-w-[400px] bg-slate-100 rounded-lg flex flex-col border-t-4 ${col.color}`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id as any)}
            >
              <div className="p-4 flex justify-between items-center border-b border-slate-200">
                <h3 className="font-bold text-slate-700">{col.title} <span className="text-slate-400 text-sm font-normal">({colTickets.length})</span></h3>
                <button onClick={() => createTicket(col.id as any)} className="text-slate-400 hover:text-slate-700">
                  <Plus size={18} />
                </button>
              </div>

              <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                {colTickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    draggable
                    onDragStart={() => handleDragStart(ticket.id)}
                    className="bg-white p-3 rounded shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex justify-between mb-2">
                        <input 
                            value={ticket.title}
                            onChange={(e) => updateTicket(ticket.id, { title: e.target.value })}
                            className="font-bold text-slate-800 bg-transparent border-none outline-none w-[90%]"
                        />
                        <button onClick={() => deleteTicket(ticket.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <textarea 
                        value={ticket.description}
                        onChange={(e) => updateTicket(ticket.id, { description: e.target.value })}
                        placeholder="Beschreibung..."
                        className="w-full text-sm text-slate-600 bg-transparent border-none outline-none resize-none h-16"
                    />
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <select 
                            value={ticket.priority}
                            onChange={(e: any) => updateTicket(ticket.id, { priority: e.target.value })}
                            className={`text-xs px-2 py-1 rounded outline-none ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                        <GripVertical size={14} className="text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
