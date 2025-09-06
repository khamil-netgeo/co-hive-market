import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdvancedOrderManagement } from "@/hooks/useAdvancedOrderManagement";
import { 
  Edit3, 
  Plus, 
  Minus, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface OrderModificationPanelProps {
  orderId: string;
  orderData: any;
  onModificationSubmitted?: () => void;
}

export function OrderModificationPanel({ 
  orderId, 
  orderData, 
  onModificationSubmitted 
}: OrderModificationPanelProps) {
  const {
    isLoading,
    requestOrderModification,
    getOrderModifications,
    approveOrderModification,
    applyOrderModification
  } = useAdvancedOrderManagement();

  const [modifications, setModifications] = useState<any[]>([]);
  const [selectedModificationType, setSelectedModificationType] = useState("");
  const [modificationReason, setModificationReason] = useState("");
  const [modificationData, setModificationData] = useState<any>({});
  const [showModificationForm, setShowModificationForm] = useState(false);

  useEffect(() => {
    loadModifications();
  }, [orderId]);

  const loadModifications = async () => {
    const mods = await getOrderModifications(orderId);
    setModifications(mods);
  };

  const handleSubmitModification = async () => {
    if (!selectedModificationType || !modificationReason) {
      toast.error('Please fill in all required fields');
      return;
    }

    let originalData: any = {};
    let newData: any = {};

    switch (selectedModificationType) {
      case 'quantity_change':
        originalData = { quantities: orderData.items?.map((item: any) => ({ id: item.id, quantity: item.quantity })) };
        newData = { quantities: modificationData.quantities };
        break;
      case 'address_change':
        originalData = { delivery_address: orderData.delivery_address };
        newData = { delivery_address: modificationData.delivery_address };
        break;
      case 'delivery_time_change':
        originalData = { delivery_preferences: orderData.delivery_preferences };
        newData = { delivery_preferences: modificationData.delivery_preferences };
        break;
      default:
        toast.error('Invalid modification type');
        return;
    }

    const success = await requestOrderModification(
      orderId,
      selectedModificationType,
      originalData,
      newData,
      modificationReason
    );

    if (success) {
      setShowModificationForm(false);
      setSelectedModificationType("");
      setModificationReason("");
      setModificationData({});
      await loadModifications();
      onModificationSubmitted?.();
    }
  };

  const handleApproveModification = async (modificationId: string) => {
    const success = await approveOrderModification(modificationId);
    if (success) {
      await loadModifications();
    }
  };

  const handleApplyModification = async (modificationId: string) => {
    const success = await applyOrderModification(modificationId);
    if (success) {
      await loadModifications();
      onModificationSubmitted?.();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'applied':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'applied':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const canModifyOrder = () => {
    const modifiableStatuses = ['pending', 'to_pay', 'paid', 'processing'];
    return modifiableStatuses.includes(orderData?.status?.toLowerCase());
  };

  return (
    <div className="space-y-6">
      {/* Request New Modification */}
      {canModifyOrder() && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Request Order Modification
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowModificationForm(!showModificationForm)}
              >
                {showModificationForm ? 'Cancel' : 'New Request'}
              </Button>
            </div>
          </CardHeader>
          
          {showModificationForm && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Modification Type</label>
                <Select value={selectedModificationType} onValueChange={setSelectedModificationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select modification type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quantity_change">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Quantity Changes
                      </div>
                    </SelectItem>
                    <SelectItem value="address_change">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address
                      </div>
                    </SelectItem>
                    <SelectItem value="delivery_time_change">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Delivery Time
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedModificationType === 'quantity_change' && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Quantity Changes</label>
                  {orderData.items?.map((item: any, index: number) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">Current: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const quantities = [...(modificationData.quantities || orderData.items.map((i: any) => ({ id: i.id, quantity: i.quantity })))];
                            quantities[index] = { ...quantities[index], quantity: Math.max(0, quantities[index].quantity - 1) };
                            setModificationData({ ...modificationData, quantities });
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">
                          {modificationData.quantities?.[index]?.quantity ?? item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const quantities = [...(modificationData.quantities || orderData.items.map((i: any) => ({ id: i.id, quantity: i.quantity })))];
                            quantities[index] = { ...quantities[index], quantity: quantities[index].quantity + 1 };
                            setModificationData({ ...modificationData, quantities });
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedModificationType === 'address_change' && (
                <div>
                  <label className="text-sm font-medium">New Delivery Address</label>
                  <Textarea
                    value={modificationData.delivery_address || ''}
                    onChange={(e) => setModificationData({ ...modificationData, delivery_address: e.target.value })}
                    placeholder="Enter new delivery address..."
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {orderData.delivery_address || 'Not specified'}
                  </p>
                </div>
              )}

              {selectedModificationType === 'delivery_time_change' && (
                <div>
                  <label className="text-sm font-medium">Preferred Delivery Time</label>
                  <Input
                    type="datetime-local"
                    value={modificationData.delivery_time || ''}
                    onChange={(e) => setModificationData({ 
                      ...modificationData, 
                      delivery_preferences: { ...modificationData.delivery_preferences, preferred_time: e.target.value }
                    })}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Reason for Modification</label>
                <Textarea
                  value={modificationReason}
                  onChange={(e) => setModificationReason(e.target.value)}
                  placeholder="Please explain why you need to modify this order..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmitModification}
                disabled={isLoading || !selectedModificationType || !modificationReason}
                className="w-full"
              >
                Submit Modification Request
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {!canModifyOrder() && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Order cannot be modified at this stage</p>
              <p className="text-sm">Current status: {orderData?.status}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Modifications */}
      <Card>
        <CardHeader>
          <CardTitle>Modification History</CardTitle>
        </CardHeader>
        <CardContent>
          {modifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Edit3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No modification requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modifications.map((modification) => (
                <div
                  key={modification.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(modification.status)}
                      <span className="font-medium">
                        {modification.modification_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <Badge variant={getStatusBadgeVariant(modification.status)}>
                        {modification.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(modification.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm">{modification.reason}</p>

                  {modification.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveModification(modification.id)}
                        disabled={isLoading}
                      >
                        Approve
                      </Button>
                    </div>
                  )}

                  {modification.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => handleApplyModification(modification.id)}
                      disabled={isLoading}
                    >
                      Apply Changes
                    </Button>
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
