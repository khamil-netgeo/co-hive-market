import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Local Business Owner",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      content: "This marketplace transformed my small bakery business. The community support and profit-sharing model helped me grow faster than I ever imagined."
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "Freelance Designer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      content: "I've found amazing clients through this platform. The quality of connections and the fair fee structure make it my go-to for finding new projects."
    },
    {
      id: 3,
      name: "Emma Thompson",
      role: "Regular Customer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      rating: 5,
      content: "Love supporting local vendors! The quality is outstanding and knowing my purchases help grow the community makes every order feel meaningful."
    }
  ];

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
          {testimonials.map((testimonial, index) => (
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
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;