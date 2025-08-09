import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const FeaturedListings = () => {
  const featuredProducts = [
    {
      id: 1,
      name: "Artisan Coffee Beans",
      vendor: "Local Roasters Co.",
      price: "$24.99",
      rating: 4.9,
      reviews: 127,
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
      badge: "Best Seller"
    },
    {
      id: 2,
      name: "Handmade Pottery Set",
      vendor: "Clay & Craft Studio",
      price: "$89.99",
      rating: 5.0,
      reviews: 45,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      badge: "Featured"
    },
    {
      id: 3,
      name: "Organic Honey Jar",
      vendor: "Sunset Apiary",
      price: "$18.50",
      rating: 4.8,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?w=400&h=300&fit=crop",
      badge: "Local Favorite"
    },
    {
      id: 4,
      name: "Custom Wood Furniture",
      vendor: "Heritage Woodworks",
      price: "From $299",
      rating: 4.9,
      reviews: 76,
      image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=400&h=300&fit=crop",
      badge: "Premium"
    }
  ];

  const featuredServices = [
    {
      id: 1,
      name: "Home Cleaning Service",
      vendor: "Sparkle Clean Co.",
      price: "$85/session",
      rating: 4.9,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop"
    },
    {
      id: 2,
      name: "Personal Training",
      vendor: "FitLife Coaching",
      price: "$60/hour",
      rating: 5.0,
      reviews: 134,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop"
    }
  ];

  return (
    <section className="container py-16 md:py-20">
      {/* Featured Products */}
      <div className="mb-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">Discover handpicked items from local vendors</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/catalog">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 grid-fade-in">
          {featuredProducts.map((product, index) => (
            <Card key={product.id} className="group overflow-hidden border-0 shadow-md hover:shadow-elegant transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="relative overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                />
                <Badge className="absolute left-3 top-3 text-xs">{product.badge}</Badge>
                <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-8 w-8 bg-white/90 hover:bg-white">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">{product.vendor}</p>
                
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{product.rating}</span>
                  <span className="text-xs text-muted-foreground">({product.reviews})</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">{product.price}</span>
                  <Button size="sm" className="h-7 px-3 text-xs">
                    <ShoppingBag className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Services */}
      <div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Popular Services</h2>
            <p className="mt-2 text-muted-foreground">Book trusted professionals in your area</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 grid-fade-in">
          {featuredServices.map((service, index) => (
            <Card key={service.id} className="group overflow-hidden border-0 shadow-md hover:shadow-elegant transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="h-32 w-32 object-cover transition-transform group-hover:scale-105"
                />
                <CardContent className="flex-1 p-4">
                  <h3 className="font-semibold mb-1">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{service.vendor}</p>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.rating}</span>
                    <span className="text-sm text-muted-foreground">({service.reviews} reviews)</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{service.price}</span>
                    <Button size="sm">Book Now</Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;