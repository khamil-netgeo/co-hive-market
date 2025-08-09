import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Wrench, Clock3, GraduationCap, ArrowRight, Plus } from "lucide-react";

interface CategoriesProps {
  onGetStarted: () => void;
}

const Categories = ({ onGetStarted }: CategoriesProps) => (
  <section id="categories" className="container py-16 md:py-20">
    <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
      <h2 className="text-3xl font-bold sm:text-4xl">Earning Categories</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Multiple ways to generate income and contribute to your community's growth
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 grid-fade-in">
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Product</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sell physical goods, handmade items, and local products to community members.
        </p>
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Wrench className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Service</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Offer professional services, consulting, repairs, and specialized skills.
        </p>
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Clock3 className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Time</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Share your time for tasks, assistance, and community support activities.
        </p>
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <GraduationCap className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Learning</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Teach skills, host workshops, and share knowledge with community members.
        </p>
      </div>
    </div>
    
    <div className="mt-16 text-center animate-fade-in-up">
      <div className="mx-auto mb-6 max-w-2xl">
        <h3 className="text-2xl font-bold mb-4">Ready to Start Your Community?</h3>
        <p className="text-muted-foreground">
          Join thousands building cooperative marketplaces that benefit everyone. Start today and watch your community thrive.
        </p>
      </div>
      <Button 
        size="lg" 
        className="group hover-lift"
        onClick={onGetStarted}
      >
        <Plus className="h-4 w-4" />
        Start Your Community
        <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  </section>
);

export default Categories;
