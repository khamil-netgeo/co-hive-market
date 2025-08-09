import { useEffect, useMemo, useState } from "react";
import { setSEO } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/lib/audit";

interface RoleRow { user_id: string; role: string }

const UsersRoles = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [foundUser, setFoundUser] = useState<{ id: string; email: string } | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSEO("Super Admin — Users & Roles", "Manage user roles including admin and superadmin.");
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, string[]>();
    roles.forEach(r => {
      const list = map.get(r.user_id) || [];
      if (!list.includes(r.role)) list.push(r.role);
      map.set(r.user_id, list);
    });
    return Array.from(map.entries());
  }, [roles]);

  const loadRoles = async () => {
    const { data, error } = await supabase.from("user_roles").select("user_id, role");
    if (error) {
      toast({ title: "Failed to load roles", description: error.message });
    } else {
      setRoles((data as any) || []);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const findUser = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "find_user", email }
    });
    setLoading(false);
    if (error) return toast({ title: "Lookup failed", description: error.message });
    if (!data?.user) return toast({ title: "Not found", description: "No user with that email" });
    setFoundUser(data.user);
  };

  const changeRole = async (role: string, action: "assign_role" | "remove_role") => {
    if (!foundUser) return;
    const { error } = await supabase.functions.invoke("admin-users", {
      body: { action, user_id: foundUser.id, role }
    });
    if (error) return toast({ title: "Role update failed", description: error.message });
    await logAudit(`role.${action === 'assign_role' ? 'assign' : 'remove'}`, 'user_roles', foundUser.id, { role });
    toast({ title: "Success", description: `${action === 'assign_role' ? 'Added' : 'Removed'} ${role}` });
    await loadRoles();
  };

  return (
    <section>
      <h1 className="sr-only">Super Admin Users & Roles</h1>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Enter email to find user" value={email} onChange={e => setEmail(e.target.value)} />
          <Button onClick={findUser} disabled={loading || !email}>Find</Button>
        </div>
        {foundUser && (
          <div className="mt-4 text-sm">
            <p>Found: <strong>{foundUser.email}</strong> ({foundUser.id})</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => changeRole("admin", "assign_role")}>Grant Admin</Button>
              <Button size="sm" variant="secondary" onClick={() => changeRole("admin", "remove_role")}>Remove Admin</Button>
              <Button size="sm" onClick={() => changeRole("superadmin", "assign_role")}>Grant Superadmin</Button>
              <Button size="sm" variant="secondary" onClick={() => changeRole("superadmin", "remove_role")}>Remove Superadmin</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="text-lg font-medium">Assigned Roles</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">User ID</th>
                <th className="py-2">Roles</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([uid, r]) => (
                <tr key={uid} className="border-t">
                  <td className="py-2 pr-4 font-mono text-xs">{uid}</td>
                  <td className="py-2">{r.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default UsersRoles;
