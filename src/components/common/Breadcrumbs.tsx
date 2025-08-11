import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

interface BreadcrumbsProps {
  items: Crumb[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm w-full max-w-full min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2 text-muted-foreground w-full max-w-full min-w-0">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1 sm:gap-2 min-w-0">
            {i > 0 && <span className="opacity-60 shrink-0">/</span>}
            {item.href ? (
              <NavLink to={item.href} className="hover:text-foreground transition-colors break-words min-w-0">
                {item.label}
              </NavLink>
            ) : (
              <span className="text-foreground font-medium break-words min-w-0">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
