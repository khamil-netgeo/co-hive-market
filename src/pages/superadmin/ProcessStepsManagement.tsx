import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { getLucideIcon } from "@/lib/iconUtils";

interface ProcessStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

const processStepSchema = z.object({
  step_number: z.number().min(1).max(10),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon_name: z.string().min(1),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type ProcessStepForm = z.infer<typeof processStepSchema>;

// Common Lucide icons for process steps
const ICON_OPTIONS = [
  'user-plus', 'dollar-sign', 'trending-up', 'users', 'handshake', 
  'target', 'rocket', 'star', 'check-circle', 'arrow-right',
  'shopping-cart', 'credit-card', 'truck', 'home', 'globe'
];

const ProcessStepsManagement = () => {
  const { toast } = useToast();
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<ProcessStepForm>({
    resolver: zodResolver(processStepSchema),
    defaultValues: {
      step_number: 1,
      title: "",
      description: "",
      icon_name: "user-plus",
      display_order: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    setSEO("Process Steps Management | CoopMarket", "Manage How It Works process steps");
    loadSteps();
  }, []);

  const loadSteps = async () => {
    try {
      const { data, error } = await supabase
        .from("process_steps")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (error) {
      console.error("Error loading process steps:", error);
      toast({
        title: "Error",
        description: "Failed to load process steps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ProcessStepForm) => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from("process_steps")
          .update({
            step_number: values.step_number,
            title: values.title,
            description: values.description,
            icon_name: values.icon_name,
            display_order: values.display_order,
            is_active: values.is_active,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Process step updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("process_steps")
          .insert({
            step_number: values.step_number,
            title: values.title,
            description: values.description,
            icon_name: values.icon_name,
            display_order: values.display_order,
            is_active: values.is_active,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Process step created successfully",
        });
      }

      form.reset();
      setEditingId(null);
      setShowAddForm(false);
      loadSteps();
    } catch (error) {
      console.error("Error saving process step:", error);
      toast({
        title: "Error",
        description: "Failed to save process step",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (step: ProcessStep) => {
    form.reset({
      step_number: step.step_number,
      title: step.title,
      description: step.description,
      icon_name: step.icon_name,
      display_order: step.display_order,
      is_active: step.is_active,
    });
    setEditingId(step.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this process step?")) return;

    try {
      const { error } = await supabase
        .from("process_steps")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Process step deleted successfully",
      });
      loadSteps();
    } catch (error) {
      console.error("Error deleting process step:", error);
      toast({
        title: "Error",
        description: "Failed to delete process step",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setEditingId(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
          <p className="text-sm text-muted-foreground">Loading process steps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Process Steps Management</h1>
          <p className="text-muted-foreground">Manage the How It Works section steps</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Process Step" : "Add New Process Step"}</CardTitle>
            <CardDescription>
              {editingId ? "Update the process step details" : "Create a new step for the How It Works section"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="step_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Step Number</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="display_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Join a Community" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe this step in detail..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {ICON_OPTIONS.map((icon) => {
                            const IconComponent = getLucideIcon(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Show this step on the website
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button type="submit">
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Update" : "Create"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {steps.map((step) => {
          const IconComponent = getLucideIcon(step.icon_name);
          return (
            <Card key={step.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">Step {step.step_number}</Badge>
                        <Badge variant={step.is_active ? "default" : "secondary"}>
                          {step.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Order: {step.display_order} • Icon: {step.icon_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(step)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(step.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {steps.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No process steps found. Add one to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProcessStepsManagement;