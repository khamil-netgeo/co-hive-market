import { Checkbox } from "@/components/ui/checkbox";
import { Grid } from "lucide-react";

interface ServiceCategoriesProps {
  categories: { id: string; name: string }[];
  selectedCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
}

export default function ServiceCategories({ 
  categories, 
  selectedCategoryIds, 
  onToggleCategory 
}: ServiceCategoriesProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Categories</h3>
        </div>
        
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No categories available yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const checked = selectedCategoryIds.includes(category.id);
              return (
                <label 
                  key={category.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleCategory(category.id)}
                    aria-label={`Category ${category.name}`}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}