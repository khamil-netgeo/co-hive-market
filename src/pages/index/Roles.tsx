import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Truck, ShoppingBag, Users } from "lucide-react";

const Roles = () => (
  <section id="roles" className="container py-12 md:py-16">
    <h2 className="text-3xl font-semibold">Stakeholders</h2>
    <p className="mt-2 max-w-prose text-muted-foreground">
      Each member is attached to a community — aligning incentives and sharing profits fairly.
    </p>
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><Store /> Vendor</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sell products or services. Create offers and programs with your community to grow.
        </CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><Truck /> Delivery</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Earn by fulfilling local deliveries while contributing to community revenue.
        </CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><ShoppingBag /> Buyer</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Discover products, services, events, and courses — your purchase empowers your community.
        </CardContent>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-xl"><Users /> Superadmin</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Govern the main cooperative, collect small monthly dues, and seed new initiatives.
        </CardContent>
      </Card>
    </div>
  </section>
);

export default Roles;
