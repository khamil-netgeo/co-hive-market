import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdvancedOrderManagement } from "@/hooks/useAdvancedOrderManagement";
import { 
  XCircle, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface OrderCancellationManagerProps {
  orderId: string;
  orderData: any;
  onCancellationProcessed?: () => void;
}

export function OrderCancellationManager({ 
  orderId, 
  orderData, 
  onCancellationProcessed 
}: OrderCancellationManagerProps) {
  const {
    isLoading,
    requestOrderCancellation,
    getOrderCancellations,
    processOrderCancellation
  } = useAdvancedOrderManagement();

  const [cancellations, setCancellations] = useState<any[]>([]);
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundType, setRefundType] = useState("full");
  const [customRefundAmount, setCustomRefundAmount] = useState("");
  const [showCancellationForm, setShowCancellationForm] = useState(false);

  useEffect(() => {
    loadCancellations();
  }, [orderId]);

  const loadCancellations = async () => {
    const requests = await getOrderCancellations(orderId);
    setCancellations(requests);
  };

  const calculateRefundAmount = () => {
    if (!orderData?.total_amount_cents) return 0;
    
    switch (refundType) {
      case 'full':
        return orderData.total_amount_cents;
      case 'partial':
        return parseInt(customRefundAmount) * 100 || 0;
      case 'none':
        return 0;
      default:
        return 0;
    }
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (refundType === 'partial' && (!customRefundAmount || parseInt(customRefundAmount) <= 0)) {
      toast.error('Please specify a valid partial refund amount');
      return;
    }

    const refundAmount = calculateRefundAmount();
    
    const success = await requestOrderCancellation(
      orderId,
      cancellationReason,
      refundType,
      refundAmount
    );

    if (success) {
      setShowCancellationForm(false);
      setCancellationReason("");
      setRefundType("full");
      setCustomRefundAmount("");
      await loadCancellations();
    }
  };

  const handleProcessCancellation = async (cancellationId: string, approved: boolean) => {
    const success = await processOrderCancellation(cancellationId, approved);
    if (success) {
      await loadCancellations();
      onCancellationProcessed?.();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'processed':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const canCancelOrder = () => {
    const cancelableStatuses = ['pending', 'to_pay', 'paid', 'processing'];
    return cancelableStatuses.includes(orderData?.status?.toLowerCase()) && 
           !cancellations.some(c => c.status === 'processed');
  };

  const hasPendingCancellation = () => {
    return cancellations.some(c => c.status === 'pending' || c.status === 'approved');
  };

  return (
    <div className="space-y-6">
      {/* Cancellation Policy Info */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Cancellation Policy:</strong> Orders can be canceled free of charge before processing begins. 
          Processing fees may apply for orders already in preparation. Refunds are processed within 3-5 business days.
        </AlertDescription>
      </Alert>

      {/* Request Cancellation */}
      {canCancelOrder() && !hasPendingCancellation() && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Request Order Cancellation
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowCancellationForm(!showCancellationForm)}
              >
                {showCancellationForm ? 'Cancel' : 'Cancel Order'}
              </Button>
            </div>
          </CardHeader>
          
          {showCancellationForm && (
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for Cancellation</label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Please explain why you need to cancel this order..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Refund Type</label>
                <Select value={refundType} onValueChange={setRefundType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select refund type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Full Refund (${(orderData?.total_amount_cents / 100).toFixed(2)})
                      </div>
                    </SelectItem>
                    <SelectItem value="partial">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Partial Refund
                      </div>
                    </SelectItem>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        No Refund
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="text-sm font-medium">Partial Refund Amount ($)</label>
                  <Input
                    type="number"
                    value={customRefundAmount}
                    onChange={(e) => setCustomRefundAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    max={(orderData?.total_amount_cents / 100).toString()}
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Maximum refundable: ${(orderData?.total_amount_cents / 100).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Refund Summary</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Order Total:</span>
                    <span>${(orderData?.total_amount_cents / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Amount:</span>
                    <span className="font-medium">
                      ${(calculateRefundAmount() / 100).toFixed(2)}
                    </span>
                  </div>
                  {refundType !== 'none' && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Processing Time:</span>
                      <span>3-5 business days</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmitCancellation}
                disabled={isLoading || !cancellationReason.trim()}
                className="w-full"
                variant="destructive"
              >
                Submit Cancellation Request
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {!canCancelOrder() && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Order cannot be canceled at this stage</p>
              <p className="text-sm">Current status: {orderData?.status}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPendingCancellation() && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            You have a pending cancellation request. Please wait for it to be processed before submitting a new request.
          </AlertDescription>
        </Alert>
      )}

      {/* Existing Cancellation Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Cancellation History</CardTitle>
        </CardHeader>
        <CardContent>
          {cancellations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No cancellation requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cancellations.map((cancellation) => (
                <div
                  key={cancellation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(cancellation.status)}
                      <span className="font-medium">Cancellation Request</span>
                      <Badge variant={getStatusBadgeVariant(cancellation.status)}>
                        {cancellation.status.toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(cancellation.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm"><strong>Reason:</strong> {cancellation.reason}</p>
                    <p className="text-sm">
                      <strong>Refund Type:</strong> {cancellation.refund_type.toUpperCase()}
                      {cancellation.refund_amount_cents > 0 && (
                        <span className="ml-2">
                          (${(cancellation.refund_amount_cents / 100).toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>

                  {cancellation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleProcessCancellation(cancellation.id, true)}
                        disabled={isLoading}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleProcessCancellation(cancellation.id, false)}
                        disabled={isLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {cancellation.processed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processed: {new Date(cancellation.processed_at).toLocaleDateString()}
                    </p>
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
