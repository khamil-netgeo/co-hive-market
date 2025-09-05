import { useState, useEffect } from "react";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Trash2, Edit, Plus } from "lucide-react";

interface PageContent {
  id: string;
  page_slug: string;
  content_key: string;
  content_value: string;
  content_type: string;
  is_active: boolean;
}

const PAGE_SLUGS = [
  { value: "hero", label: "Hero Section" },
  { value: "trust", label: "Trust Section" },
  { value: "features", label: "Features Section" },
  { value: "footer", label: "Footer" },
  { value: "about", label: "About Page" },
];

const CONTENT_TYPES = [
  { value: "text", label: "Text" },
  { value: "html", label: "HTML" },
  { value: "json", label: "JSON" },
];

export default function PageContentManagement() {
  const [content, setContent] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPage, setSelectedPage] = useState<string>("all");
  
  // Form state
  const [formData, setFormData] = useState({
    page_slug: "hero",
    content_key: "",
    content_value: "",
    content_type: "text",
    is_active: true
  });

  useEffect(() => {
    setSEO("Page Content Management | CoopMarket", "Manage dynamic page content");
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      let query = supabase
        .from("page_content")
        .select("*")
        .order("page_slug", { ascending: true });

      if (selectedPage !== "all") {
        query = query.eq("page_slug", selectedPage);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContent(data || []);
    } catch (error) {
      console.error("Error loading page content:", error);
      toast.error("Failed to load page content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadContent();
    }
  }, [selectedPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        const { error } = await supabase
          .from("page_content")
          .update(formData)
          .eq("id", editing);
        
        if (error) throw error;
        toast.success("Content updated successfully");
      } else {
        const { error } = await supabase
          .from("page_content")
          .insert([formData]);
        
        if (error) throw error;
        toast.success("Content created successfully");
      }

      resetForm();
      loadContent();
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    }
  };

  const handleEdit = (contentItem: PageContent) => {
    setFormData({
      page_slug: contentItem.page_slug,
      content_key: contentItem.content_key,
      content_value: contentItem.content_value,
      content_type: contentItem.content_type,
      is_active: contentItem.is_active
    });
    setEditing(contentItem.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content item?")) return;

    try {
      const { error } = await supabase
        .from("page_content")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Content deleted successfully");
      loadContent();
    } catch (error) {
      console.error("Error deleting content:", error);
      toast.error("Failed to delete content");
    }
  };

  const resetForm = () => {
    setFormData({
      page_slug: "hero",
      content_key: "",
      content_value: "",
      content_type: "text",
      is_active: true
    });
    setEditing(null);
    setShowForm(false);
  };

  const groupedContent = content.reduce((acc, item) => {
    if (!acc[item.page_slug]) {
      acc[item.page_slug] = [];
    }
    acc[item.page_slug].push(item);
    return acc;
  }, {} as Record<string, PageContent[]>);

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
          <h1 className="text-3xl font-bold">Page Content Management</h1>
          <p className="text-muted-foreground">Manage dynamic content for website pages</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {PAGE_SLUGS.map((page) => (
                <SelectItem key={page.value} value={page.value}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Content" : "Add New Content"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page_slug">Page</Label>
                  <Select
                    value={formData.page_slug}
                    onValueChange={(value) => setFormData({ ...formData, page_slug: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SLUGS.map((page) => (
                        <SelectItem key={page.value} value={page.value}>
                          {page.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content_key">Content Key</Label>
                  <Input
                    id="content_key"
                    value={formData.content_key}
                    onChange={(e) => setFormData({ ...formData, content_key: e.target.value })}
                    placeholder="e.g., main_headline"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_value">Content Value</Label>
                <Textarea
                  id="content_value"
                  value={formData.content_value}
                  onChange={(e) => setFormData({ ...formData, content_value: e.target.value })}
                  rows={formData.content_type === "html" || formData.content_type === "json" ? 8 : 4}
                  required
                />
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
                  {editing ? "Update Content" : "Create Content"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <div className="space-y-6">
        {Object.entries(groupedContent).map(([pageSlug, items]) => (
          <Card key={pageSlug}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {PAGE_SLUGS.find(p => p.value === pageSlug)?.label || pageSlug}
                <Badge variant="secondary">{items.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{item.content_key}</code>
                        <Badge variant="outline">{item.content_type}</Badge>
                        {!item.is_active && <Badge variant="destructive">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.content_value.length > 100 
                          ? `${item.content_value.substring(0, 100)}...` 
                          : item.content_value}
                      </p>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedContent).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No content found. Create your first content item to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}