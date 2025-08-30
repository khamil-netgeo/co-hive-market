import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, XCircle, MessageSquare, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ServiceBookingWorkflowProps {
  booking: {
    id: string;
    status: string;
    service: { name: string };
    scheduled_at: string | null;
    buyer_profile?: { display_name: string | null };
    notes: string | null;
    total_amount_cents: number;
    currency: string;
  };
  onStatusUpdate: (bookingId: string, status: string) => void;
}

export const ServiceBookingWorkflow = ({ booking, onStatusUpdate }: ServiceBookingWorkflowProps) => {
  const [loading, setLoading] = useState(false);
  const [vendorNotes, setVendorNotes] = useState("");

  const statusFlow = [
    { status: 'pending', label: 'Pending Review', icon: Clock, color: 'orange' },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'green' },
    { status: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'blue' },
    { status: 'completed', label: 'Completed', icon: CheckCircle2, color: 'purple' },
  ];

  const getCurrentStepIndex = () => {
    return statusFlow.findIndex(step => step.status === booking.status);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      // Update booking status
      const { error } = await supabase
        .from("service_bookings")
        .update({ 
          status: newStatus,
          vendor_notes: vendorNotes || null
        })
        .eq("id", booking.id);

      if (error) throw error;

      // Send notification to customer (you could implement email/SMS here)
      toast.success(`Booking ${newStatus}`);
      onStatusUpdate(booking.id, newStatus);

      // Clear notes after update
      setVendorNotes("");
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error("Failed to update booking status");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Booking Workflow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Info */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <h4 className="font-semibold">{booking.service.name}</h4>
            <p className="text-sm text-muted-foreground">
              Customer: {booking.buyer_profile?.display_name || 'Anonymous'}
            </p>
            {booking.scheduled_at && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(booking.scheduled_at), 'PPP p')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">
              {formatPrice(booking.total_amount_cents, booking.currency)}
            </p>
            <Badge variant="outline">#{booking.id.slice(0, 8)}</Badge>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="space-y-4">
          <h4 className="font-semibold">Status Progress</h4>
          <div className="flex flex-col gap-3">
            {statusFlow.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const IconComponent = step.icon;

              return (
                <div 
                  key={step.status}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isCurrent 
                      ? 'border-primary bg-primary/5' 
                      : isCompleted 
                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                        : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    isCurrent 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                      {step.label}
                    </p>
                  </div>
                  {isCurrent && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                  {isCompleted && (
                    <Badge variant="default" className="bg-green-500">Completed</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Notes */}
        {booking.notes && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Customer Notes
            </h4>
            <p className="text-sm">{booking.notes}</p>
          </div>
        )}

        {/* Vendor Actions */}
        {booking.status !== 'completed' && booking.status !== 'cancelled' && (
          <div className="space-y-4">
            <h4 className="font-semibold">Actions</h4>
            
            {/* Vendor Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add notes for customer (optional)
              </label>
              <Textarea
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="Add any notes or instructions for the customer..."
                rows={3}
              />
            </div>

            {/* Status Update Buttons */}
            <div className="flex flex-wrap gap-2">
              {booking.status === 'pending' && (
                <>
                  <Button 
                    onClick={() => handleStatusUpdate('confirmed')}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={loading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}

              {booking.status === 'confirmed' && (
                <>
                  <Button 
                    onClick={() => handleStatusUpdate('scheduled')}
                    disabled={loading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Mark as Scheduled
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={loading}
                    variant="outline"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark Completed
                  </Button>
                </>
              )}

              {booking.status === 'scheduled' && (
                <Button 
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}

              {/* Emergency cancellation */}
              {['confirmed', 'scheduled'].includes(booking.status) && (
                <Button 
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading}
                  size="sm"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Completed status */}
        {booking.status === 'completed' && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">
                Service Completed
              </span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-300 mt-1">
              This booking has been successfully completed.
            </p>
          </div>
        )}

        {/* Cancelled status */}
        {booking.status === 'cancelled' && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-700 dark:text-red-400">
                Booking Cancelled
              </span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              This booking has been cancelled.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};