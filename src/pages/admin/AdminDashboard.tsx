import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mic, CreditCard, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(263 70% 58%)", "hsl(187 94% 43%)", "hsl(160 84% 39%)", "hsl(38 92% 50%)"];

export default function AdminDashboard() {
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: interviews } = useQuery({
    queryKey: ["admin-interviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interviews").select("status, score_total, created_at, experience_level");
      if (error) throw error;
      return data;
    },
  });

  const totalInterviews = interviews?.length || 0;
  const completedInterviews = interviews?.filter((i) => i.status === "completed") || [];
  const avgScore = completedInterviews.length
    ? Math.round(completedInterviews.reduce((s, i) => s + (i.score_total || 0), 0) / completedInterviews.length)
    : 0;

  // Status distribution
  const statusCounts = interviews?.reduce((acc, i) => {
    const s = i.status || "setup";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Experience level distribution
  const expCounts = interviews?.reduce((acc, i) => {
    acc[i.experience_level] = (acc[i.experience_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const barData = Object.entries(expCounts).map(([name, value]) => ({ name, count: value }));

  const stats = [
    { icon: Users, label: "Total Users", value: profiles ?? 0, color: "text-primary" },
    { icon: Mic, label: "Total Interviews", value: totalInterviews, color: "text-secondary" },
    { icon: TrendingUp, label: "Avg Score", value: `${avgScore}%`, color: "text-success" },
    { icon: CreditCard, label: "Completed", value: completedInterviews.length, color: "text-warning" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card rounded-lg p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-9 w-9 rounded-md bg-muted flex items-center justify-center ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Interviews by Experience</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 40%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 40%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 12%)",
                    borderRadius: 8,
                    color: "hsl(0 0% 95%)",
                  }}
                />
                <Bar dataKey="count" fill="hsl(187 94% 43%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Interview Status</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 12%)",
                    borderRadius: 8,
                    color: "hsl(0 0% 95%)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            {pieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                <span className="text-muted-foreground capitalize">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
