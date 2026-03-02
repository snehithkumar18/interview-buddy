import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const experienceLevels = ["Fresher", "Junior (0-2 yrs)", "Mid (2-5 yrs)", "Senior (5+ yrs)"];

export default function NewInterview() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    role: "",
    company_name: "",
    experience_level: "",
    job_description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if ((profile?.credits_balance ?? 0) < 1) {
      toast.error("Not enough credits. Please purchase more.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          role: form.role,
          company_name: form.company_name,
          experience_level: form.experience_level,
          job_description: form.job_description || null,
          status: "setup",
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Interview session created! (AI integration coming soon)");
      navigate("/app/history");
    } catch (err: any) {
      toast.error(err.message || "Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Start New Interview</h1>
        <p className="text-muted-foreground text-sm">
          Set up your mock interview session • {profile?.credits_balance ?? 0} credits available
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-lg p-8 space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10 mb-2">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            Our AI interviewer will tailor questions based on the role, company, and experience level you provide.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Input
              id="role"
              placeholder="e.g. Frontend Developer"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g. Google"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              required
              className="bg-background border-border"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Experience Level</Label>
          <Select value={form.experience_level} onValueChange={(v) => setForm({ ...form, experience_level: v })}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevels.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jd">Job Description (optional)</Label>
          <Textarea
            id="jd"
            placeholder="Paste the job description for more targeted questions..."
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            rows={4}
            className="bg-background border-border"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !form.role || !form.company_name || !form.experience_level}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Start Interview (1 credit)
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
