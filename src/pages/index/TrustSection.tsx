import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Star } from "lucide-react";
import { useTrustFeatures, useTrustGuarantees, useCommunityStats } from "@/hooks/useTrustFeatures";
import { getLucideIcon } from "@/lib/iconUtils";

const TrustSection = () => {
  const { data: trustFeatures = [], isLoading: featuresLoading, error: featuresError } = useTrustFeatures();
  const { data: guarantees = [], isLoading: guaranteesLoading, error: guaranteesError } = useTrustGuarantees();
  const { data: communityStats, isLoading: statsLoading } = useCommunityStats();

  if (featuresError || guaranteesError) {
    console.error("Error loading trust data:", { featuresError, guaranteesError });
  }

  const isLoading = featuresLoading || guaranteesLoading;

  return (
    <section className="container py-16 md:py-20">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">Shop with Confidence</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Your trust and safety are our top priorities in every transaction
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16 grid-fade-in">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-md text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted animate-pulse"></div>
                <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4 mt-1"></div>
              </CardContent>
            </Card>
          ))
        ) : trustFeatures.length > 0 ? (
          trustFeatures.map((feature, index) => {
            const IconComponent = getLucideIcon(feature.icon_name);
            return (
              <Card key={feature.id} className="border-0 shadow-md text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Loading trust features...</p>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">
                {statsLoading ? "Loading community info..." : (communityStats?.displayText || "Growing community of trusted members")}
              </span>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold mb-4">Our Commitments to You</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {guaranteesLoading ? (
              // Loading skeleton for guarantees
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 animate-pulse" />
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                </div>
              ))
            ) : (
              guarantees.map((guarantee, index) => (
                <div key={guarantee.id} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{guarantee.guarantee_text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;