import { useEffect } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/coop-hero.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, ShoppingBag, Wrench, Search, ArrowRight, Star, Shield, Users, TrendingUp } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  useEffect(() => {
    console.log("Landing v2: Hero mounted");
  }, []);
  return (
    <section aria-label="Marketplace hero" className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_40%,rgba(120,119,198,0.08),transparent_70%)]" aria-hidden />
      
      <div className="container py-20 md:py-28">
        {/* Trust indicators */}
        <div className="mx-auto mb-8 flex max-w-2xl items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Verified Vendors</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>4.8/5 Rating</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-primary" />
            <span>10k+ Members</span>
          </div>
        </div>

        <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
          <Badge variant="secondary" className="mb-6 animate-bounce-gentle">✨ New Marketplace Experience</Badge>
          
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Discover Local <span className="text-gradient-brand">Products & Services</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Connect with trusted local vendors, discover unique products, and book professional services. 
            Every purchase supports your community's growth.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search for products, services, or vendors..." 
                className="h-14 pl-12 pr-32 text-base shadow-elegant"
              />
              <Button className="absolute right-2 top-2 h-10" size="sm">
                Search
              </Button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" className="group hover-lift" asChild>
              <Link to="/products">
                <ShoppingBag className="h-4 w-4" /> 
                Browse Products
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="hover-lift" asChild>
              <Link to="/products?type=services">
                <Wrench className="h-4 w-4" /> Book Services
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="hover-lift" onClick={onGetStarted}>
              Start Selling
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-2xl font-bold text-primary">2,500+</div>
            <div className="text-sm text-muted-foreground">Active Vendors</div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-2xl font-bold text-primary">15,000+</div>
            <div className="text-sm text-muted-foreground">Products Listed</div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-2xl font-bold text-primary">98%</div>
            <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-2xl font-bold text-primary">$2.1M</div>
            <div className="text-sm text-muted-foreground">Community Revenue</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
