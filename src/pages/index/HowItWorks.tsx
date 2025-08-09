import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const HowItWorks = () => (
  <section id="how" className="relative border-y py-12 md:py-16">
    <div className="container">
      <h2 className="text-3xl font-semibold">How it works</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>1. Join a Community</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vendors, buyers, and riders attach to a local community that shares in every transaction.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>2. Trade & Contribute</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Product sales, bookings, time-based gigs, and learning all generate community profit.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>3. Grow Together</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The main cooperative collects a small due to fund programs and new business growth.
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

export default HowItWorks;
