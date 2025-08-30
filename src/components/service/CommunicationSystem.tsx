import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Bell, 
  Clock, 
  CheckCircle, 
  Send, 
  Settings,
  Mail,
  Phone,
  Calendar,
  Users
} from "lucide-react";
import { format, addHours, addDays } from "date-fns";

interface CommunicationSystemProps {
  vendorId: string;
}

interface NotificationTemplate {
  id: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'service_completion' | 'follow_up';
  title: string;
  content: string;
  enabled: boolean;
  timing: number; // hours before/after event
}

interface AutomatedMessage {
  id: string;
  bookingId: string;
  type: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'failed';
  message: string;
}

export const CommunicationSystem = ({ vendorId }: CommunicationSystemProps) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [automatedMessages, setAutomatedMessages] = useState<AutomatedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");

  // Default templates
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: "booking_confirmation",
      type: "booking_confirmation",
      title: "Booking Confirmation",
      content: "Hi {customer_name}, your booking for {service_name} has been confirmed for {booking_date}. We look forward to serving you!",
      enabled: true,
      timing: 0
    },
    {
      id: "booking_reminder",
      type: "booking_reminder",
      title: "Booking Reminder",
      content: "Hi {customer_name}, this is a reminder that your {service_name} appointment is scheduled for tomorrow at {booking_time}. Please let us know if you need to reschedule.",
      enabled: true,
      timing: 24
    },
    {
      id: "service_completion",
      type: "service_completion",
      title: "Service Completed",
      content: "Thank you for choosing our {service_name} service, {customer_name}! We hope you're satisfied with the results. Please don't forget to leave us a review.",
      enabled: true,
      timing: 2
    },
    {
      id: "follow_up",
      type: "follow_up",
      title: "Follow-up Message",
      content: "Hi {customer_name}, we hope you're enjoying the benefits of our {service_name}. If you have any questions or need additional services, please don't hesitate to reach out!",
      enabled: false,
      timing: 168 // 1 week
    }
  ];

  useEffect(() => {
    loadCommunicationData();
  }, [vendorId]);

  const loadCommunicationData = async () => {
    try {
      setLoading(true);
      
      // Load templates from localStorage (in real app, this would be from database)
      const savedTemplates = localStorage.getItem(`communication_templates_${vendorId}`);
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      } else {
        setTemplates(defaultTemplates);
        localStorage.setItem(`communication_templates_${vendorId}`, JSON.stringify(defaultTemplates));
      }

      // Load recent automated messages
      loadAutomatedMessages();

    } catch (error) {
      console.error("Error loading communication data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutomatedMessages = async () => {
    // Get recent bookings to simulate automated messages (simplified query)
    const { data: bookings } = await supabase
      .from("service_bookings")
      .select(`
        id,
        scheduled_at,
        created_at,
        status
      `)
      .eq("vendor_id", vendorId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    // Simulate automated messages based on bookings
    const messages: AutomatedMessage[] = (bookings || []).flatMap((booking, index) => {
      const msgs: AutomatedMessage[] = [];
      const bookingDate = new Date(booking.scheduled_at || booking.created_at);
      
      // Confirmation message
      msgs.push({
        id: `conf_${booking.id}`,
        bookingId: booking.id,
        type: "booking_confirmation",
        scheduledAt: booking.created_at,
        status: "sent",
        message: `Booking confirmed for service`
      });

      // Reminder message (if booking is in future)
      if (bookingDate > new Date()) {
        msgs.push({
          id: `remind_${booking.id}`,
          bookingId: booking.id,
          type: "booking_reminder",
          scheduledAt: addHours(bookingDate, -24).toISOString(),
          status: addHours(bookingDate, -24) < new Date() ? "sent" : "pending",
          message: `Reminder for service appointment`
        });
      }

      return msgs;
    });

    setAutomatedMessages(messages.slice(0, 10)); // Show recent 10
  };

  const updateTemplate = (templateId: string, updates: Partial<NotificationTemplate>) => {
    const updatedTemplates = templates.map(template => 
      template.id === templateId ? { ...template, ...updates } : template
    );
    setTemplates(updatedTemplates);
    localStorage.setItem(`communication_templates_${vendorId}`, JSON.stringify(updatedTemplates));
    toast.success("Template updated successfully");
  };

  const sendBroadcastMessage = async () => {
    if (!broadcastMessage.trim() || !broadcastSubject.trim()) {
      toast.error("Please enter both subject and message");
      return;
    }

    try {
      // Get customers who have booked services
      const { data: bookings } = await supabase
        .from("service_bookings")
        .select("buyer_user_id")
        .eq("vendor_id", vendorId)
        .eq("status", "completed");

      const uniqueCustomers = Array.from(new Set(bookings?.map(b => b.buyer_user_id) || []));

      // In real implementation, this would send actual emails/SMS
      toast.success(`Broadcast message scheduled for ${uniqueCustomers.length} customers`);
      
      setBroadcastMessage("");
      setBroadcastSubject("");
      
      // Simulate adding to automated messages list
      const newMessage: AutomatedMessage = {
        id: `broadcast_${Date.now()}`,
        bookingId: "broadcast",
        type: "broadcast",
        scheduledAt: new Date().toISOString(),
        status: "sent",
        message: `Broadcast: ${broadcastSubject}`
      };
      
      setAutomatedMessages(prev => [newMessage, ...prev.slice(0, 9)]);

    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast message");
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case "booking_confirmation": return CheckCircle;
      case "booking_reminder": return Clock;
      case "service_completion": return CheckCircle;
      case "follow_up": return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return CheckCircle;
      case "pending": return Clock;
      case "failed": return MessageSquare;
      default: return MessageSquare;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Communication System
          </h2>
          <p className="text-muted-foreground">Automate customer communications and manage messaging</p>
        </div>
      </div>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automated Message Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.map((template) => {
            const IconComponent = getTemplateIcon(template.type);
            const isEditing = editingTemplate === template.id;
            
            return (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-semibold">{template.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {template.type === "booking_confirmation" && "Sent immediately when booking is confirmed"}
                        {template.type === "booking_reminder" && `Sent ${template.timing} hours before appointment`}
                        {template.type === "service_completion" && `Sent ${template.timing} hours after service completion`}
                        {template.type === "follow_up" && `Sent ${template.timing} hours after service completion`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={(enabled) => updateTemplate(template.id, { enabled })}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(isEditing ? null : template.id)}
                    >
                      {isEditing ? "Save" : "Edit"}
                    </Button>
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={template.title}
                      onChange={(e) => updateTemplate(template.id, { title: e.target.value })}
                      placeholder="Template title"
                    />
                    <Textarea
                      value={template.content}
                      onChange={(e) => updateTemplate(template.id, { content: e.target.value })}
                      placeholder="Message content"
                      rows={3}
                    />
                    <div className="text-xs text-muted-foreground">
                      Available variables: {"{customer_name}, {service_name}, {booking_date}, {booking_time}"}
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    {template.content}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Broadcast Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Broadcast Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Input
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="Message subject"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Write your message to all customers..."
              rows={4}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              This message will be sent to all customers who have booked your services
            </p>
            <Button onClick={sendBroadcastMessage}>
              <Send className="mr-2 h-4 w-4" />
              Send Broadcast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Automated Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Automated Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {automatedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No automated messages yet</p>
              <p className="text-sm">Messages will appear here as they are sent</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automatedMessages.map((message) => {
                const StatusIcon = getStatusIcon(message.status);
                return (
                  <div key={message.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-4 w-4 ${
                        message.status === 'sent' ? 'text-green-600' :
                        message.status === 'pending' ? 'text-orange-600' :
                        'text-red-600'
                      }`} />
                      <div>
                        <p className="font-medium">{message.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(message.scheduledAt), 'PPP p')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      message.status === 'sent' ? 'default' :
                      message.status === 'pending' ? 'secondary' :
                      'destructive'
                    }>
                      {message.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Communication Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {automatedMessages.filter(m => m.status === 'sent').length}
            </div>
            <p className="text-sm text-muted-foreground">Messages Sent</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              {automatedMessages.filter(m => m.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Messages Pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {templates.filter(t => t.enabled).length}
            </div>
            <p className="text-sm text-muted-foreground">Active Templates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};