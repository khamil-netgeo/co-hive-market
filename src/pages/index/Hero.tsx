import { useEffect } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/coop-hero.jpg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Wrench, GraduationCap } from "lucide-react";

interface HeroProps {
  onGetStarted: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  useEffect(() => {
    console.log("Landing v2: Hero mounted");
  }, []);
  return (
    <section aria-label="Marketplace hero" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-primary animate-gradient-shift opacity-30" aria-hidden />
      <div className="container grid grid-cols-1 items-center gap-10 py-16 md:grid-cols-2 md:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Community-first commerce
          </div>
          <Badge variant="secondary" className="mt-3">New Landing v2</Badge>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            A Marketplace for Products, Services, Time & Learning
          </h1>
          <p className="mt-4 max-w-prose text-lg text-muted-foreground">
            Buy, sell, and deliver locally. Every order shares profit with your community and funds new growth.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/catalog" aria-label="Browse products"><ShoppingBag className="h-4 w-4" /> Browse Products</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/plans" aria-label="Explore services"><Wrench className="h-4 w-4" /> Explore Services</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={onGetStarted}>
              Become a Vendor
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/riders" aria-label="Become a rider">Become a Rider</Link>
            </Button>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4" /> Profit sharing to communities</li>
            <li className="inline-flex items-center gap-2"><Wrench className="h-4 w-4" /> Programs to boost demand & revenue</li>
            <li className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Events & education beyond commerce</li>
          </ul>
        </div>
        <div className="relative">
          <img
            src={heroImage}
            alt="Illustration of a cooperative marketplace connecting vendors, riders and buyers"
            className="mx-auto aspect-video w-full max-w-xl rounded-xl border bg-card object-cover shadow-elegant"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
