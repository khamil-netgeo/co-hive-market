import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, DollarSign, Star, CheckCircle2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Community {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  member_discount_percent: number;
}

interface TouchOptimizedCommunityCardProps {
  community: Community;
  isSelected?: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
  showJoinButton?: boolean;
}

export default function TouchOptimizedCommunityCard({
  community,
  isSelected = false,
  isRecommended = false,
  onSelect,
  showJoinButton = false
}: TouchOptimizedCommunityCardProps) {
  const isMobile = useIsMobile();

  const cardContent = (
    <>
      {/* Header with logo and badges */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {community.logo_url ? (
            <img 
              src={community.logo_url} 
              alt={`${community.name} logo`}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">
              {community.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Local Community</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {isRecommended && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Best Match
            </Badge>
          )}
          {isSelected && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        isMobile ? "line-clamp-2" : "line-clamp-3"
      )}>
        {community.description}
      </p>

      {/* Benefits */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1 text-green-600">
          <DollarSign className="h-4 w-4" />
          <span className="font-medium">{community.member_discount_percent}% off</span>
        </div>
        <div className="flex items-center gap-1 text-blue-600">
          <Users className="h-4 w-4" />
          <span className="font-medium">Community</span>
        </div>
      </div>

      {/* Join button for mobile */}
      {showJoinButton && isMobile && (
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-full mt-4 h-10"
          variant={isSelected ? "outline" : "default"}
        >
          {isSelected ? "Selected" : "Join Community"}
        </Button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Card 
        className={cn(
          "p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]",
          isSelected && "ring-2 ring-primary ring-offset-2",
          isRecommended && "border-primary/50 bg-primary/5"
        )}
        onClick={onSelect}
      >
        {cardContent}
      </Card>
    );
  }

  // Desktop version (existing behavior)
  return (
    <Card 
      className={cn(
        "p-6 cursor-pointer transition-all hover:shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2",
        isRecommended && "border-primary/50 bg-primary/5"
      )}
      onClick={onSelect}
    >
      {cardContent}
    </Card>
  );
}