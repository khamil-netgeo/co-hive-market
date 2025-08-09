import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  className?: string;
}

export default function ShareButtons({ title, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";

  const onShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onShare} aria-label="Share">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share</span>
        </Button>
        <Button size="sm" variant="outline" onClick={copyLink} aria-label="Copy link">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <LinkIcon className="h-4 w-4" />}
          <span className="sr-only">Copy link</span>
        </Button>
      </div>
    </div>
  );
}
