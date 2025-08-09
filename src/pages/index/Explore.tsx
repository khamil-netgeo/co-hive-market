import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
const Explore = () => (
  <section id="explore" className="container py-10 md:py-14">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="hover:shadow-elegant transition-shadow">
        <Link to="/catalog" className="block" aria-label="Go to product catalog">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-2xl">
              <ShoppingBag /> Featured Products
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Shop community-sourced goods. Support local makers and merchants.
          </CardContent>
        </Link>
      </Card>
      <Card className="hover:shadow-elegant transition-shadow">
        <Link to="/plans" className="block" aria-label="Go to services">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-2xl">
              <Wrench /> Featured Services
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Discover bookable services from trusted community members.
          </CardContent>
        </Link>
      </Card>
    </div>
  </section>
);

export default Explore;
