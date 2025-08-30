import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, User, Shield, Award, CheckCircle } from "lucide-react";
import { useReviewerProfile, type ReviewerProfile } from "@/hooks/useReviews";

type Props = {
  userId: string;
  showStats?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const getVerificationIcon = (level: string) => {
  switch (level) {
    case 'identity_verified':
      return <Shield className="h-3 w-3 text-green-600" />;
    case 'premium_buyer':
      return <Award className="h-3 w-3 text-primary" />;
    case 'phone_verified':
    case 'email_verified':
      return <CheckCircle className="h-3 w-3 text-blue-600" />;
    default:
      return null;
  }
};

const getVerificationLabel = (level: string) => {
  switch (level) {
    case 'identity_verified':
      return 'ID Verified';
    case 'premium_buyer':
      return 'Premium Buyer';
    case 'phone_verified':
      return 'Phone Verified';
    case 'email_verified':
      return 'Email Verified';
    default:
      return null;
  }
};

const getRankColor = (rank: string) => {
  switch (rank) {
    case 'Expert Reviewer':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Top Reviewer':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Experienced Reviewer':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Active Reviewer':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function ReviewerProfile({ userId, showStats = true, size = "md", className }: Props) {
  const { data: profile, isLoading } = useReviewerProfile(userId);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
        <div className="space-y-1">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-2 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">Anonymous Reviewer</div>
          <Badge variant="outline" className="text-xs">
            New Reviewer
          </Badge>
        </div>
      </div>
    );
  }

  const avatarSize = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <Avatar className={avatarSize}>
        <AvatarImage src={profile.avatar_url || ""} />
        <AvatarFallback>
          <User className={size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4"} />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium text-foreground ${textSize} truncate`}>
            {profile.display_name || "Verified Buyer"}
          </span>
          {getVerificationIcon(profile.verification_level)}
        </div>
        
        <div className="flex flex-wrap items-center gap-1">
          <Badge 
            variant="outline" 
            className={`text-xs ${getRankColor(profile.reviewer_rank)}`}
          >
            {profile.reviewer_rank}
          </Badge>
          
          {getVerificationLabel(profile.verification_level) && (
            <Badge variant="secondary" className="text-xs">
              {getVerificationLabel(profile.verification_level)}
            </Badge>
          )}
        </div>

        {showStats && size !== "sm" && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span>{profile.total_reviews} reviews</span>
            </div>
            {profile.average_rating_given > 0 && (
              <div>
                Avg: {profile.average_rating_given.toFixed(1)}★
              </div>
            )}
            {profile.helpful_votes_received > 0 && (
              <div>
                {profile.helpful_votes_received} helpful votes
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}