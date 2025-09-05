import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrderWorkflow } from "@/hooks/useOrderWorkflow";
import { ORDER_STATUS, ORDER_STATUS_DISPLAY, getStatusGroup } from "@/lib/orderStatus";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin,
  MessageSquare,
  History
} from "lucide-react";
import { toast } from "sonner";

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export function OrderStatusManager({ orderId, currentStatus, onStatusUpdate }: OrderStatusManagerProps) {
  const { updateOrderStatus, getOrderTransitions, autoTransitionStatus, isLoading } = useOrderWorkflow();
  const [transitions, setTransitions] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [statusNotes, setStatusNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTransitionHistory();
  }, [orderId]);

  const loadTransitionHistory = async () => {
    const history = await getOrderTransitions(orderId);
    setTransitions(history);
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast.error("Please select a different status");
      return;
    }

    const success = await updateOrderStatus(orderId, selectedStatus, {
      notes: statusNotes,
      updated_by: 'manual',
    });

    if (success) {
      onStatusUpdate?.(selectedStatus);
      setStatusNotes("");
      await loadTransitionHistory();
    }
  };

  const handleAutoTransition = async (triggerEvent: string) => {
    const success = await autoTransitionStatus(orderId, triggerEvent);
    if (success) {
      toast.success('Status automatically updated');
      await loadTransitionHistory();
    }
  };

  const getAvailableStatuses = () => {
    const currentGroup = getStatusGroup(currentStatus);
    
    // Define logical next statuses based on current status
    const statusFlows: Record<string, string[]> = {
      'pending': ['paid', 'canceled'],
      'to_pay': ['paid', 'canceled'],
      'paid': ['processing', 'canceled'],
      'processing': ['ready_to_ship', 'packaging', 'canceled'],
      'packaging': ['ready_to_ship', 'shipped'],
      'ready_to_ship': ['shipped'],
      'shipped': ['in_transit', 'delivered'],
      'in_transit': ['out_for_delivery', 'delivered'],
      'out_for_delivery': ['delivered'],
      'delivered': ['completed'],
      'completed': [],
    };

    return statusFlows[currentStatus.toLowerCase()] || [];
  };

  const getStatusIcon = (status: string) => {
    const group = getStatusGroup(status);
    
    switch (group) {
      case 'TO_PAY':
        return <Clock className="h-4 w-4" />;
      case 'TO_SHIP':
        return <Package className="h-4 w-4" />;
      case 'TO_RECEIVE':
        return <Truck className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'RETURNS':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(currentStatus)}
            Current Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {ORDER_STATUS_DISPLAY[currentStatus.toLowerCase() as keyof typeof ORDER_STATUS_DISPLAY] || currentStatus}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => handleAutoTransition('payment_confirmed')}
              disabled={isLoading || currentStatus === 'paid'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Payment Confirmed
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAutoTransition('vendor_processing')}
              disabled={isLoading || currentStatus !== 'paid'}
            >
              <Package className="h-4 w-4 mr-2" />
              Start Processing
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAutoTransition('shipment_created')}
              disabled={isLoading || !['processing', 'ready_to_ship'].includes(currentStatus)}
            >
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleAutoTransition('delivery_confirmed')}
              disabled={isLoading || !['shipped', 'in_transit', 'out_for_delivery'].includes(currentStatus)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Confirm Delivery
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Status Update */}
      {availableStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status Manually</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value={currentStatus}>Select new status...</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_DISPLAY[status.toLowerCase() as keyof typeof ORDER_STATUS_DISPLAY] || status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={isLoading || selectedStatus === currentStatus}
              className="w-full"
            >
              Update Status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            Status History
            <span className="text-sm font-normal">({transitions.length} changes)</span>
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {transitions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No status changes recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {transitions.map((transition, index) => (
                  <div
                    key={transition.id}
                    className="border-l-2 border-primary pl-4 pb-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {transition.from_status ? (
                            <>
                              {ORDER_STATUS_DISPLAY[transition.from_status] || transition.from_status}
                              {" → "}
                              {ORDER_STATUS_DISPLAY[transition.to_status] || transition.to_status}
                            </>
                          ) : (
                            <>Order created as {ORDER_STATUS_DISPLAY[transition.to_status] || transition.to_status}</>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transition.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={transition.automated ? "secondary" : "outline"}>
                        {transition.automated ? "Auto" : "Manual"}
                      </Badge>
                    </div>
                    {transition.metadata && Object.keys(transition.metadata).length > 0 && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-3 w-3 inline mr-1" />
                        {JSON.stringify(transition.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}