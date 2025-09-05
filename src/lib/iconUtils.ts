import { 
  Shield, 
  CreditCard, 
  Truck, 
  Headphones, 
  Star,
  CheckCircle,
  AlertTriangle,
  Package,
  Users,
  Heart,
  Lock,
  Award,
  LucideIcon
} from "lucide-react";

// Safe icon mapping to avoid Lucide React errors
const iconMap: Record<string, LucideIcon> = {
  'shield': Shield,
  'credit-card': CreditCard,
  'truck': Truck,
  'headphones': Headphones,
  'star': Star,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'package': Package,
  'users': Users,
  'heart': Heart,
  'lock': Lock,
  'award': Award,
};

export const getLucideIcon = (iconName: string): LucideIcon => {
  // Convert to lowercase and normalize
  const normalizedName = iconName.toLowerCase().trim();
  
  // Return the icon if it exists, otherwise return a fallback
  return iconMap[normalizedName] || Shield;
};

export const getAvailableIcons = () => {
  return Object.keys(iconMap).map(name => ({
    name,
    component: iconMap[name]
  }));
};