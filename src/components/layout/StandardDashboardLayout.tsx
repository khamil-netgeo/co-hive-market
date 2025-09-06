import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StandardDashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  stats?: Array<{
    title: string;
    value: string | number;
    description?: string;
    trend?: string;
    icon?: ReactNode;
  }>;
}

export default function StandardDashboardLayout({ 
  title, 
  subtitle, 
  children, 
  actions,
  stats 
}: StandardDashboardLayoutProps) {
  return (
    <main className="container px-4 py-6 md:py-8 space-y-6">
      {/* SEO-optimized header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </header>

      {/* Statistics Cards */}
      {stats && stats.length > 0 && (
        <section className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard statistics">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  )}
                  {stat.trend && (
                    <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                  )}
                </div>
                {stat.icon && (
                  <div className="text-muted-foreground">
                    {stat.icon}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* Main Content */}
      <section className="grid gap-4 md:gap-6">
        {children}
      </section>

      {/* Canonical link for SEO */}
      <link rel="canonical" href={window.location.href} />
    </main>
  );
}