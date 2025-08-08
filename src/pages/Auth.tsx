import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const setSEO = (title: string, description: string) => {
  document.title = title;
  const meta = document.querySelector("meta[name='description']");
  if (meta) meta.setAttribute("content", description);
  else {
    const m = document.createElement("meta");
    m.name = "description";
    m.content = description;
    document.head.appendChild(m);
  }
  // Canonical (basic SPA handling)
  let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = window.location.href;
};

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSEO(
      mode === "signin" ? "Login | Locca Co-op" : "Create Account | Locca Co-op",
      "Securely sign in or create your Locca Co-op account to buy, sell, and join your community."
    );

    // Redirect if already logged in
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace("/");
      }
    };
    init();

    // Keep session reactive (no heavy logic here)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.replace("/");
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [mode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You're now signed in." });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast({
          title: "Check your email",
          description: "We sent a confirmation link to complete your signup.",
        });
      }
    } catch (err: any) {
      toast({ title: "Authentication error", description: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-2xl font-semibold">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
      <form onSubmit={onSubmit} className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="grid gap-2">
          <span className="text-sm">Password</span>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <div className="mt-6 text-sm">
        {mode === "signin" ? (
          <button className="underline" onClick={() => setMode("signup")}>New here? Create an account</button>
        ) : (
          <button className="underline" onClick={() => setMode("signin")}>Already have an account? Sign in</button>
        )}
      </div>
    </main>
  );
}
