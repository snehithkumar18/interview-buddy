import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = users?.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Users</h1>
          <p className="text-muted-foreground text-sm">{users?.length || 0} registered users</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="glass-card rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">College</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Interviews</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{u.full_name}</td>
                  <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-sm text-muted-foreground">{u.college || "—"}</td>
                  <td className="p-4 text-sm">{u.credits_balance}</td>
                  <td className="p-4 text-sm">{u.total_interviews}</td>
                  <td className="p-4 text-sm text-muted-foreground">{new Date(u.created_at!).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
