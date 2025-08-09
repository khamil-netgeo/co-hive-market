import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
    
    <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-white">
      <div className="mx-auto mb-6 max-w-2xl">
        <h3 className="text-2xl font-bold mb-4">Ready to Join Our Marketplace?</h3>
        <p className="text-primary-foreground/90">
          Start selling your products or services today. Join thousands of successful vendors in our thriving community.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button 
          size="lg" 
          variant="secondary"
          className="group hover-lift"
          onClick={onGetStarted}
        >
          Start Selling Today
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <Button 
          size="lg" 
          variant="outline"
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          asChild
        >
          <Link to="/catalog">Browse Marketplace</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default Categories;
