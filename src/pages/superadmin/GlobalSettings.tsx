import { useEffect, useMemo, useRef, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";
import { Download, Upload, Trash2, Undo2 } from "lucide-react";

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

type ValueType = "text" | "number" | "boolean" | "json";

const QUICK_KEYS = {
  siteName: "site.name",
  supportEmail: "site.support_email",
  maintenanceMode: "site.maintenance_mode",
} as const;

const GlobalSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);

  // Quick settings
  const [siteName, setSiteName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Advanced editor
  const [advKey, setAdvKey] = useState("");
  const [advType, setAdvType] = useState<ValueType>("text");
  const [advText, setAdvText] = useState("");
  const [advNumber, setAdvNumber] = useState<string>("");
  const [advBool, setAdvBool] = useState(false);
  const [advDescription, setAdvDescription] = useState("");
  const [lastDeleted, setLastDeleted] = useState<Setting | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSEO("Super Admin — Global Settings", "Manage global application configuration.");
    load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("id, key, value, description, updated_at, updated_by")
      .order("key");
    if (error) {
      toast({ title: "Failed to load settings", description: error.message });
    } else {
      const rows = (data as any) || [];
      setSettings(rows);
      // Hydrate quick settings
      const getVal = (k: string) => rows.find((r: any) => r.key === k)?.value;
      setSiteName(getVal(QUICK_KEYS.siteName) ?? "");
      setSupportEmail(getVal(QUICK_KEYS.supportEmail) ?? "");
      setMaintenanceMode(Boolean(getVal(QUICK_KEYS.maintenanceMode)) ?? false);
    }
  };

  const upsertSetting = async (key: string, value: any, description?: string | null) => {
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, description: description ?? null }, { onConflict: "key" });
    if (error) throw error;
    await logAudit("app_setting.upsert", "app_settings", key, { description });
  };

  const saveQuick = async () => {
    try {
      await upsertSetting(QUICK_KEYS.siteName, siteName);
      await upsertSetting(QUICK_KEYS.supportEmail, supportEmail);
      await upsertSetting(QUICK_KEYS.maintenanceMode, maintenanceMode);
      toast({ title: "Quick settings saved" });
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message });
    }
  };

  const detectType = (val: any): ValueType => {
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    if (val !== null && typeof val === "object") return "json";
    return "text";
  };

  const pickValueForForm = (val: any) => {
    const t = detectType(val);
    setAdvType(t);
    if (t === "boolean") setAdvBool(Boolean(val));
    if (t === "number") setAdvNumber(String(val));
    if (t === "text") setAdvText(String(val ?? ""));
    if (t === "json") setAdvText(JSON.stringify(val ?? {}, null, 2));
  };

  const onSelectSetting = (s: Setting) => {
    setAdvKey(s.key);
    setAdvDescription(s.description ?? "");
    pickValueForForm(s.value);
  };

  const saveAdvanced = async () => {
    if (!advKey) return;
    try {
      let value: any;
      if (advType === "boolean") value = advBool;
      else if (advType === "number") value = Number(advNumber);
      else if (advType === "json") value = advText ? JSON.parse(advText) : {};
      else value = advText;

      await upsertSetting(advKey, value, advDescription);
      toast({ title: "Setting saved" });
      setLastDeleted(null);
      await load();
    } catch (e: any) {
      toast({ title: advType === "json" ? "Invalid JSON" : "Save failed", description: e.message });
    }
  };

  const deleteSetting = async (key: string) => {
    const s = settings.find((x) => x.key === key);
    if (!s) return;
    if (!window.confirm(`Delete setting "${key}"?`)) return;
    const { error } = await supabase.from("app_settings").delete().eq("key", key);
    if (error) return toast({ title: "Delete failed", description: error.message });
    setLastDeleted(s);
    await logAudit("app_setting.delete", "app_settings", key, {});
    toast({ title: "Deleted", description: "You can undo this action" });
    await load();
  };

  const undoDelete = async () => {
    if (!lastDeleted) return;
    try {
      await upsertSetting(lastDeleted.key, lastDeleted.value, lastDeleted.description ?? undefined);
      setLastDeleted(null);
      toast({ title: "Restored" });
      await load();
    } catch (e: any) {
      toast({ title: "Restore failed", description: e.message });
    }
  };

  const exportSettings = () => {
    const payload = settings.map(({ key, value, description }) => ({ key, value, description }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      let rows: { key: string; value: any; description?: string | null }[] = [];
      if (Array.isArray(json)) rows = json;
      else if (typeof json === "object" && json !== null) {
        rows = Object.entries(json).map(([k, v]) => ({ key: k, value: v as any }));
      }
      if (!rows.length) throw new Error("No settings found in file");
      const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
      await logAudit("app_setting.import", "app_settings", "bulk", { count: rows.length });
      toast({ title: "Imported", description: `${rows.length} settings saved` });
      await load();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) importSettings(f);
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Global Settings</h1>

      {/* Quick settings */}
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Quick settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Common options for non-technical users</p>
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Site name</label>
            <Input placeholder="Your site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Support email</label>
            <Input placeholder="support@example.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <div className="grow">
              <div className="text-sm font-medium">Maintenance mode</div>
              <div className="text-xs text-muted-foreground">Temporarily disable customer actions</div>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={saveQuick}>Save quick settings</Button>
          <Button variant="secondary" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={onFileChange} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Import
          </Button>
          {lastDeleted && (
            <Button variant="ghost" onClick={undoDelete}>
              <Undo2 className="h-4 w-4 mr-2" /> Undo delete
            </Button>
          )}
        </div>
      </div>

      {/* Advanced editor */}
      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Advanced editor</h2>
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Key</label>
            <Input placeholder="e.g. checkout.max_items" value={advKey} onChange={(e) => setAdvKey(e.target.value)} />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Type</label>
            <select
              value={advType}
              onChange={(e) => setAdvType(e.target.value as ValueType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
          </div>
          {advType === "text" && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Value</label>
              <Input value={advText} onChange={(e) => setAdvText(e.target.value)} placeholder="Text value" />
            </div>
          )}
          {advType === "number" && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Value</label>
              <Input type="number" value={advNumber} onChange={(e) => setAdvNumber(e.target.value)} placeholder="0" />
            </div>
          )}
          {advType === "boolean" && (
            <div className="sm:col-span-2 flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Value</div>
                <div className="text-xs text-muted-foreground">Toggle true/false</div>
              </div>
              <Switch checked={advBool} onCheckedChange={setAdvBool} />
            </div>
          )}
          {advType === "json" && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">JSON</label>
              <Textarea value={advText} onChange={(e) => setAdvText(e.target.value)} placeholder='{"some": "json"}' className="min-h-[140px]" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Input value={advDescription} onChange={(e) => setAdvDescription(e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={saveAdvanced} disabled={!advKey}>Save</Button>
          {advKey && (
            <Button variant="destructive" onClick={() => deleteSetting(advKey)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Settings list */}
      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">All settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Click a row to edit in Advanced editor</p>
        <ul className="mt-3 space-y-2 text-sm">
          {settings.map((s) => (
            <li key={s.id} className="border rounded p-2 hover-scale cursor-pointer" onClick={() => onSelectSetting(s)}>
              <div className="font-medium break-all">{s.key}</div>
              <pre className="text-xs whitespace-pre-wrap mt-1 overflow-x-auto">{JSON.stringify(s.value, null, 2)}</pre>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                {s.description && <span>{s.description}</span>}
                {s.updated_at && <span>Updated: {new Date(s.updated_at).toLocaleString()}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default GlobalSettings;
