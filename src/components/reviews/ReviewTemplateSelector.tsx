import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles } from "lucide-react";
import { useReviewTemplates, type ReviewTemplate } from "@/hooks/useReviews";

type Props = {
  targetType: "product" | "service";
  onSelectTemplate: (template: ReviewTemplate) => void;
  className?: string;
};

export default function ReviewTemplateSelector({ targetType, onSelectTemplate, className }: Props) {
  const { data: templates = [], isLoading } = useReviewTemplates(targetType);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelectTemplate = (template: ReviewTemplate) => {
    setSelectedId(template.id);
    onSelectTemplate(template);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Review Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          Quick Templates
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Use these templates to get started with your review
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${
              selectedId === template.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => handleSelectTemplate(template)}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-sm text-foreground">
                {template.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                Template
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {template.template_text.substring(0, 100)}...
            </p>
            {Object.keys(template.rating_suggestions).length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted-foreground">Suggested ratings:</span>
                {Object.entries(template.rating_suggestions).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs px-1">
                    {key}: {value}★
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}