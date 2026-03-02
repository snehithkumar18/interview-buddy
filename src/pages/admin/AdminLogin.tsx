import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      // Check if the user is an admin
      const { data: adminUser, error } = await supabase
        .from("admin_users")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error || !adminUser) {
        await supabase.auth.signOut();
        toast.error("Access denied. You are not an admin.");
        return;
      }

      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-secondary" />
            <span className="text-2xl font-bold text-secondary">Admin Portal</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Sign In</h1>
          <p className="text-muted-foreground text-sm">Access restricted to authorized personnel</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-lg p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@interviewai.com" required className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background border-border" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In as Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
}
