import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  ShoppingCart, 
  Store, 
  Truck, 
  Package, 
  DollarSign,
  Star,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useUserRoles from "@/hooks/useUserRoles";

interface Notification {
  id: string;
  role: 'buyer' | 'vendor' | 'delivery';
  type: 'order' | 'payment' | 'review' | 'delivery' | 'general';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const roleConfig = {
  buyer: { icon: ShoppingCart, label: "Buyer", color: "text-blue-600" },
  vendor: { icon: Store, label: "Vendor", color: "text-green-600" },
  delivery: { icon: Truck, label: "Rider", color: "text-orange-600" }
};

const notificationTypeConfig = {
  order: { icon: Package, color: "text-blue-600" },
  payment: { icon: DollarSign, color: "text-green-600" },
  review: { icon: Star, color: "text-yellow-600" },
  delivery: { icon: Truck, color: "text-orange-600" },
  general: { icon: Bell, color: "text-gray-600" }
};

// Mock notifications - replace with real data from your backend
const mockNotifications: Notification[] = [
  {
    id: '1',
    role: 'buyer',
    type: 'order',
    title: 'Order Delivered',
    message: 'Your order #1234 from Local Bakery has been delivered',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
    priority: 'medium',
    actionUrl: '/orders/1234'
  },
  {
    id: '2', 
    role: 'vendor',
    type: 'order',
    title: 'New Order Received',
    message: 'You have a new order worth $45.99',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    priority: 'high',
    actionUrl: '/vendor/orders'
  },
  {
    id: '3',
    role: 'vendor',
    type: 'review',
    title: 'New Review',
    message: 'Someone left a 5-star review for your product',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    priority: 'low',
    actionUrl: '/vendor/reviews'
  },
  {
    id: '4',
    role: 'delivery',
    type: 'delivery',
    title: 'Delivery Assignment',
    message: 'New delivery available - $8.50 payout',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
    priority: 'high',
    actionUrl: '/rider/assignments'
  },
  {
    id: '5',
    role: 'delivery',
    type: 'payment',
    title: 'Weekly Payout',
    message: 'Your weekly earnings of $156.75 have been processed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    priority: 'medium',
    actionUrl: '/rider/payouts'
  }
];

export default function RoleBasedNotifications() {
  const { roles } = useUserRoles();
  const [notifications] = useState<Notification[]>(mockNotifications);

  // Filter notifications based on user's roles
  const userRoles = roles.map(r => r.member_type);
  const relevantNotifications = notifications.filter(n => 
    userRoles.includes(n.role) || n.role === 'buyer' // Everyone gets buyer notifications
  );

  // Group notifications by role
  const notificationsByRole = relevantNotifications.reduce((acc, notification) => {
    if (!acc[notification.role]) {
      acc[notification.role] = [];
    }
    acc[notification.role].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  // Count unread notifications
  const unreadCount = relevantNotifications.filter(n => !n.read).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (relevantNotifications.length === 0) {
    return (
      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Badge variant="secondary" className="text-xs">
            {unreadCount} new
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-96">
          {Object.entries(notificationsByRole).map(([role, roleNotifications]) => {
            const config = roleConfig[role as keyof typeof roleConfig];
            const RoleIcon = config.icon;
            
            return (
              <div key={role} className="space-y-1">
                <div className="px-2 py-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <RoleIcon className={`h-3 w-3 ${config.color}`} />
                  {config.label} ({roleNotifications.filter(n => !n.read).length} new)
                </div>
                
                {roleNotifications.map((notification, index) => {
                  const TypeIcon = notificationTypeConfig[notification.type].icon;
                  
                  return (
                    <DropdownMenuItem 
                      key={notification.id}
                      className={`px-3 py-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className="flex gap-3 w-full">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="relative">
                            <TypeIcon className={`h-4 w-4 ${notificationTypeConfig[notification.type].color}`} />
                            {notification.priority === 'high' && (
                              <AlertCircle className="absolute -top-1 -right-1 h-2 w-2 text-red-500 fill-current" />
                            )}
                            {notification.read && (
                              <CheckCircle2 className="absolute -top-1 -right-1 h-2 w-2 text-green-500 fill-current" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(notification.timestamp)}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-xs">
                                New
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
                
                {role !== Object.keys(notificationsByRole)[Object.keys(notificationsByRole).length - 1] && (
                  <Separator className="my-2" />
                )}
              </div>
            );
          })}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center justify-center text-sm text-muted-foreground">
          View All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}