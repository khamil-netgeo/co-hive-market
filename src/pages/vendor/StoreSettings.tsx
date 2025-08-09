import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import useAuthRoles from "@/hooks/useAuthRoles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Save } from "lucide-react";
import { setSEO } from "@/lib/seo";
import KycUploader from "@/components/kyc/KycUploader";

interface OpeningDay {
  open: string;
  close: string;
  closed: boolean;
}

type OpeningHours = Record<string, OpeningDay>;

const defaultDay: OpeningDay = { open: "09:00", close: "18:00", closed: false };
const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function StoreSettings() {
  const { user } = useAuthRoles();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendorId, setVendorId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [hours, setHours] = useState<OpeningHours>(() => {
    const init: OpeningHours = {} as any;
    days.forEach((d) => (init[d] = { ...defaultDay }));
    return init;
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const { data: vendor, error } = await supabase
          .from("vendors")
          .select("id, display_name, description, logo_url, opening_hours, website_url, facebook_url, instagram_url, tiktok_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!vendor) {
          toast.error("No vendor profile found for your account.");
          return;
        }
        setVendorId(vendor.id);
        setDisplayName(vendor.display_name ?? "");
        setDescription(vendor.description ?? "");
        setLogoUrl(vendor.logo_url ?? null);
        setWebsiteUrl(vendor.website_url ?? "");
        setFacebookUrl(vendor.facebook_url ?? "");
        setInstagramUrl(vendor.instagram_url ?? "");
        setTiktokUrl(vendor.tiktok_url ?? "");
        if (vendor.opening_hours) setHours(vendor.opening_hours as unknown as OpeningHours);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load store settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    setSEO("Store Settings — Vendor | CoopMarket", "Manage store info, logo, hours, and social links.");
  }, []);

  const previewUrl = useMemo(() => {
    if (logoFile) return URL.createObjectURL(logoFile);
    return logoUrl ?? undefined;
  }, [logoFile, logoUrl]);

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  const uploadLogoIfNeeded = async (): Promise<string | null> => {
    if (!logoFile || !user?.id) return logoUrl ?? null;
    try {
      const path = `${user.id}/logo-${Date.now()}-${logoFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("store-logos")
        .upload(path, logoFile, {
          cacheControl: "3600",
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("store-logos").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      toast.error("Logo upload failed");
      return logoUrl ?? null;
    }
  };

  const save = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      const finalLogo = await uploadLogoIfNeeded();
      const payload: any = {
        display_name: displayName,
        description,
        opening_hours: hours,
        website_url: websiteUrl || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        tiktok_url: tiktokUrl || null,
      };
      if (finalLogo) payload.logo_url = finalLogo;

      const { error } = await supabase
        .from("vendors")
        .update(payload)
        .eq("id", vendorId);
      if (error) throw error;
      setLogoFile(null);
      if (finalLogo) setLogoUrl(finalLogo);
      toast.success("Store settings saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const setDay = (d: typeof days[number], patch: Partial<OpeningDay>) =>
    setHours((h) => ({ ...h, [d]: { ...h[d], ...patch } }));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading store settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gradient-brand">Store Settings</h1>
          <p className="text-muted-foreground mt-2">Logo, description and opening hours</p>
        </div>
        <Button onClick={save} disabled={saving || !vendorId} className="w-full sm:w-auto min-w-32">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Store Name</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your store name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell customers about your store"
                rows={4}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Store logo preview"
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-md object-cover border flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-md border flex items-center justify-center text-muted-foreground flex-shrink-0">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <div className="flex-1 w-full space-y-3">
                <Input type="file" accept="image/*" onChange={onLogoChange} className="h-11" />
                {logoUrl && (
                  <div className="space-y-1">
                    <Badge variant="secondary">Current</Badge>
                    <p className="text-xs text-muted-foreground break-all">{logoUrl}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Online presence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website_url">Website</Label>
                <Input 
                  id="website_url" 
                  placeholder="https://yourstore.com" 
                  value={websiteUrl} 
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook</Label>
                <Input 
                  id="facebook_url" 
                  placeholder="https://facebook.com/yourpage" 
                  value={facebookUrl} 
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram</Label>
                <Input 
                  id="instagram_url" 
                  placeholder="https://instagram.com/yourhandle" 
                  value={instagramUrl} 
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok</Label>
                <Input 
                  id="tiktok_url" 
                  placeholder="https://tiktok.com/@yourhandle" 
                  value={tiktokUrl} 
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">These links may be shown on your store profile and help with SEO.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Opening Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((d) => (
            <div key={d} className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="font-medium text-base capitalize min-w-16 flex-shrink-0">{d}</div>
                <div className="flex items-center gap-3">
                  <input
                    id={`closed-${d}`}
                    type="checkbox"
                    checked={hours[d].closed}
                    onChange={(e) => setDay(d, { closed: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor={`closed-${d}`} className="text-sm font-medium cursor-pointer whitespace-nowrap">
                    Closed
                  </Label>
                </div>
              </div>
              
              {!hours[d].closed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Open</Label>
                    <Input
                      type="time"
                      value={hours[d].open}
                      onChange={(e) => setDay(d, { open: e.target.value })}
                      className="w-full h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Close</Label>
                    <Input
                      type="time"
                      value={hours[d].close}
                      onChange={(e) => setDay(d, { close: e.target.value })}
                      className="w-full h-11"
                    />
                  </div>
                </div>
              )}
              
              {hours[d].closed && (
                <div className="text-center py-3 text-muted-foreground">
                  Closed all day
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6">
        <KycUploader role="vendor" />
      </div>

      <div className="mt-6 flex justify-center sm:justify-end">
        <Button onClick={save} disabled={saving || !vendorId} className="w-full sm:w-auto min-w-32">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
