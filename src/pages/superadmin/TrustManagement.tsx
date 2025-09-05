import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { useTrustFeatures, useTrustGuarantees } from "@/hooks/useTrustFeatures";
import { getAvailableIcons } from "@/lib/iconUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for trust features
const trustFeatureSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  icon_name: z.string().min(1, "Icon is required"),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

// Schema for trust guarantees
const trustGuaranteeSchema = z.object({
  guarantee_text: z.string().min(1, "Guarantee text is required"),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type TrustFeatureForm = z.infer<typeof trustFeatureSchema>;
type TrustGuaranteeForm = z.infer<typeof trustGuaranteeSchema>;

const TrustManagement = () => {
  const { toast } = useToast();
  const { data: trustFeatures = [], refetch: refetchFeatures } = useTrustFeatures();
  const { data: guarantees = [], refetch: refetchGuarantees } = useTrustGuarantees();
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [editingGuarantee, setEditingGuarantee] = useState<string | null>(null);
  const [showNewFeatureForm, setShowNewFeatureForm] = useState(false);
  const [showNewGuaranteeForm, setShowNewGuaranteeForm] = useState(false);

  const availableIcons = getAvailableIcons();

  const {
    register: registerFeature,
    handleSubmit: handleSubmitFeature,
    setValue: setValueFeature,
    reset: resetFeature,
    watch: watchFeature,
    formState: { errors: featureErrors }
  } = useForm<TrustFeatureForm>({
    resolver: zodResolver(trustFeatureSchema),
    defaultValues: {
      display_order: 0,
      is_active: true,
    }
  });

  const {
    register: registerGuarantee,
    handleSubmit: handleSubmitGuarantee,
    setValue: setValueGuarantee,
    reset: resetGuarantee,
    watch: watchGuarantee,
    formState: { errors: guaranteeErrors }
  } = useForm<TrustGuaranteeForm>({
    resolver: zodResolver(trustGuaranteeSchema),
    defaultValues: {
      display_order: 0,
      is_active: true,
    }
  });

  useEffect(() => {
    setSEO("Trust Management — CoopMarket", "Manage trust features and guarantees displayed on the landing page.");
  }, []);

  const handleCreateFeature = async (data: TrustFeatureForm) => {
    try {
      // Ensure all required fields are present
      const insertData = {
        title: data.title,
        description: data.description,
        icon_name: data.icon_name,
        display_order: data.display_order,
        is_active: data.is_active
      };

      const { error } = await supabase
        .from("trust_features")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust feature created successfully",
      });

      resetFeature();
      setShowNewFeatureForm(false);
      refetchFeatures();
    } catch (error) {
      console.error("Error creating trust feature:", error);
      toast({
        title: "Error",
        description: "Failed to create trust feature",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFeature = async (id: string, data: TrustFeatureForm) => {
    try {
      const { error } = await supabase
        .from("trust_features")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust feature updated successfully",
      });

      setEditingFeature(null);
      refetchFeatures();
    } catch (error) {
      console.error("Error updating trust feature:", error);
      toast({
        title: "Error",
        description: "Failed to update trust feature",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeature = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trust_features")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust feature deleted successfully",
      });

      refetchFeatures();
    } catch (error) {
      console.error("Error deleting trust feature:", error);
      toast({
        title: "Error",
        description: "Failed to delete trust feature",
        variant: "destructive",
      });
    }
  };

  const handleCreateGuarantee = async (data: TrustGuaranteeForm) => {
    try {
      // Ensure all required fields are present
      const insertData = {
        guarantee_text: data.guarantee_text,
        display_order: data.display_order,
        is_active: data.is_active
      };

      const { error } = await supabase
        .from("trust_guarantees")
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust guarantee created successfully",
      });

      resetGuarantee();
      setShowNewGuaranteeForm(false);
      refetchGuarantees();
    } catch (error) {
      console.error("Error creating trust guarantee:", error);
      toast({
        title: "Error",
        description: "Failed to create trust guarantee",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGuarantee = async (id: string, data: TrustGuaranteeForm) => {
    try {
      const { error } = await supabase
        .from("trust_guarantees")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust guarantee updated successfully",
      });

      setEditingGuarantee(null);
      refetchGuarantees();
    } catch (error) {
      console.error("Error updating trust guarantee:", error);
      toast({
        title: "Error",
        description: "Failed to update trust guarantee",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGuarantee = async (id: string) => {
    try {
      const { error } = await supabase
        .from("trust_guarantees")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trust guarantee deleted successfully",
      });

      refetchGuarantees();
    } catch (error) {
      console.error("Error deleting trust guarantee:", error);
      toast({
        title: "Error",
        description: "Failed to delete trust guarantee",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trust Management</h1>
        <p className="text-muted-foreground">
          Manage trust features and guarantees displayed on your landing page
        </p>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Trust Features</TabsTrigger>
          <TabsTrigger value="guarantees">Trust Guarantees</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Trust Features</h2>
            <Button onClick={() => setShowNewFeatureForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Feature
            </Button>
          </div>

          {showNewFeatureForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Trust Feature</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitFeature(handleCreateFeature)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input {...registerFeature("title")} />
                    {featureErrors.title && (
                      <p className="text-sm text-red-500">{featureErrors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea {...registerFeature("description")} />
                    {featureErrors.description && (
                      <p className="text-sm text-red-500">{featureErrors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="icon_name">Icon</Label>
                    <Select onValueChange={(value) => setValueFeature("icon_name", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map(({ name, component: Icon }) => (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {featureErrors.icon_name && (
                      <p className="text-sm text-red-500">{featureErrors.icon_name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input 
                        type="number" 
                        {...registerFeature("display_order", { valueAsNumber: true })} 
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={watchFeature("is_active")} 
                        onCheckedChange={(checked) => setValueFeature("is_active", checked)}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Save Feature
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowNewFeatureForm(false);
                        resetFeature();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {trustFeatures.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={feature.is_active ? "default" : "secondary"}>
                        {feature.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Icon: {feature.icon_name} • Order: {feature.display_order}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingFeature(feature.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFeature(feature.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guarantees" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Trust Guarantees</h2>
            <Button onClick={() => setShowNewGuaranteeForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Guarantee
            </Button>
          </div>

          {showNewGuaranteeForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Trust Guarantee</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitGuarantee(handleCreateGuarantee)} className="space-y-4">
                  <div>
                    <Label htmlFor="guarantee_text">Guarantee Text</Label>
                    <Input {...registerGuarantee("guarantee_text")} />
                    {guaranteeErrors.guarantee_text && (
                      <p className="text-sm text-red-500">{guaranteeErrors.guarantee_text.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="display_order">Display Order</Label>
                      <Input 
                        type="number" 
                        {...registerGuarantee("display_order", { valueAsNumber: true })} 
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={watchGuarantee("is_active")} 
                        onCheckedChange={(checked) => setValueGuarantee("is_active", checked)}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Save Guarantee
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowNewGuaranteeForm(false);
                        resetGuarantee();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {guarantees.map((guarantee) => (
              <Card key={guarantee.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={guarantee.is_active ? "default" : "secondary"}>
                        {guarantee.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div>
                        <h3 className="font-medium">{guarantee.guarantee_text}</h3>
                        <p className="text-xs text-muted-foreground">
                          Order: {guarantee.display_order}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingGuarantee(guarantee.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteGuarantee(guarantee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrustManagement;