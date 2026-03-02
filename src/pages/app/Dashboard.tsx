import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Mic, TrendingUp, Clock, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: interviews } = useQuery({
    queryKey: ["interviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completedInterviews = interviews?.filter((i) => i.status === "completed") || [];
  const avgScore = completedInterviews.length
    ? Math.round(completedInterviews.reduce((sum, i) => sum + (i.score_total || 0), 0) / completedInterviews.length)
    : 0;

  const chartData = completedInterviews.slice(0, 7).reverse().map((i, idx) => ({
    name: `#${idx + 1}`,
    score: i.score_total || 0,
  }));

  const stats = [
    { icon: Mic, label: "Total Interviews", value: profile?.total_interviews ?? 0, color: "text-primary" },
    { icon: TrendingUp, label: "Average Score", value: `${avgScore}%`, color: "text-success" },
    { icon: Clock, label: "Practice Time", value: `${completedInterviews.reduce((s, i) => s + (i.duration_minutes || 0), 0)}m`, color: "text-secondary" },
    { icon: CreditCard, label: "Credits Left", value: profile?.credits_balance ?? 0, color: "text-warning" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-muted-foreground text-sm">Here's your interview progress</p>
      </div>

      {/* Stats */}
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
        {/* Chart */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Score Trend</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 40%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 40%)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0 0% 7%)",
                    border: "1px solid hsl(0 0% 12%)",
                    borderRadius: 8,
                    color: "hsl(0 0% 95%)",
                  }}
                />
                <Bar dataKey="score" fill="hsl(263 70% 58%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Complete interviews to see your progress
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/app/new-interview">
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <Mic className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Start New Interview</p>
                    <p className="text-xs text-muted-foreground">Practice with AI interviewer</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
            <Link to="/app/history">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-pointer group mt-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium text-sm">View Past Interviews</p>
                    <p className="text-xs text-muted-foreground">Review feedback & scores</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent */}
      {completedInterviews.length > 0 && (
        <div className="mt-6 glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Interviews</h2>
          <div className="space-y-3">
            {completedInterviews.slice(0, 5).map((interview) => (
              <div key={interview.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{interview.role} at {interview.company_name}</p>
                  <p className="text-xs text-muted-foreground">{interview.experience_level} • {interview.duration_minutes}min</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{interview.score_total}%</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(interview.created_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
