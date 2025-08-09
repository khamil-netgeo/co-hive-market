import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

type Addon = { name: string; priceDelta: string; timeDelta: string };

interface ServiceAddonsProps {
  addons: Addon[];
  onAddAddon: () => void;
  onRemoveAddon: (idx: number) => void;
  onUpdateAddon: (idx: number, patch: Partial<Addon>) => void;
}

export default function ServiceAddons({ 
  addons, 
  onAddAddon, 
  onRemoveAddon, 
  onUpdateAddon 
}: ServiceAddonsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add-ons (Optional)</h3>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={onAddAddon}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add add-on
          </Button>
        </div>
        
        {addons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No add-ons yet. Add optional extras to increase your service value.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addons.map((addon, i) => (
              <div key={i} className="grid grid-cols-1 gap-3 p-4 border rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input 
                      placeholder="e.g. Deep clean" 
                      value={addon.name} 
                      onChange={e => onUpdateAddon(i, { name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Extra price</label>
                    <Input 
                      placeholder="e.g. 20.00" 
                      type="number" 
                      step="0.01" 
                      value={addon.priceDelta} 
                      onChange={e => onUpdateAddon(i, { priceDelta: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Extra time (min)</label>
                    <Input 
                      placeholder="e.g. 15" 
                      type="number" 
                      value={addon.timeDelta} 
                      onChange={e => onUpdateAddon(i, { timeDelta: e.target.value })} 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onRemoveAddon(i)}
                    className="text-destructive hover:text-destructive flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}