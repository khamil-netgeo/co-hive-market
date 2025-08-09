import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DeliveryAssignment } from '@/hooks/useDeliveryAssignments';
import { MapPin, Clock, Package, Navigation } from 'lucide-react';

interface DeliveryAssignmentCardProps {
  assignment: DeliveryAssignment;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

function openExternalMap(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, '_blank');
}

export default function DeliveryAssignmentCard({ 
  assignment, 
  onAccept, 
  onDecline 
}: DeliveryAssignmentCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(assignment.id);
    setIsAccepting(false);
  };

  const handleDecline = async () => {
    setIsDeclining(true);
    await onDecline(assignment.id);
    setIsDeclining(false);
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(assignment.expires_at);
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const timeRemaining = getTimeRemaining();
  const isExpired = timeRemaining === 'Expired';

  return (
    <Card className={`${isExpired ? 'opacity-50' : ''} ${assignment.status === 'accepted' ? 'border-green-500' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Delivery Request
          </span>
          <div className="flex items-center gap-2">
            <Badge variant={assignment.status === 'accepted' ? 'default' : 'secondary'}>
              {assignment.status}
            </Badge>
            {!isExpired && assignment.status === 'pending' && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pickup Location */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-600 mt-1" />
            <div>
              <p className="font-medium text-sm">Pickup</p>
              <p className="text-sm text-muted-foreground">
                {assignment.delivery?.pickup_address || 'Address not specified'}
              </p>
              {assignment.delivery?.scheduled_pickup_at && (
                <p className="text-xs text-muted-foreground">
                  Scheduled: {new Date(assignment.delivery.scheduled_pickup_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dropoff Location */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-600 mt-1" />
            <div>
              <p className="font-medium text-sm">Dropoff</p>
              <p className="text-sm text-muted-foreground">
                {assignment.delivery?.dropoff_address || 'Address not specified'}
              </p>
              {assignment.delivery?.scheduled_dropoff_at && (
                <p className="text-xs text-muted-foreground">
                  Scheduled: {new Date(assignment.delivery.scheduled_dropoff_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {assignment.delivery?.notes && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium text-sm mb-1">Special Instructions</p>
            <p className="text-sm text-muted-foreground">{assignment.delivery.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        {assignment.status === 'pending' && !isExpired && (
          <div className="flex gap-3 pt-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="flex-1"
                  disabled={isAccepting}
                >
                  {isAccepting ? 'Accepting...' : 'Accept'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Accept Delivery?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to accept this delivery? You'll need to complete 
                    the pickup and dropoff as scheduled.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAccept}>
                    Yes, Accept
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDecline}
              disabled={isDeclining}
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </Button>
          </div>
        )}

        {/* Navigation Button for Accepted Deliveries */}
        {assignment.status === 'accepted' && assignment.delivery?.pickup_lat && assignment.delivery?.pickup_lng && (
          <Button className="w-full" variant="outline" onClick={() => openExternalMap(assignment.delivery!.pickup_lat!, assignment.delivery!.pickup_lng!)}>
            <Navigation className="h-4 w-4 mr-2" />
            Navigate to Pickup
          </Button>
        )}

        {/* Assignment Details */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>Created: {new Date(assignment.created_at).toLocaleString()}</p>
          {assignment.responded_at && (
            <p>Responded: {new Date(assignment.responded_at).toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}