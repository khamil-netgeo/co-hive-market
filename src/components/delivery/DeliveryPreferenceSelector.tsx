import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Bike, Package, Zap } from "lucide-react";
import { useRiderPreference, DeliveryPreference } from "@/hooks/useRiderPreference";
import { toast } from "sonner";

interface DeliveryPreferenceSelectorProps {
  className?: string;
}

const DeliveryPreferenceSelector: React.FC<DeliveryPreferenceSelectorProps> = ({ className }) => {
  const { preference, loading, setPreference } = useRiderPreference();

  const handlePreferenceChange = async (value: DeliveryPreference) => {
    try {
      await setPreference(value);
      toast.success("Delivery preference updated");
    } catch (error) {
      toast.error("Failed to update preference");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading preference...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Delivery Preference
        </CardTitle>
        <CardDescription>
          Choose your preferred delivery method when both options are available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={preference} 
          onValueChange={handlePreferenceChange}
          className="space-y-4"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg border">
            <RadioGroupItem value="auto" id="auto" className="mt-1" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="auto" className="font-medium cursor-pointer">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Auto (Recommended)
                </div>
              </Label>
              <p className="text-sm text-muted-foreground">
                Smart selection: riders for fresh items when available, reliable shipping otherwise
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border">
            <RadioGroupItem value="prefer_rider" id="prefer_rider" className="mt-1" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="prefer_rider" className="font-medium cursor-pointer">
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4" />
                  Prefer Riders
                </div>
              </Label>
              <p className="text-sm text-muted-foreground">
                Choose local riders when available. Supports your community directly.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border">
            <RadioGroupItem value="prefer_easyparcel" id="prefer_easyparcel" className="mt-1" />
            <div className="space-y-1 flex-1">
              <Label htmlFor="prefer_easyparcel" className="font-medium cursor-pointer">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Prefer Shipping
                </div>
              </Label>
              <p className="text-sm text-muted-foreground">
                Use EasyParcel shipping when possible. Better for non-perishable items.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default DeliveryPreferenceSelector;