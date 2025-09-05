import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";

const Testimonials = () => {
  const { data: testimonials = [], isLoading, error } = useTestimonials(true); // Only featured testimonials

  if (error) {
    console.error("Error loading testimonials:", error);
  }

  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">What Our Community Says</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Hear from vendors and customers who are part of our thriving marketplace
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 grid-fade-in">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="border-0 shadow-md animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-muted text-muted animate-pulse" />
                    ))}
                  </div>
                  
                  <div className="relative mb-6">
                    <Quote className="absolute -left-1 -top-1 h-8 w-8 text-primary/20" />
                    <div className="pl-6 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                      <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted animate-pulse rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-muted animate-pulse rounded w-20"></div>
                      <div className="h-3 bg-muted animate-pulse rounded w-16"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className="border-0 shadow-md hover:shadow-elegant transition-shadow animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <div className="relative mb-6">
                    <Quote className="absolute -left-1 -top-1 h-8 w-8 text-primary/20" />
                    <p className="pl-6 text-muted-foreground leading-relaxed">
                      {testimonial.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={testimonial.avatar_url || undefined} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Fallback when no testimonials are available
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No testimonials available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;