import { useState, useEffect } from 'react';
import { Chat, ChatMessage } from '../types/index';
import { useUIStore } from '../stores/useUIStore';
import { useAuthStore } from '../stores/useAuthStore';
import { getApiUrl } from '../stores/useConfigStore';

export const useChatState = () => {
  const ui = useUIStore();
  const { user } = useAuthStore();
  
  const { isChatOpen, setIsChatOpen } = ui;
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Fetch registered team members from Backend
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await fetch(getApiUrl('/api/team/members'));
        if (res.ok) {
          const data = await res.json();
          setTeamMembers(data);
        }
      } catch (e) {
        console.error("Failed to fetch team members for chat", e);
      }
    };
    
    fetchTeamMembers();

    if (isChatOpen) {
      const interval = setInterval(fetchTeamMembers, 5000);
      return () => clearInterval(interval);
    }
  }, [isChatOpen]);

  // Synchronize chats with actual team members dynamically
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }

    const syncChatsWithTeam = async () => {
      let backendMessages: any[] = [];
      try {
         const res = await fetch(getApiUrl('/api/chat/messages'));
         if (res.ok) {
           backendMessages = await res.json();
         }
      } catch (e) {
        console.warn("Could not fetch backend messages", e);
      }

      const currentMeEmail = user.email.toLowerCase();

      // Group Messages
      const groupMessages = backendMessages.filter(m => m.chatId === 'c1');
      if (groupMessages.length === 0) {
        groupMessages.push({
            id: 'init_msg',
            chatId: 'c1',
            senderId: 'system',
            senderName: 'System',
            text: 'Willkommen im teaminternen Kanal! Alle Änderungen am Schema werden hier in Echtzeit protokolliert.',
            timestamp: Date.now() - 3600000
        });
      }

      const groupParticipants = teamMembers.map(m => m.email.toLowerCase());
      if (!groupParticipants.includes(currentMeEmail)) groupParticipants.push(currentMeEmail);

      const updatedGroupChat: Chat = {
        id: 'c1',
        type: 'group',
        name: 'Projekt-Team-Kollaboration',
        participants: groupParticipants,
        messages: groupMessages,
        unreadCount: 0
      };

      const updatedPrivateChats: Chat[] = [];
      for (const member of teamMembers) {
        const memberEmail = member.email.toLowerCase();
        if (memberEmail === currentMeEmail) continue; 

        const privateChatId = `private_${[currentMeEmail, memberEmail].sort().join('_')}`;
        const privateMessages = backendMessages.filter(m => m.chatId === privateChatId);

        const newPrivateChat: Chat = {
          id: privateChatId,
          type: 'private',
          name: member.name,
          participants: [currentMeEmail, memberEmail],
          isOnline: member.source && (member.source.includes('AD') || member.email === 'zuboedin@gmail.com'),
          messages: privateMessages,
          unreadCount: 0
        };
        updatedPrivateChats.push(newPrivateChat);
      }
      setChats([updatedGroupChat, ...updatedPrivateChats]);
    };

    if (teamMembers.length > 0) {
      syncChatsWithTeam();
    }
    
    if (isChatOpen) {
       const interval = setInterval(syncChatsWithTeam, 3000);
       return () => clearInterval(interval);
    }
  }, [teamMembers, user, isChatOpen]);

  const handleSelectChat = (id: string | null) => {
    setActiveChatId(id);
  };

  const handleSendMessage = async (chatId: string, text: string) => {
    const newMessage = {
       id: crypto.randomUUID(),
       chatId: chatId,
       senderId: user?.id || 'u1',
       senderName: user?.name || 'Ich',
       text,
       timestamp: Date.now()
    };
    
    setChats(prev => prev.map(c => {
       if (c.id === chatId) {
          return { ...c, messages: [...c.messages, newMessage] };
       }
       return c;
    }));

    try {
      await fetch(getApiUrl('/api/chat/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });
    } catch(e) {
      console.error("Failed to send message", e);
    }
  };

  const sendSystemMessage = async (chatId: string, text: string, senderId = 'system', senderName = 'System') => {
    const newMessage = {
       id: crypto.randomUUID(),
       chatId: chatId,
       senderId,
       senderName,
       text,
       timestamp: Date.now()
    };

    setChats(prev => prev.map(c => {
       if (c.id === chatId) {
          return { ...c, messages: [...c.messages, newMessage] };
       }
       return c;
    }));

    try {
      await fetch(getApiUrl('/api/chat/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });
    } catch (e) {
      console.error("Failed to send system message", e);
    }
  };

  return {
    isChatOpen,
    setIsChatOpen,
    activeChatId,
    chats,
    handleSelectChat,
    handleSendMessage,
    sendSystemMessage
  };
};
