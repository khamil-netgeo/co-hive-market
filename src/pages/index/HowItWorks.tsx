import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, DollarSign, TrendingUp, ArrowRight } from "lucide-react";

const HowItWorks = () => (
  <section id="how" className="container py-16 md:py-20">
    <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
      <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
      <p className="mt-4 text-lg text-muted-foreground">
        Simple steps to join and thrive in our cooperative marketplace ecosystem
      </p>
    </div>
    
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 grid-fade-in">
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <div className="mb-2 text-sm font-medium text-primary">Step 1</div>
        <h3 className="text-xl font-semibold mb-3">Join a Community</h3>
        <p className="text-muted-foreground leading-relaxed">
          Vendors, buyers, and riders attach to a local community that shares in every transaction. 
          Choose your neighborhood and start building connections.
        </p>
        <ArrowRight className="mx-auto mt-4 h-5 w-5 text-muted-foreground/50 lg:hidden" />
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <div className="mb-2 text-sm font-medium text-primary">Step 2</div>
        <h3 className="text-xl font-semibold mb-3">Trade & Contribute</h3>
        <p className="text-muted-foreground leading-relaxed">
          Product sales, bookings, time-based gigs, and learning all generate community profit. 
          Every transaction strengthens the local economy.
        </p>
        <ArrowRight className="mx-auto mt-4 h-5 w-5 text-muted-foreground/50 lg:hidden" />
      </div>
      
      <div className="feature-card animate-fade-in-up group text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div className="mb-2 text-sm font-medium text-primary">Step 3</div>
        <h3 className="text-xl font-semibold mb-3">Grow Together</h3>
        <p className="text-muted-foreground leading-relaxed">
          The main cooperative collects a small fee to fund programs and new business growth. 
          Success is shared, communities thrive.
        </p>
      </div>
    </div>
    
    {/* Connecting lines for desktop */}
    <div className="relative mt-8 hidden lg:block">
      <div className="absolute left-1/6 top-1/2 h-px w-1/3 bg-gradient-to-r from-primary/20 to-primary/40"></div>
      <div className="absolute right-1/6 top-1/2 h-px w-1/3 bg-gradient-to-r from-primary/40 to-primary/20"></div>
    </div>
  </section>
);

export default HowItWorks;
