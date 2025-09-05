import { useState, useEffect } from "react";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, Trash2, Edit, Plus, RefreshCw } from "lucide-react";

interface SiteStatistic {
  id: string;
  stat_key: string;
  stat_value: string;
  stat_label: string;
  display_order: number;
  is_active: boolean;
}

export default function StatisticsManagement() {
  const [statistics, setStatistics] = useState<SiteStatistic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    stat_key: "",
    stat_value: "",
    stat_label: "",
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    setSEO("Statistics Management | CoopMarket", "Manage site statistics displayed on the homepage");
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("site_statistics")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setStatistics(data || []);
    } catch (error) {
      console.error("Error loading statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const updateRealTimeStats = async () => {
    setUpdating(true);
    try {
      // Get real counts from database
      const [vendorsResult, productsResult, communitiesResult, servicesResult] = await Promise.all([
        supabase.from("vendors").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("communities").select("id", { count: "exact" }),
        supabase.from("vendor_services").select("id", { count: "exact" })
      ]);

      const updates = [];

      // Update vendor count
      if (vendorsResult.count !== null) {
        updates.push({
          stat_key: "active_vendors",
          stat_value: vendorsResult.count.toString(),
        });
      }

      // Update product count
      if (productsResult.count !== null) {
        updates.push({
          stat_key: "products_listed",
          stat_value: productsResult.count.toString(),
        });
      }

      // Update community count
      if (communitiesResult.count !== null) {
        updates.push({
          stat_key: "total_communities",
          stat_value: communitiesResult.count.toString(),
        });
      }

      // Update each statistic
      for (const update of updates) {
        await supabase
          .from("site_statistics")
          .update({ stat_value: update.stat_value })
          .eq("stat_key", update.stat_key);
      }

      toast.success("Statistics updated with real-time data");
      loadStatistics();
    } catch (error) {
      console.error("Error updating real-time stats:", error);
      toast.error("Failed to update real-time statistics");
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        const { error } = await supabase
          .from("site_statistics")
          .update(formData)
          .eq("id", editing);
        
        if (error) throw error;
        toast.success("Statistic updated successfully");
      } else {
        const { error } = await supabase
          .from("site_statistics")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Statistic created successfully");
      }

      resetForm();
      loadStatistics();
    } catch (error) {
      console.error("Error saving statistic:", error);
      toast.error("Failed to save statistic");
    }
  };

  const handleEdit = (statistic: SiteStatistic) => {
    setFormData({
      stat_key: statistic.stat_key,
      stat_value: statistic.stat_value,
      stat_label: statistic.stat_label,
      display_order: statistic.display_order,
      is_active: statistic.is_active
    });
    setEditing(statistic.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this statistic?")) return;

    try {
      const { error } = await supabase
        .from("site_statistics")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Statistic deleted successfully");
      loadStatistics();
    } catch (error) {
      console.error("Error deleting statistic:", error);
      toast.error("Failed to delete statistic");
    }
  };

  const resetForm = () => {
    setFormData({
      stat_key: "",
      stat_value: "",
      stat_label: "",
      display_order: statistics.length,
      is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statistics Management</h1>
          <p className="text-muted-foreground">Manage site statistics displayed on the homepage</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={updateRealTimeStats} 
            variant="outline" 
            disabled={updating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
            Update Real Stats
          </Button>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Statistic
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Statistic" : "Add New Statistic"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_key">Statistic Key</Label>
                  <Input
                    id="stat_key"
                    value={formData.stat_key}
                    onChange={(e) => setFormData({ ...formData, stat_key: e.target.value })}
                    placeholder="e.g., active_vendors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_value">Value</Label>
                  <Input
                    id="stat_value"
                    value={formData.stat_value}
                    onChange={(e) => setFormData({ ...formData, stat_value: e.target.value })}
                    placeholder="e.g., 2,500+"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_label">Label</Label>
                  <Input
                    id="stat_label"
                    value={formData.stat_label}
                    onChange={(e) => setFormData({ ...formData, stat_label: e.target.value })}
                    placeholder="e.g., Active Vendors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editing ? "Update Statistic" : "Create Statistic"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Statistics List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statistics.map((statistic) => (
          <Card key={statistic.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <Badge variant="secondary" className="text-xs">{statistic.stat_key}</Badge>
                    {!statistic.is_active && <Badge variant="destructive" className="ml-1">Inactive</Badge>}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(statistic)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(statistic.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">{statistic.stat_value}</div>
                <div className="text-sm text-muted-foreground">{statistic.stat_label}</div>
                <div className="text-xs text-muted-foreground mt-2">Order: {statistic.display_order}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {statistics.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No statistics found. Create your first statistic to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}