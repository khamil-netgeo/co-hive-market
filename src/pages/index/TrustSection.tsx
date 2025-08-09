import { Card, CardContent } from "@/components/ui/card";
import { Shield, CreditCard, Truck, Headphones, CheckCircle, Star } from "lucide-react";

const TrustSection = () => {
  const trustFeatures = [
    {
      icon: Shield,
      title: "Verified Vendors",
      description: "All vendors go through our rigorous verification process"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Your payments are protected with enterprise-grade security"
    },
    {
      icon: Truck,
      title: "Reliable Delivery",
      description: "Track your orders with our trusted delivery network"
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Our community support team is always here to help"
    }
  ];

  const guarantees = [
    "100% Satisfaction Guarantee",
    "Secure & Encrypted Transactions",
    "Verified Vendor Network",
    "Community-Backed Quality",
    "Fair Dispute Resolution",
    "Money-Back Protection"
  ];

  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Shop with Confidence</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Your trust and safety are our top priorities in every transaction
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16 grid-fade-in">
        {trustFeatures.map((feature, index) => (
          <Card key={index} className="border-0 shadow-md text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">Trusted by 10,000+ community members</span>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Our Commitments to You</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{guarantee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;