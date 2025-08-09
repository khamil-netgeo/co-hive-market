import { useEffect } from "react";
import { setSEO } from "@/lib/seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RiderNavigation from "@/components/rider/RiderNavigation";
import { useDeliveryAssignments } from "@/hooks/useDeliveryAssignments";
import DeliveryAssignmentCard from "@/components/rider/DeliveryAssignmentCard";

const RiderAssignments = () => {
  const { assignments, loading, acceptAssignment, declineAssignment, refetch } = useDeliveryAssignments();

  useEffect(() => {
    setSEO(
      "Delivery Assignments — CoopMarket",
      "View and manage your delivery assignments."
    );
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Delivery Assignments</h1>
          <p className="mt-2 text-muted-foreground">
            Accept or decline new delivery assignments sent to you.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <RiderNavigation />
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>New Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">Checking for assignments…</div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-sm text-muted-foreground mb-2">No new assignments right now.</div>
                    <p className="text-xs text-muted-foreground">
                      New assignments will appear here when customers place orders in your area.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {assignments.map((assignment) => (
                      <DeliveryAssignmentCard 
                        key={assignment.id} 
                        assignment={assignment} 
                        onAccept={async (id) => { 
                          await acceptAssignment(id); 
                          await refetch(); 
                        }} 
                        onDecline={declineAssignment} 
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default RiderAssignments;