import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCommunity } from "@/context/CommunityContext";

type Option = { id: string; name: string };

export default function CommunitySelector() {
  const { selected, setSelected, clear } = useCommunity();
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("communities")
          .select("id,name")
          .order("name");
        if (error) throw error;
        setOptions((data as any[]) || []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const value = selected.id ?? "all";

  const onChange = (val: string) => {
    if (val === "all") {
      clear();
      return;
    }
    const opt = options.find((o) => o.id === val);
    setSelected({ id: val, name: opt?.name ?? null });
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-[11rem]">
        <SelectValue placeholder="All communities" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">All communities</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
