import { useEffect } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/coop-hero.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Wrench, GraduationCap, ArrowRight, Star, Users, Zap } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  useEffect(() => {
    console.log("Landing v2: Hero mounted");
  }, []);
  return (
    <section aria-label="Marketplace hero" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-primary animate-gradient-shift opacity-20" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.1),transparent_50%)]" aria-hidden />
      
      <div className="container grid grid-cols-1 items-center gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="animate-fade-in-up">
          <div className="hero-badge">
            <Sparkles className="h-3.5 w-3.5" /> Community-first commerce
          </div>
          
          <Badge variant="secondary" className="mt-4 animate-bounce-gentle">✨ New Landing v2</Badge>
          
          <h1 className="mt-6 text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
            A <span className="text-gradient-brand">Marketplace</span> for Products, Services, Time & Learning
          </h1>
          
          <p className="mt-6 max-w-prose text-lg text-muted-foreground leading-relaxed">
            Buy, sell, and deliver locally. Every order shares profit with your community and funds new growth. 
            Join the cooperative economy that puts people first.
          </p>

          {/* Stats */}
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">Community-owned</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Profit-sharing</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">Local-first</span>
            </div>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="hero" size="lg" className="group hover-lift" asChild>
              <Link to="/catalog" aria-label="Browse products">
                <ShoppingBag className="h-4 w-4" /> 
                Browse Products
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="hover-lift" asChild>
              <Link to="/plans" aria-label="Explore services">
                <Wrench className="h-4 w-4" /> Explore Services
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hover-lift" onClick={onGetStarted}>
              Become a Vendor
            </Button>
          </div>
          
          <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <span>Profit sharing to communities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Wrench className="h-3 w-3 text-primary" />
              </div>
              <span>Programs to boost demand & revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <GraduationCap className="h-3 w-3 text-primary" />
              </div>
              <span>Events & education beyond commerce</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-3 w-3 text-primary" />
              </div>
              <span>Community-owned marketplace</span>
            </div>
          </div>
        </div>
        
        <div className="relative animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl" aria-hidden />
          <img
            src={heroImage}
            alt="Illustration of a cooperative marketplace connecting vendors, riders and buyers"
            className="relative mx-auto aspect-video w-full max-w-xl rounded-2xl border bg-card object-cover shadow-glow hover-lift"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
