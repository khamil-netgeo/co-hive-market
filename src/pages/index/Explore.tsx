import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
const Explore = () => (
  <section id="explore" className="container py-16 md:py-20">
    <div className="mx-auto mb-12 max-w-2xl text-center animate-fade-in">
      <h2 className="text-3xl font-bold sm:text-4xl">Discover & Connect</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Explore community-sourced goods and trusted services from local members
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 grid-fade-in">
      <div className="feature-card animate-fade-in-up">
        <Link to="/catalog" className="block" aria-label="Go to product catalog">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Featured Products</h3>
          <p className="text-muted-foreground leading-relaxed">
            Shop community-sourced goods. Support local makers and merchants while building stronger communities.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-primary">
            Browse Products
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
      
      <div className="feature-card animate-fade-in-up">
        <Link to="/services" className="block" aria-label="Go to services">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Featured Services</h3>
          <p className="text-muted-foreground leading-relaxed">
            Discover bookable services from trusted community members. From consulting to repairs, find what you need.
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-primary">
            Browse Services
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  </section>
);

export default Explore;
