import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-2 text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span className="opacity-60">/</span>}
            {item.href ? (
              <NavLink to={item.href} className="hover:text-foreground transition-colors">
                {item.label}
              </NavLink>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
