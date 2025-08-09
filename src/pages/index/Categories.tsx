import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench, GraduationCap, ArrowRight } from "lucide-react";

interface CategoriesProps {
  onGetStarted: () => void;
}

const Categories = ({ onGetStarted }: CategoriesProps) => (
  <section id="categories" className="container py-16 md:py-20">
    <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
      <h2 className="text-3xl font-bold sm:text-4xl">Join Our Community</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Whether you're selling products, offering services, or looking to support local vendors
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 grid-fade-in">
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Shop Products</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Discover locally-made goods and support community vendors with every purchase.
        </p>
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Wrench className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Book Services</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find trusted professionals for repairs, consulting, and specialized services.
        </p>
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Become a Vendor</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Start selling your products or services and grow your business with community support.
        </p>
      </div>
    </div>
    
    <div className="mt-16 text-center animate-fade-in-up">
      <div className="mx-auto mb-6 max-w-2xl">
        <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-muted-foreground">
          Join our community marketplace and start connecting with local vendors and customers today.
        </p>
      </div>
      <Button 
        size="lg" 
        className="group hover-lift"
        onClick={onGetStarted}
      >
        Join the Community
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  </section>
);

export default Categories;
