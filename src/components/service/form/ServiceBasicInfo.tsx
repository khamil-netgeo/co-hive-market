import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface ServiceBasicInfoProps {
  control: Control<any>;
  watch: (name: string) => any;
}

export default function ServiceBasicInfo({ control, watch }: ServiceBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Service Information</h3>
        
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Home Cleaning, Private Tutor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short subtitle (optional)</FormLabel>
              <FormControl>
                <Input placeholder="One line value proposition" {...field} />
              </FormControl>
              <FormDescription>Shown in listings and helps SEO.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Details & inclusions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What's included, exclusions, requirements, certifications, safety notes..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}