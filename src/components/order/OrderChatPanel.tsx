import { useState, useEffect, useRef } from 'react';
import { useOrderChat } from '@/hooks/useOrderChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  User,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrderChatPanelProps {
  orderId: string;
  className?: string;
}

export default function OrderChatPanel({ orderId, className }: OrderChatPanelProps) {
  const { messages, templates, loading, currentUserId, sendMessage, markAsRead } = useOrderChat(orderId);
  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get order info to determine who to chat with
  useEffect(() => {
    const fetchOrderInfo = async () => {
      if (!orderId) return;

      try {
        const { data: order } = await supabase
          .from('orders')
          .select(`
            id,
            buyer_user_id,
            vendor_id,
            vendors (
              id,
              user_id
            )
          `)
          .eq('id', orderId)
          .single();

        if (order) {
          setOrderInfo(order);
          
          // Determine receiver based on current user role
          if (currentUserId === order.buyer_user_id) {
            // If current user is buyer, receiver could be vendor or rider
            setReceiverId(order.vendors?.user_id || null);
          } else if (currentUserId === order.vendors?.user_id) {
            // If current user is vendor, receiver is buyer
            setReceiverId(order.buyer_user_id);
          }
        }
      } catch (error) {
        console.error('Error fetching order info:', error);
      }
    };

    if (currentUserId) {
      fetchOrderInfo();
    }
  }, [orderId, currentUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark unread messages as read
  useEffect(() => {
    const unreadMessages = messages
      .filter(msg => !msg.is_read && msg.receiver_user_id === currentUserId)
      .map(msg => msg.id);
    
    if (unreadMessages.length > 0) {
      markAsRead(unreadMessages);
    }
  }, [messages, currentUserId, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !receiverId) return;

    await sendMessage(receiverId, newMessage.trim());
    setNewMessage('');
  };

  const handleSendTemplate = async (template: any) => {
    if (!receiverId) return;

    await sendMessage(receiverId, template.message, 'template', template.template_key);
    setShowTemplates(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserRole = (userId: string): string => {
    if (!orderInfo) return 'User';
    
    if (userId === orderInfo.buyer_user_id) return 'Customer';
    if (userId === orderInfo.vendors?.user_id) return 'Vendor';
    return 'Rider';
  };

  const getRelevantTemplates = () => {
    if (!currentUserId || !orderInfo) return [];
    
    let userRole = 'customer';
    if (currentUserId === orderInfo.vendors?.user_id) {
      userRole = 'vendor';
    }
    // Note: rider role would be determined by checking rider_profiles table
    
    return templates.filter(template => 
      template.role === userRole || template.role === 'customer'
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <MessageCircle className="h-4 w-4 animate-pulse mr-2" />
            Loading chat...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Order Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-64 px-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start a conversation with the delivery team</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_user_id === currentUserId;
                
                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-medium">
                          {getUserRole(message.sender_user_id)}
                        </span>
                        {message.message_type === 'template' && (
                          <Badge variant="secondary" className="text-xs">Template</Badge>
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        <div className="p-4 space-y-3">
          {showTemplates && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Quick Messages:</p>
              <div className="grid gap-2">
                {getRelevantTemplates().map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto p-2"
                    onClick={() => handleSendTemplate(template)}
                  >
                    <div>
                      <div className="font-medium text-xs">{template.category.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-muted-foreground">{template.message}</div>
                    </div>
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowTemplates(false)}
              >
                Cancel
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={!receiverId}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !receiverId}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={!receiverId}
          >
            Quick Messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}