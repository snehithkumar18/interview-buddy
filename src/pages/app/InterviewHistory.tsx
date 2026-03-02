import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Briefcase } from "lucide-react";

export default function InterviewHistory() {
  const { user } = useAuth();

  const { data: interviews, isLoading } = useQuery({
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
  });

  const statusColor = (status: string | null) => {
    switch (status) {
      case "completed": return "text-success bg-success/10";
      case "in_progress": return "text-warning bg-warning/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Interview History</h1>
        <p className="text-muted-foreground text-sm">Review your past interview sessions</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : !interviews?.length ? (
        <div className="glass-card rounded-lg p-12 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No interviews yet. Start your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <div key={interview.id} className="glass-card rounded-lg p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{interview.role}</h3>
                  <p className="text-sm text-muted-foreground">{interview.company_name} • {interview.experience_level}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {interview.duration_minutes || 0}min
                    </span>
                    <span>{new Date(interview.created_at!).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(interview.status)}`}>
                    {interview.status}
                  </span>
                  {interview.score_total != null && (
                    <div className="mt-2 flex items-center gap-1 justify-end">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-primary">{interview.score_total}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
