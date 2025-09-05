import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Edit2, Trash2, Plus } from "lucide-react";
import { getAvailableIcons } from "@/lib/iconUtils";
import SuperAdminLayout from "./SuperAdminLayout";
import { LandingCategory } from "@/hooks/useLandingCategories";

export default function CategoriesManagement() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon_name: "",
    sort_order: 0,
    is_active: true,
  });

  const availableIcons = getAvailableIcons();

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-landing-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as LandingCategory[];
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon_name: "",
      sort_order: 0,
      is_active: true,
    });
    setEditingId(null);
    setIsCreating(false);
  };

  const handleEdit = (category: LandingCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
      icon_name: category.icon_name,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setEditingId(category.id);
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
    // Set default sort order to be after the last item
    const maxOrder = Math.max(...(categories?.map(c => c.sort_order) || [0]));
    setFormData(prev => ({ ...prev, sort_order: maxOrder + 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from('landing_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-landing-categories'] });
      queryClient.invalidateQueries({ queryKey: ['landing-categories'] });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error("Failed to delete category");
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.icon_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('landing_categories')
          .insert([formData]);

        if (error) throw error;
        toast.success("Category created successfully");
      } else if (editingId) {
        const { error } = await supabase
          .from('landing_categories')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success("Category updated successfully");
      }

      queryClient.invalidateQueries({ queryKey: ['admin-landing-categories'] });
      queryClient.invalidateQueries({ queryKey: ['landing-categories'] });
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Categories Management</h1>
            <p className="text-muted-foreground">Manage landing page categories</p>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted h-20 rounded"></div>
          ))}
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground">Manage landing page categories</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {isCreating ? "Create New Category" : editingId ? "Edit Category" : "Category Management"}
              </CardTitle>
              {!isCreating && !editingId && (
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {(isCreating || editingId) && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Shop Products"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon *</Label>
                    <Select 
                      value={formData.icon_name} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, icon_name: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIcons.map((icon) => (
                          <SelectItem key={icon.name} value={icon.name}>
                            <div className="flex items-center gap-2">
                              <icon.component className="h-4 w-4" />
                              {icon.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                      id="sort_order"
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what users can do in this category"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : isCreating ? "Create" : "Update"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Existing Categories</h3>
              {categories?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No categories found. Create your first category to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories?.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            (Order: {category.sort_order})
                          </span>
                          {!category.is_active && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Icon: {category.icon_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}