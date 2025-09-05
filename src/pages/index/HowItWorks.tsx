import { ArrowRight } from "lucide-react";
import { useProcessSteps } from "@/hooks/useProcessSteps";
import { getLucideIcon } from "@/lib/iconUtils";

const HowItWorks = () => {
  const { data: processSteps = [], isLoading, error } = useProcessSteps();

  if (error) {
    console.error("Error loading process steps:", error);
  }

  return (
    <section id="how" className="container py-16 md:py-20">
      <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
        <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Simple steps to join and thrive in our cooperative marketplace ecosystem
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 grid-fade-in">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="feature-card animate-fade-in-up group text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted animate-pulse"></div>
              <div className="mb-2 h-4 bg-muted animate-pulse rounded w-16 mx-auto"></div>
              <div className="h-6 bg-muted animate-pulse rounded mb-3 w-32 mx-auto"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ))
        ) : processSteps.length > 0 ? (
          processSteps.map((step, index) => {
            const IconComponent = getLucideIcon(step.icon_name);
            return (
              <div key={step.id} className="feature-card animate-fade-in-up group text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <div className="mb-2 text-sm font-medium text-primary">Step {step.step_number}</div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {index < processSteps.length - 1 && (
                  <ArrowRight className="mx-auto mt-4 h-5 w-5 text-muted-foreground/50 lg:hidden" />
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Loading process steps...</p>
          </div>
        )}
      </div>

      {/* Connecting lines for desktop */}
      <div className="relative mt-8 hidden lg:block">
        <div className="absolute left-1/6 top-1/2 h-px w-1/3 bg-gradient-to-r from-primary/20 to-primary/40"></div>
        <div className="absolute right-1/6 top-1/2 h-px w-1/3 bg-gradient-to-r from-primary/40 to-primary/20"></div>
      </div>
    </section>
  );
};

export default HowItWorks;
