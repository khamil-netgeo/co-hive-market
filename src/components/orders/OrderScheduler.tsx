import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdvancedOrderManagement } from "@/hooks/useAdvancedOrderManagement";
import { useCart } from "@/hooks/useCart";
import { 
  Calendar, 
  Clock, 
  Repeat, 
  Play, 
  Pause, 
  XCircle,
  ShoppingCart,
  MapPin,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface OrderSchedulerProps {
  onScheduleCreated?: () => void;
}

export function OrderScheduler({ onScheduleCreated }: OrderSchedulerProps) {
  const {
    isLoading,
    scheduleOrder,
    getScheduledOrders,
    pauseScheduledOrder,
    resumeScheduledOrder,
    cancelScheduledOrder
  } = useAdvancedOrderManagement();

  const cart = useCart();
  
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState("weekly");
  const [recurringInterval, setRecurringInterval] = useState("1");
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  useEffect(() => {
    loadScheduledOrders();
  }, []);

  const loadScheduledOrders = async () => {
    const orders = await getScheduledOrders();
    setScheduledOrders(orders);
  };

  const handleScheduleOrder = async () => {
    if (!scheduledDateTime) {
      toast.error('Please select a date and time');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please provide a delivery address');
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Your cart is empty. Add some items first.');
      return;
    }

    if (isRecurring && !recurringEndDate) {
      toast.error('Please specify an end date for recurring orders');
      return;
    }

    const cartData = {
      items: cart.items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price_cents: item.price * 100
      })),
      total_amount_cents: cart.total * 100
    };

    const deliveryPreferences = {
      address: deliveryAddress,
      notes: deliveryNotes,
      preferred_time: scheduledDateTime
    };

    const recurring = isRecurring ? {
      type: recurringType,
      interval: parseInt(recurringInterval),
      endDate: recurringEndDate
    } : undefined;

    const scheduledOrderId = await scheduleOrder(
      cartData,
      scheduledDateTime,
      deliveryPreferences,
      recurring
    );

    if (scheduledOrderId) {
      setShowScheduleForm(false);
      resetForm();
      await loadScheduledOrders();
      onScheduleCreated?.();
    }
  };

  const resetForm = () => {
    setScheduledDateTime("");
    setIsRecurring(false);
    setRecurringType("weekly");
    setRecurringInterval("1");
    setRecurringEndDate("");
    setDeliveryAddress("");
    setDeliveryNotes("");
  };

  const handlePauseOrder = async (scheduledOrderId: string) => {
    const success = await pauseScheduledOrder(scheduledOrderId);
    if (success) {
      await loadScheduledOrders();
    }
  };

  const handleResumeOrder = async (scheduledOrderId: string) => {
    const success = await resumeScheduledOrder(scheduledOrderId);
    if (success) {
      await loadScheduledOrders();
    }
  };

  const handleCancelOrder = async (scheduledOrderId: string) => {
    const success = await cancelScheduledOrder(scheduledOrderId);
    if (success) {
      await loadScheduledOrders();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatRecurringSchedule = (scheduledOrder: any) => {
    if (!scheduledOrder.recurring_type) return 'One-time';
    
    const interval = scheduledOrder.recurring_interval || 1;
    const type = scheduledOrder.recurring_type;
    
    if (interval === 1) {
      return `Every ${type.slice(0, -2)}ly`; // Remove 'ly' and add 'ly'
    }
    
    return `Every ${interval} ${type}s`;
  };

  // Get minimum date (today)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      {/* Schedule New Order */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule Order
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              disabled={cart.items.length === 0}
            >
              {showScheduleForm ? 'Cancel' : 'Schedule New'}
            </Button>
          </div>
        </CardHeader>
        
        {cart.items.length === 0 && (
          <CardContent>
            <Alert>
              <ShoppingCart className="h-4 w-4" />
              <AlertDescription>
                Your cart is empty. Add some items to your cart before scheduling an order.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {showScheduleForm && cart.items.length > 0 && (
          <CardContent className="space-y-4">
            {/* Current Cart Preview */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Items to be ordered:</h4>
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-medium flex justify-between">
                  <span>Total:</span>
                  <span>${cart.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Schedule Date/Time */}
            <div>
              <label className="text-sm font-medium">Schedule Date & Time</label>
              <Input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={minDateTime}
              />
            </div>

            {/* Recurring Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Make this a recurring order</label>
                <Switch
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <Select value={recurringType} onValueChange={setRecurringType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Every</label>
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {recurringType.slice(0, -2)}{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={recurringEndDate}
                      onChange={(e) => setRecurringEndDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Information */}
            <div>
              <label className="text-sm font-medium">Delivery Address</label>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Delivery Notes (Optional)</label>
              <Input
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Special delivery instructions..."
              />
            </div>

            <Button
              onClick={handleScheduleOrder}
              disabled={isLoading || !scheduledDateTime || !deliveryAddress.trim()}
              className="w-full"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Order
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Scheduled Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Scheduled Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled orders found</p>
              <p className="text-sm">Schedule your first order to get regular deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledOrders.map((scheduledOrder) => (
                <div
                  key={scheduledOrder.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(scheduledOrder.status)}
                      <span className="font-medium">
                        {formatRecurringSchedule(scheduledOrder)}
                      </span>
                      <Badge variant={getStatusBadgeVariant(scheduledOrder.status)}>
                        {scheduledOrder.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Created: {new Date(scheduledOrder.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium">Next Order:</span>
                      </div>
                      <p className="text-muted-foreground">
                        {scheduledOrder.next_execution_at 
                          ? new Date(scheduledOrder.next_execution_at).toLocaleString()
                          : 'Not scheduled'
                        }
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">Delivery:</span>
                      </div>
                      <p className="text-muted-foreground">
                        {scheduledOrder.delivery_preferences?.address || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">Order Summary</span>
                      <span className="font-medium">
                        ${(scheduledOrder.cart_snapshot?.total_amount_cents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {scheduledOrder.cart_snapshot?.items?.length || 0} items
                    </div>
                  </div>

                  {scheduledOrder.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePauseOrder(scheduledOrder.id)}
                        disabled={isLoading}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(scheduledOrder.id)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}

                  {scheduledOrder.status === 'paused' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleResumeOrder(scheduledOrder.id)}
                        disabled={isLoading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelOrder(scheduledOrder.id)}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}