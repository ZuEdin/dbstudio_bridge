import { useState, useEffect } from 'react';
import { Ticket } from '../types/index';
import { getLocalTickets, saveLocalTicket, deleteLocalTicket } from '../services/ticketStorageService';

export const useTicketState = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssigned, setFilterAssigned] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const data = await getLocalTickets();
      setTickets(data);
    } catch (e) {
      console.error('Error loading tickets', e);
    } finally {
      setIsLoading(false);
    }
  };

  const addTicket = async (title: string, description: string, priority: 'low' | 'medium' | 'high', assignedTo: string, linkedTableId?: string, linkedFieldId?: string) => {
    let assignedToName = 'All';
    if (assignedTo === 'u1') assignedToName = 'Me';
    else if (assignedTo === 'u2') assignedToName = 'Sarah Lee';
    else if (assignedTo === 'u3') assignedToName = 'Tom H.';

    const newTicket: Ticket = {
      id: 'ticket-' + crypto.randomUUID(),
      title,
      description,
      status: 'todo',
      priority,
      assignedTo,
      assignedToName,
      createdBy: 'u1',
      createdByName: 'Me',
      createdAt: Date.now(),
      linkedTableId,
      linkedFieldId
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    await saveLocalTicket(newTicket);
  };

  const updateTicketStatus = async (id: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const ticketToUpdate = tickets.find(t => t.id === id);
    if (!ticketToUpdate) return;

    const updatedTicket = { ...ticketToUpdate, status: newStatus };
    const updatedList = tickets.map(t => t.id === id ? updatedTicket : t);
    setTickets(updatedList);
    await saveLocalTicket(updatedTicket);
  };

  const updateTicket = async (updatedTicket: Ticket) => {
    const updatedList = tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t);
    setTickets(updatedList);
    await saveLocalTicket(updatedTicket);
  };

  const deleteTicket = async (id: string) => {
    const updatedList = tickets.filter(t => t.id !== id);
    setTickets(updatedList);
    await deleteLocalTicket(id);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesAssigned = filterAssigned === 'all' || ticket.assignedTo === filterAssigned;
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesAssigned && matchesSearch;
  });

  return {
    tickets: filteredTickets,
    allTicketsRaw: tickets,
    isLoading,
    filterPriority,
    setFilterPriority,
    filterAssigned,
    setFilterAssigned,
    searchQuery,
    setSearchQuery,
    addTicket,
    updateTicketStatus,
    updateTicket,
    deleteTicket,
    refreshTickets: loadTickets
  };
};
