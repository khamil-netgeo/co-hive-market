import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrderChatMessage {
  id: string;
  order_id: string;
  sender_user_id: string;
  receiver_user_id: string;
  message_type: 'text' | 'template' | 'media';
  content: string;
  media_url?: string;
  template_type?: string;
  created_at: string;
  is_read: boolean;
  metadata: Record<string, any>;
}

export interface ChatTemplate {
  id: string;
  category: string;
  template_key: string;
  message: string;
  role: 'rider' | 'customer' | 'vendor';
}

export function useOrderChat(orderId: string | null) {
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [templates, setTemplates] = useState<ChatTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch chat messages
  const fetchMessages = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_chats')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'template' | 'media',
        metadata: msg.metadata as Record<string, any>
      })));
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Fetch message templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_message_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        role: template.role as 'rider' | 'customer' | 'vendor'
      })));
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    receiverUserId: string,
    content: string,
    messageType: 'text' | 'template' = 'text',
    templateType?: string
  ) => {
    if (!orderId || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('order_chats')
        .insert({
          order_id: orderId,
          sender_user_id: currentUserId,
          receiver_user_id: receiverUserId,
          message_type: messageType,
          content,
          template_type: templateType,
        });

      if (error) throw error;
      
      toast.success('Message sent');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  }, [orderId, currentUserId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('order_chats')
        .update({ is_read: true })
        .in('id', messageIds)
        .eq('receiver_user_id', currentUserId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentUserId]);

  // Real-time subscription
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_chats',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMessage = payload.new as OrderChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Show notification if message is not from current user
          if (newMessage.sender_user_id !== currentUserId) {
            toast('New message', { 
              description: newMessage.content 
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, currentUserId]);

  // Initial load
  useEffect(() => {
    fetchMessages();
    fetchTemplates();
  }, [fetchMessages, fetchTemplates]);

  return {
    messages,
    templates,
    loading,
    currentUserId,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
}