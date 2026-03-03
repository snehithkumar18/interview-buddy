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
import { Mic, MessageSquareText, Loader2, ArrowLeft, ArrowRight, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const EXPERIENCE_LEVELS = ["Fresher", "1–3 yrs", "3–5 yrs", "5–10 yrs", "10+ yrs"];

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Marketing", "Consulting", "Education", "Other",
];

const LANGUAGES = [
  { flag: "🇺🇸", label: "English", value: "English" },
  { flag: "🇮🇳", label: "Hindi", value: "Hindi" },
  { flag: "🇪🇸", label: "Spanish", value: "Spanish" },
  { flag: "🇫🇷", label: "French", value: "French" },
  { flag: "🇩🇪", label: "German", value: "German" },
  { flag: "🇸🇦", label: "Arabic", value: "Arabic" },
  { flag: "🇧🇷", label: "Portuguese", value: "Portuguese" },
  { flag: "🇯🇵", label: "Japanese", value: "Japanese" },
  { flag: "🇰🇷", label: "Korean", value: "Korean" },
  { flag: "🇨🇳", label: "Mandarin", value: "Chinese (Mandarin)" },
];

const JD_MAX_CHARS = 3000;

export default function NewInterview() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const credits = profile?.credits_balance ?? 0;

  const [role, setRole] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [language, setLanguage] = useState(profile?.preferred_language ?? "English");
  const [jobDescription, setJobDescription] = useState("");
  const [mode, setMode] = useState<"voice" | "text" | "">("");

  const canSubmit =
    role.trim() !== "" &&
    companyName.trim() !== "" &&
    experienceLevel !== "" &&
    mode !== "" &&
    !loading &&
    (mode === "voice" ? credits >= 5 : credits >= 1);

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          role: role.trim(),
          company_name: companyName.trim(),
          experience_level: experienceLevel,
          job_description: jobDescription.trim() || null,
          interview_language: language,
          mode,
          status: "setup",
        })
        .select("id")
        .single();

      if (error) throw error;

      const dest = mode === "voice"
        ? `/app/interview/room?id=${data.id}`
        : `/app/interview/text?id=${data.id}`;
      navigate(dest);
    } catch (err: any) {
      toast.error(err.message || "Failed to create interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[700px] mx-auto space-y-6">
      {/* Low credits banner */}
      {credits < 10 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
          <Zap className="h-4 w-4 text-warning shrink-0" />
          <span className="text-warning">
            Low credits! You have only <strong>{credits}</strong> credits left.
          </span>
          <Link to="/app/credits" className="ml-auto text-warning underline underline-offset-2 whitespace-nowrap font-medium">
            Buy more →
          </Link>
        </div>
      )}

      {/* Main Card */}
      <div className="glass-card rounded-lg p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Set Up Your Mock Interview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            The more detail you give, the more realistic your interview
          </p>
        </div>

        {/* Section 1 — Role & Company */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Role &amp; Company</h2>
          <div className="space-y-2">
            <Label htmlFor="role">Job Role</Label>
            <Input
              id="role"
              placeholder="e.g. Software Engineer, Product Manager, UX Designer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-background border-border text-base"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g. Google, Infosys, any startup"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Section 2 — Experience */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Experience</h2>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setExperienceLevel(lvl)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  experienceLevel === lvl
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </section>

        {/* Section 3 — Language */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Language</h2>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="bg-background border-border w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.flag} {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Section 4 — Job Description */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Job Description <span className="text-muted-foreground/60 normal-case font-normal">(Optional but Recommended)</span>
          </h2>
          <div className="relative">
            <Textarea
              placeholder={`Paste the job description here. Alex (your AI interviewer) will use it to ask targeted, company-specific questions.\n\nThis makes your practice much more realistic.`}
              value={jobDescription}
              onChange={(e) => {
                if (e.target.value.length <= JD_MAX_CHARS) setJobDescription(e.target.value);
              }}
              rows={6}
              className="bg-background border-border min-h-[140px]"
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {jobDescription.length}/{JD_MAX_CHARS}
            </span>
          </div>
        </section>

        {/* Section 5 — Interview Mode */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interview Mode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModeCard
              selected={mode === "voice"}
              onClick={() => setMode("voice")}
              icon={<Mic className="h-6 w-6" />}
              title="Voice Interview"
              description="Talk with your AI interviewer in real-time. Most realistic experience."
              cost="Uses 1 credit per minute"
            />
            <ModeCard
              selected={mode === "text"}
              onClick={() => setMode("text")}
              icon={<MessageSquareText className="h-6 w-6" />}
              title="Text Interview"
              description="Type your answers at your own pace. Great for quiet environments."
              cost="Flat 1 credit per session"
            />
          </div>
        </section>

        {/* Info box */}
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your AI interviewer <strong className="text-foreground">Alex</strong> will conduct a structured 15–20 minute session:
            Intro → Background → Technical → Behavioral → Situational → Wrap-up
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Start Interview <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({
  selected,
  onClick,
  icon,
  title,
  description,
  cost,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  cost: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-5 transition-all space-y-2 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/30"
      }`}
    >
      <div className={`${selected ? "text-primary" : "text-muted-foreground"}`}>{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      <p className="text-xs text-muted-foreground/70">{cost}</p>
    </button>
  );
}
