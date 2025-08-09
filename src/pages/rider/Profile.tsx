import { useEffect, useState } from "react";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import RiderNavigation from "@/components/rider/RiderNavigation";
import RiderProfileForm from "@/components/rider/RiderProfileForm";
import useIsRider from "@/hooks/useIsRider";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const RiderProfile = () => {
  const { isRider, loading: riderLoading } = useIsRider();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setSEO(
      "Rider Profile — CoopMarket",
      "Manage your rider profile, vehicle information, and service settings."
    );
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      setSignedIn(!!sessionData.session?.user);
    };
    checkAuth();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-8 md:py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Rider Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your rider profile, vehicle information, and service settings.
          </p>
        </header>

        {signedIn === false && (
          <div className="flex flex-col items-start gap-3 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              Please sign in to manage your rider profile.
            </p>
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        )}

        {signedIn && !riderLoading && !isRider && (
          <div className="mb-6 rounded-md border p-4">
            <p className="text-sm text-muted-foreground">
              You haven't joined as a rider yet. Join a community as a rider to start delivering.
            </p>
            <div className="mt-3">
              <Button variant="secondary" asChild>
                <Link to="/getting-started">Become a Rider</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <RiderNavigation />
          </div>

          <div className="lg:col-span-3">
            <RiderProfileForm />
          </div>
        </div>
      </section>
    </main>
  );
};

export default RiderProfile;