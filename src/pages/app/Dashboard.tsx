import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Activity, Trophy, CreditCard, Zap, Mic, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useEffect, useRef, useState } from "react";

// ——— Animated counter ———
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);
  return val;
}

function CountUpCard({ icon: Icon, label, value, suffix, color, loading }: {
  icon: React.ElementType; label: string; value: number; suffix?: string; color: string; loading: boolean;
}) {
  const count = useCountUp(loading ? 0 : value);
  if (loading) return <Skeleton className="h-[120px] rounded-xl" />;
  return (
    <div className="glass-card rounded-xl p-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-3xl font-bold">{count}{suffix}</p>
    </div>
  );
}

// ——— Greeting ———
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getFlag(country?: string | null) {
  const map: Record<string, string> = {
    India: "🇮🇳", USA: "🇺🇸", "United States": "🇺🇸", "United Kingdom": "🇬🇧",
    Canada: "🇨🇦", Australia: "🇦🇺", Germany: "🇩🇪", Singapore: "🇸🇬",
  };
  return country ? map[country] || "🌍" : "🌍";
}

function formatDateForTimezone(tz?: string | null) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: tz || undefined,
    }).format(new Date());
  } catch {
    return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const loading = profileLoading || interviewsLoading;
  const completed = interviews?.filter((i) => i.status === "completed") || [];
  const avgScore = completed.length
    ? Math.round(completed.reduce((s, i) => s + (i.score_total || 0), 0) / completed.length)
    : 0;
  const bestScore = completed.length
    ? Math.max(...completed.map((i) => i.score_total || 0))
    : 0;

  // Line chart data — last 10 completed
  const lineData = completed.slice(0, 10).reverse().map((i) => ({
    date: new Date(i.created_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: i.score_total || 0,
    company: i.company_name,
    role: i.role,
  }));

  // Radar chart — most recent completed interview
  const latest = completed[0];
  const radarData = latest
    ? [
        { skill: "Communication", value: latest.score_communication || 0, max: 25 },
        { skill: "Technical", value: latest.score_technical || 0, max: 35 },
        { skill: "Behavioral", value: latest.score_behavioral || 0, max: 20 },
        { skill: "Problem Solving", value: latest.score_problem_solving || 0, max: 20 },
      ]
    : [];

  const recent = (interviews || []).slice(0, 5);
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  function scoreBadge(score: number | null) {
    if (!score) return <Badge variant="secondary">—</Badge>;
    if (score >= 75) return <Badge className="bg-success/10 text-success border-success/20">{score}/100</Badge>;
    if (score >= 50) return <Badge className="bg-warning/10 text-warning border-warning/20">{score}/100</Badge>;
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{score}/100</Badge>;
  }

  function statusBadge(status: string | null) {
    if (status === "completed") return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
    if (status === "in_progress") return <Badge className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
    return <Badge variant="secondary">Setup</Badge>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-2">
        <div>
          {loading ? <Skeleton className="h-8 w-64 mb-1" /> : (
            <h1 className="text-2xl font-bold animate-fade-in">
              {getGreeting()}, {firstName}! 👋
            </h1>
          )}
          <p className="text-sm text-muted-foreground">Here's your interview progress</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{getFlag(profile?.country)}</span>
          <span>{formatDateForTimezone(profile?.timezone)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <CountUpCard icon={Activity} label="Total Interviews" value={profile?.total_interviews ?? 0} color="bg-primary/10 text-primary" loading={loading} />
        <CountUpCard icon={Activity} label="Avg Score" value={avgScore} suffix="/100" color="bg-success/10 text-success" loading={loading} />
        <CountUpCard icon={CreditCard} label="Credits Left" value={profile?.credits_balance ?? 0} color={`${(profile?.credits_balance ?? 0) < 5 ? "bg-destructive/10 text-destructive" : (profile?.credits_balance ?? 0) < 15 ? "bg-warning/10 text-warning" : "bg-warning/10 text-warning"}`} loading={loading} />
        <CountUpCard icon={Trophy} label="Best Score" value={bestScore} suffix="/100" color="bg-primary/10 text-primary" loading={loading} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Journey */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Performance Journey</h2>
          {loading ? <Skeleton className="h-[250px]" /> : lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263 70% 58%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(263 70% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
                <XAxis dataKey="date" stroke="hsl(0 0% 40%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 40%)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ background: "hsl(0 0% 7%)", border: "1px solid hsl(0 0% 12%)", borderRadius: 12, color: "hsl(0 0% 95%)" }}
                  formatter={(value: number) => [`${value}/100`, "Score"]}
                  labelFormatter={(_: string, payload: any[]) => {
                    if (payload?.[0]?.payload) {
                      const p = payload[0].payload;
                      return `${p.company} — ${p.role}`;
                    }
                    return "";
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="hsl(263 70% 58%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(263 70% 58%)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Mic className="h-10 w-10 opacity-30" />
              <p className="text-sm">Take your first interview to begin tracking</p>
              <Link to="/app/interview/setup">
                <Button size="sm">Start Interview</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Skill Radar */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Skill Radar</h2>
          {loading ? <Skeleton className="h-[250px]" /> : radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(0 0% 15%)" />
                <PolarAngleAxis dataKey="skill" stroke="hsl(0 0% 50%)" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 35]} stroke="hsl(0 0% 20%)" fontSize={10} />
                <Radar name="Score" dataKey="value" stroke="hsl(187 94% 43%)" fill="hsl(263 70% 58%)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Activity className="h-10 w-10 opacity-30" />
              <p className="text-sm">Complete an interview to see your skill breakdown</p>
            </div>
          )}
          {radarData.length > 0 && (
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Score</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-secondary" />Stroke</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Interviews */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
          <Link to="/app/reports" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-border">
                  <th className="text-left py-3 px-2 font-medium">Date</th>
                  <th className="text-left py-3 px-2 font-medium">Company & Role</th>
                  <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Language</th>
                  <th className="text-left py-3 px-2 font-medium">Score</th>
                  <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Duration</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                  <th className="text-right py-3 px-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((i) => (
                  <tr key={i.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                      {new Date(i.created_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-medium">{i.company_name}</p>
                      <p className="text-xs text-muted-foreground">{i.role} • {i.experience_level}</p>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{i.interview_language || "English"}</td>
                    <td className="py-3 px-2">{scoreBadge(i.score_total)}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{i.duration_minutes || 0}m</td>
                    <td className="py-3 px-2">{statusBadge(i.status)}</td>
                    <td className="py-3 px-2 text-right">
                      {i.status === "completed" ? (
                        <Link to={`/app/reports/${i.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary text-xs">View Report</Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Mic className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1">No interviews yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start your first AI interview to see results here</p>
              <Link to="/app/interview/setup">
                <Button className="gap-2">
                  Start Your First <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
