export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  participants: string[];
  messages: ChatMessage[];
  unreadCount?: number;
  isOnline?: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  linkedTableId?: string;
  linkedFieldId?: string;
}
