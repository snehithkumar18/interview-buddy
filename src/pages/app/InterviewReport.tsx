import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Briefcase, Globe, CalendarDays, Clock, Zap,
  MessageSquare, Code, Users, Lightbulb, CheckCircle2, TrendingUp,
  FileText, RotateCcw, Home, Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import type { Interview } from "@/types";

const SKILL_CONFIG = [
  { key: "score_communication", label: "Communication", max: 25, icon: MessageSquare, desc: "Clarity, structure, and articulation of ideas" },
  { key: "score_technical", label: "Technical", max: 35, icon: Code, desc: "Domain knowledge and technical accuracy" },
  { key: "score_behavioral", label: "Behavioral", max: 20, icon: Users, desc: "STAR method, self-awareness, and teamwork" },
  { key: "score_problem_solving", label: "Problem Solving", max: 20, icon: Lightbulb, desc: "Analytical thinking and creative solutions" },
] as const;

function getScoreColor(score: number) {
  if (score > 75) return { color: "hsl(160 84% 39%)", label: "🌟 Outstanding!" };
  if (score > 55) return { color: "hsl(38 92% 50%)", label: score > 70 ? "✅ Great Job!" : "👍 Good Effort!" };
  return { color: "hsl(0 84% 60%)", label: "📈 Keep Practicing!" };
}

function AnimatedRing({ score, delay = 0 }: { score: number; delay?: number }) {
  const [progress, setProgress] = useState(0);
  const { color, label } = getScoreColor(score);
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0;
      const step = () => {
        start += 1.5;
        if (start > score) { setProgress(score); return; }
        setProgress(start);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-[180px] h-[180px]" style={{ filter: `drop-shadow(0 0 24px ${color}40)` }}>
        <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
          <circle
            cx="90" cy="90" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-bold text-foreground">{Math.round(progress)}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-lg font-semibold">{label}</span>
    </div>
  );
}

function SkillBar({ score, max, delay }: { score: number; max: number; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((score / max) * 100), delay);
    return () => clearTimeout(t);
  }, [score, max, delay]);
  const { color } = getScoreColor((score / max) * 100);

  return (
    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function InterviewReport() {
  const [searchParams] = useSearchParams();
  const interviewId = searchParams.get("id");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    if (!user || !interviewId) return;
    (async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error || !data) { navigate("/app/dashboard"); return; }
      setInterview(data);
      setLoading(false);
    })();
  }, [user, interviewId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const strengths = (interview.strengths as string[] | null) ?? [];
  const improvements = (interview.improvements as string[] | null) ?? [];
  const transcript = (interview.transcript as Array<{ role: string; content: string }> | null) ?? [];

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* SECTION 1 — HERO */}
        <Card className="overflow-hidden border-0" style={{ background: "linear-gradient(135deg, hsl(263 70% 18%), hsl(263 70% 8%))" }}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h1 className="text-3xl font-bold text-foreground">{interview.company_name}</h1>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start">
                  <Briefcase className="w-4 h-4" />
                  <span>{interview.role}</span>
                  <Badge variant="secondary" className="text-xs">{interview.experience_level}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                  <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{interview.interview_language ?? "English"}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{format(new Date(interview.created_at!), "MMM d, yyyy")}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{interview.duration_minutes ?? 0} min</span>
                  <span className="flex items-center gap-1"><Zap className="w-4 h-4" />{interview.credits_used ?? 0} credits</span>
                </div>
              </div>
              <AnimatedRing score={interview.score_total ?? 0} />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 — SKILL BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SKILL_CONFIG.map((skill, i) => {
            const score = (interview as any)[skill.key] as number | null ?? 0;
            const Icon = skill.icon;
            return (
              <Card key={skill.key} className="glass-card">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{skill.label}</p>
                      <p className="text-xs text-muted-foreground">out of {skill.max}</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{score}</p>
                  <SkillBar score={score} max={skill.max} delay={1000 + i * 200} />
                  <p className="text-xs text-muted-foreground">{skill.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* SECTION 3 — STRENGTHS & IMPROVEMENTS */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strengths.length > 0 && (
              <Card className="glass-card">
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Your Strengths ✅</h2>
                  <ul className="space-y-2">
                    {strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {improvements.length > 0 && (
              <Card className="glass-card">
                <CardContent className="p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Areas to Improve 📈</h2>
                  <ul className="space-y-2">
                    {improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* SECTION 4 — AI REVIEW */}
        {interview.ai_summary && (
          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-6 space-y-2">
              <Badge variant="secondary" className="text-xs">Interview Review</Badge>
              <p className="text-sm text-muted-foreground leading-relaxed">{interview.ai_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* SECTION 5 — TRANSCRIPT */}
        {transcript.length > 0 && (
          <Collapsible open={transcriptOpen} onOpenChange={setTranscriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 print:hidden">
                <FileText className="w-4 h-4" />
                {transcriptOpen ? "Close Transcript" : "📄 View Full Transcript"}
                {transcriptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 print:block">
              <Card className="glass-card">
                <CardContent className="p-6 space-y-3 max-h-[600px] overflow-y-auto print:max-h-none">
                  {transcript.map((msg, i) => {
                    const isAI = msg.role === "agent" || msg.role === "assistant";
                    return (
                      <div key={i} className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          isAI
                            ? "bg-[hsl(263_50%_20%)] text-foreground"
                            : "bg-[hsl(240_20%_12%)] border border-border text-foreground"
                        }`}>
                          <p className="text-xs font-medium text-muted-foreground mb-1">{isAI ? "Alex" : "You"}</p>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* SECTION 6 — ACTIONS */}
        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Download className="w-4 h-4" /> Download PDF Report
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/app/interview/setup?role=${encodeURIComponent(interview.role)}&company=${encodeURIComponent(interview.company_name)}`)}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Practice This Role Again
          </Button>
          <Button onClick={() => navigate("/app/dashboard")} className="gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
