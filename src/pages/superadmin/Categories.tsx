import { useEffect, useMemo, useState } from "react";
import SuperAdminLayout from "./SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { setSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";

// Local type to avoid relying on generated DB types
interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: "product" | "service" | "both";
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function Categories() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState<Category["type"]>("both");
  const [parentId, setParentId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    setSEO(
      "Manage Categories – Super Admin",
      "Create and organize product and service categories for the catalog."
    );
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setCategories((data as Category[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setType("both");
    setParentId(null);
    setIsActive(true);
    setSortOrder(0);
    setDescription("");
  };

  const onEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setType(c.type);
    setParentId(c.parent_id);
    setIsActive(c.is_active);
    setSortOrder(c.sort_order);
    setDescription(c.description || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      await load();
      if (editingId === id) resetForm();
    }
  };

  const onSave = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const newSlug = slug || slugify(name);
    setSaving(true);
    const payload: Partial<Category> = {
      name: name.trim(),
      slug: newSlug,
      type,
      parent_id: parentId || null,
      is_active: isActive,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      description: description || null,
    };
    const { error } = editingId
      ? await supabase.from("categories").update(payload).eq("id", editingId)
      : await supabase.from("categories").insert(payload as any);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Category updated" : "Category created" });
      await load();
      resetForm();
    }
  };

  const tree = useMemo(() => {
    const byParent = new Map<string | null, Category[]>();
    categories.forEach((c) => {
      const key = c.parent_id;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    });
    return byParent;
  }, [categories]);

  const renderTree = (parent: string | null, depth = 0) => {
    const nodes = tree.get(parent) || [];
    return (
      <ul className="space-y-2">
        {nodes.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 rounded-md border p-3 hover:bg-muted/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium" style={{ paddingLeft: depth * 8 }}>{c.name}</span>
                <span className="text-xs text-muted-foreground">/{c.slug}</span>
                {!c.is_active && (
                  <span className="text-xs rounded bg-muted px-2 py-0.5">inactive</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Type: {c.type} · Order: {c.sort_order}
              </div>
              {c.description && (
                <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(c)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
        {nodes.map((c) => (
          <li key={`${c.id}-children`}>
            {renderTree(c.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <SuperAdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          {/* Form */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => {
                setName(e.target.value);
                if (!editingId) setSlug(slugify(e.target.value));
              }} placeholder="e.g. Fresh Produce" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder="fresh-produce" />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as Category["type"]) }>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Parent</Label>
              <Select value={parentId || ""} onValueChange={(v) => setParentId(v || null)}>
                <SelectTrigger><SelectValue placeholder="No parent (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">(No parent)</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <Label htmlFor="active">Active</Label>
                <span className="text-xs text-muted-foreground">Only active categories are public</span>
              </div>
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sort">Sort order</Label>
              <Input id="sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value, 10))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingId ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" /> New
              </Button>
            </div>
          </div>

          {/* Tree */}
          <div>
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No categories yet. Create your first category.</div>
            ) : (
              <div className="space-y-3">
                {renderTree(null)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </SuperAdminLayout>
  );
}
