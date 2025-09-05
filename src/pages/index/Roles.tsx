import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Truck, ShoppingBag, Users, ArrowRight } from "lucide-react";
import { useStakeholderRoles } from "@/hooks/useStakeholderRoles";
import { getLucideIcon } from "@/lib/iconUtils";

const Roles = () => {
  const { data: roles, isLoading } = useStakeholderRoles();

  if (isLoading) {
    return (
      <section id="roles" className="relative py-16 md:py-20">
        <div className="absolute inset-0 bg-muted/30" aria-hidden />
        <div className="container relative">
          <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
            <h2 className="text-3xl font-bold sm:text-4xl">Stakeholders in Our Community</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everyone plays a vital role in building a thriving, cooperative marketplace that benefits all members
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="mb-4 h-12 w-12 rounded-lg bg-muted"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="roles" className="relative py-16 md:py-20">
      <div className="absolute inset-0 bg-muted/30" aria-hidden />
      <div className="container relative">
        <div className="mx-auto mb-16 max-w-3xl text-center animate-fade-in">
          <h2 className="text-3xl font-bold sm:text-4xl">Stakeholders in Our Community</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everyone plays a vital role in building a thriving, cooperative marketplace that benefits all members
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 grid-fade-in">
          {roles?.map((role) => {
            const IconComponent = getLucideIcon(role.icon_name);
            return (
              <div key={role.id} className="feature-card animate-fade-in-up group cursor-pointer">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{role.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
                <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Roles;
