import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Control } from "react-hook-form";

interface ServiceLocationProps {
  control: Control<any>;
  watch: (name: string) => any;
}

const AVAIL_PRESETS = [
  { id: "weekdays_9_6", label: "Weekdays 9am–6pm" },
  { id: "weekends", label: "Weekends" },
  { id: "custom", label: "Custom / on request" },
];

export default function ServiceLocation({ control, watch }: ServiceLocationProps) {
  const locationType = watch("location_type");
  const showTravel = watch("show_travel_fee");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location & Availability</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="location_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="vendor">At vendor</SelectItem>
                    <SelectItem value="customer">At customer</SelectItem>
                    <SelectItem value="remote">Remote / online</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="availability_preset"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability preset</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="z-50 bg-popover">
                    {AVAIL_PRESETS.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {locationType !== "remote" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="service_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service area (districts/areas)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. KLCC, Bangsar, PJ" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="radius_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Radius (km, optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="e.g. 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="lead_time_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum notice (hours)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="e.g. 24" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="show_travel_fee"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FormLabel>Charge travel fee</FormLabel>
                  <FormDescription>Enable per‑km travel fee</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {showTravel && (
          <FormField
            control={control}
            name="travel_fee_per_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travel fee per km (currency)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="e.g. 1.50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}