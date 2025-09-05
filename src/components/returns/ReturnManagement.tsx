import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReturnAutomation } from "@/hooks/useReturnAutomation";
import { formatDistanceToNow } from "date-fns";
import { Package, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface ReturnManagementProps {
  vendorId: string;
}

export function ReturnManagement({ vendorId }: ReturnManagementProps) {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  
  const { updateReturnStatus, processRefund, isLoading } = useReturnAutomation();

  // Fetch return requests
  const { data: requests, refetch } = useQuery({
    queryKey: ["vendor-return-requests", vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_return_requests')
        .select(`
          *,
          orders (
            id,
            total_amount_cents,
            buyer_user_id,
            profiles (display_name, email)
          ),
          order_items (
            products (name, images)
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedRequest || !newStatus) return;

    const success = await updateReturnStatus(selectedRequest.id, newStatus as any, notes);
    if (success) {
      refetch();
      setSelectedRequest(null);
      setNotes("");
      setNewStatus("");
    }
  };

  // Handle refund processing
  const handleRefund = async (requestId: string, amount: number) => {
    const success = await processRefund(requestId, amount);
    if (success) {
      refetch();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-500/10 text-yellow-700';
      case 'approved':
        return 'bg-green-500/10 text-green-700';
      case 'rejected':
        return 'bg-red-500/10 text-red-700';
      case 'processing':
        return 'bg-blue-500/10 text-blue-700';
      case 'completed':
        return 'bg-gray-500/10 text-gray-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gradient-brand">Return Management</h2>
        <div className="text-sm text-muted-foreground">
          {requests?.length || 0} total requests
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['requested', 'approved', 'processing', 'completed'].map((status) => {
          const count = requests?.filter(r => r.status === status).length || 0;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/10">
                    {getStatusIcon(status)}
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Return Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No return requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono">
                      #{request.order_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {(request as any).orders?.profiles?.display_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {(request as any).order_items?.[0]?.products?.name || 'All items'}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      {formatPrice(request.refund_amount_cents || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          {request.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Manage Return Request</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Current Status</label>
                              <Badge className={`ml-2 ${getStatusColor(selectedRequest?.status || '')}`}>
                                {selectedRequest?.status}
                              </Badge>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Update Status</label>
                              <Select value={newStatus} onValueChange={setNewStatus}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="approved">Approve</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="completed">Complete</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes about this return..."
                                className="mt-1"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={handleStatusUpdate}
                                disabled={!newStatus || isLoading}
                                className="flex-1"
                              >
                                Update Status
                              </Button>
                              
                              {selectedRequest?.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleRefund(
                                    selectedRequest.id,
                                    selectedRequest.refund_amount_cents / 100
                                  )}
                                  disabled={isLoading}
                                >
                                  Process Refund
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}