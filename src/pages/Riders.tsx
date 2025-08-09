import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock3, Users } from "lucide-react";
import { setSEO } from "@/lib/seo";

const Riders = () => {
  useEffect(() => {
    setSEO(
      "Become a Rider — CoopMarket",
      "Earn delivering for your community with fair payouts and flexible hours."
    );
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Become a Rider
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Flexible hours. Fair payouts. Real community impact.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="hero" size="lg" asChild>
              <a href="/auth">Get Started</a>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="/#how">How it works</a>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Truck /> Fair payouts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Transparent earnings per delivery with community-aligned incentives.
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Clock3 /> Flexible schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Choose when to go online — fit deliveries around your life.
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-shadow">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-xl">
                <Users /> Community impact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Every order shares profit with local communities and programs.
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" size="lg" asChild>
            <a href="/auth">Apply now</a>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Riders;
