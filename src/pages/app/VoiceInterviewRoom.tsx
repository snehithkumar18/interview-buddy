import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic, MicOff, Square, Maximize, Minimize, X, Zap,
  AlertTriangle, RefreshCw, Loader2, MessageSquare
} from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RetellWebClient } from "retell-client-js-sdk";
import { toast } from "sonner";

type CallStatus = "idle" | "connecting" | "connected" | "speaking_ai" | "speaking_user" | "processing" | "ended" | "error";

interface TranscriptMessage {
  role: "agent" | "user";
  content: string;
  timestamp: Date;
}

interface InterviewData {
  id: string;
  role: string;
  company_name: string;
  experience_level: string;
  job_description: string | null;
  interview_language: string | null;
  mode: string | null;
  status: string | null;
  user_id: string;
}

const AGENT_ID = "agent_placeholder"; // Will be overridden if env is set

const VoiceInterviewRoom = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interviewId = searchParams.get("id");

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [currentCredits, setCurrentCredits] = useState(profile?.credits_balance ?? 0);
  const [isScoring, setIsScoring] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const retellClientRef = useRef<RetellWebClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const creditTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch interview data
  useEffect(() => {
    if (!interviewId || !user) return;
    const fetchInterview = async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("id", interviewId)
        .eq("user_id", user.id)
        .single();
      if (error || !data) {
        toast.error("Interview not found");
        navigate("/app/dashboard");
        return;
      }
      setInterview(data as InterviewData);
    };
    fetchInterview();
  }, [interviewId, user, navigate]);

  useEffect(() => {
    if (profile) setCurrentCredits(profile.credits_balance);
  }, [profile]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (status === "connected" || status === "speaking_ai" || status === "speaking_user" || status === "processing") {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Credit deduction every 60 seconds
  useEffect(() => {
    if (status === "connected" || status === "speaking_ai" || status === "speaking_user" || status === "processing") {
      creditTimerRef.current = setInterval(async () => {
        if (!user || !interviewId) return;
        // Deduct 1 credit
        const { data: p } = await supabase
          .from("profiles")
          .select("credits_balance")
          .eq("user_id", user.id)
          .single();
        if (p) {
          const newBalance = Math.max(0, p.credits_balance - 1);
          await supabase.from("profiles").update({ credits_balance: newBalance }).eq("user_id", user.id);
          setCurrentCredits(newBalance);
          setCreditsUsed((c) => c + 1);
          await supabase.from("interviews").update({
            credits_used: creditsUsed + 1,
            duration_minutes: Math.floor((elapsedSeconds + 60) / 60),
          }).eq("id", interviewId);
          if (newBalance <= 0) {
            toast.error("Credits exhausted — interview ending");
            endInterview();
          } else if (newBalance <= 5) {
            toast.warning(`⚠️ Only ${newBalance} credits left!`);
          }
        }
      }, 60000);
    }
    return () => { if (creditTimerRef.current) clearInterval(creditTimerRef.current); };
  }, [status, user, interviewId]);

  const startCall = useCallback(async () => {
    if (!interview || !user) return;
    setStatus("connecting");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("create-retell-call", {
        body: { interview_id: interview.id, agent_id: AGENT_ID },
      });
      if (error || !data?.access_token) {
        throw new Error(data?.error || error?.message || "Failed to create call");
      }

      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on("call_started", () => setStatus("connected"));
      client.on("call_ended", () => {
        setStatus("ended");
        endInterview();
      });
      client.on("agent_start_talking", () => setStatus("speaking_ai"));
      client.on("agent_stop_talking", () => setStatus("connected"));
      client.on("update", (update: any) => {
        if (update.transcript) {
          const msgs: TranscriptMessage[] = update.transcript.map((t: any) => ({
            role: t.role === "agent" ? "agent" : "user",
            content: t.content,
            timestamp: new Date(),
          }));
          setTranscript(msgs);
        }
      });
      client.on("error", (err: any) => {
        console.error("Retell error:", err);
        setStatus("error");
        setErrorMessage("Connection error. Please retry.");
      });

      await client.startCall({ accessToken: data.access_token });
    } catch (err: any) {
      console.error("Start call error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to connect");
    }
  }, [interview, user]);

  // Auto-start on mount
  useEffect(() => {
    if (interview && status === "idle") {
      startCall();
    }
  }, [interview, status, startCall]);

  const endInterview = async () => {
    if (retellClientRef.current) {
      try { retellClientRef.current.stopCall(); } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (creditTimerRef.current) clearInterval(creditTimerRef.current);

    if (interviewId) {
      setIsScoring(true);
      await supabase.from("interviews").update({
        status: "scoring",
        duration_minutes: Math.ceil(elapsedSeconds / 60),
        credits_used: creditsUsed,
      }).eq("id", interviewId);

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data } = await supabase
          .from("interviews")
          .select("status")
          .eq("id", interviewId)
          .single();
        if (data?.status === "completed" || attempts >= 30) {
          clearInterval(poll);
          navigate(`/app/reports`);
        }
      }, 2000);
    }
  };

  const toggleMute = () => {
    if (retellClientRef.current) {
      if (isMuted) {
        retellClientRef.current.unmute();
      } else {
        retellClientRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const statusText: Record<CallStatus, string> = {
    idle: "Initializing...",
    connecting: "Connecting to Alex...",
    connected: "Interview in progress",
    speaking_ai: "Alex is speaking...",
    speaking_user: "Listening to you...",
    processing: "Processing...",
    ended: "Interview ended",
    error: "Connection error",
  };

  const statusDotColor: Record<CallStatus, string> = {
    idle: "bg-muted-foreground",
    connecting: "bg-warning animate-pulse",
    connected: "bg-success",
    speaking_ai: "bg-primary animate-pulse",
    speaking_user: "bg-secondary animate-pulse",
    processing: "bg-warning animate-pulse",
    ended: "bg-muted-foreground",
    error: "bg-destructive",
  };

  const langFlags: Record<string, string> = {
    English: "🇺🇸", Hindi: "🇮🇳", Spanish: "🇪🇸", French: "🇫🇷",
    German: "🇩🇪", Arabic: "🇸🇦", Portuguese: "🇧🇷", Japanese: "🇯🇵",
    Korean: "🇰🇷", "Chinese (Mandarin)": "🇨🇳", Mandarin: "🇨🇳",
  };

  if (isScoring) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 z-50">
        <div className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <h2 className="text-2xl font-semibold text-foreground">Alex is reviewing your performance...</h2>
        <p className="text-muted-foreground">This usually takes about 30 seconds</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* TOP BAR */}
      <div className="h-[60px] flex items-center justify-between px-6 border-b border-border backdrop-blur-md bg-background/80 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground text-sm">InterviewAI</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-foreground font-medium">
            {interview?.company_name} · {interview?.role}
          </span>
          {interview?.interview_language && (
            <Badge variant="secondary" className="text-xs">
              {langFlags[interview.interview_language] || ""} {interview.interview_language}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{formatTime(elapsedSeconds)}</span>
          <span>⚡ {creditsUsed} used</span>
          <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor[status]}`} />
        </div>
      </div>

      {/* CREDITS WARNING */}
      {currentCredits > 0 && currentCredits <= 5 && (
        <div className="bg-warning/10 border-b border-warning/30 px-6 py-2 text-center text-sm text-warning flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Only {currentCredits} credits left! Interview will end at 0.
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex overflow-hidden">
        {/* CENTER AREA */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 relative">
          {/* Status text */}
          <p className="text-muted-foreground text-sm tracking-wide">{statusText[status]}</p>

          {/* Pulsing circle */}
          <div className="relative w-[220px] h-[220px] flex items-center justify-center">
            {/* Outer rings */}
            {(status === "speaking_ai" || status === "speaking_user") && (
              <>
                <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-20 ${
                  status === "speaking_ai" ? "border-primary" : "border-secondary"
                }`} />
                <div className={`absolute inset-2 rounded-full border-2 animate-ping opacity-15 ${
                  status === "speaking_ai" ? "border-primary" : "border-secondary"
                }`} style={{ animationDelay: "0.3s" }} />
              </>
            )}
            {status === "connecting" && (
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            )}
            <div className={`w-[180px] h-[180px] rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
              status === "speaking_ai"
                ? "border-primary bg-primary/10"
                : status === "speaking_user"
                ? "border-secondary bg-secondary/10"
                : status === "error"
                ? "border-destructive bg-destructive/10"
                : "border-border bg-muted/30"
            }`}>
              {status === "error" ? (
                <AlertTriangle className="w-12 h-12 text-destructive" />
              ) : (
                <Mic className={`w-12 h-12 transition-colors ${
                  status === "speaking_ai" ? "text-primary" : status === "speaking_user" ? "text-secondary" : "text-muted-foreground"
                }`} />
              )}
            </div>
          </div>

          {/* Interviewer card */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              A
            </div>
            <h3 className="text-foreground font-semibold text-lg">Alex</h3>
            <p className="text-muted-foreground text-sm">
              Senior Interviewer · {interview?.company_name}
            </p>
          </div>

          {/* Error retry */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-destructive text-sm">{errorMessage}</p>
              <Button onClick={startCall} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
              </Button>
            </div>
          )}
        </div>

        {/* TRANSCRIPT PANEL */}
        {showTranscript && (
          <div className="w-[380px] border-l border-border bg-card/50 backdrop-blur-sm flex flex-col shrink-0">
            <div className="h-12 flex items-center justify-between px-4 border-b border-border">
              <span className="text-sm font-medium text-foreground">Live Transcript</span>
              <button onClick={() => setShowTranscript(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {transcript.length === 0 && (
                  <p className="text-muted-foreground text-xs text-center mt-8">
                    Transcript will appear here...
                  </p>
                )}
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] text-muted-foreground mb-1">
                      {msg.role === "agent" ? "Alex" : "You"}
                    </span>
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === "agent"
                        ? "bg-primary/20 text-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {(status === "processing" || status === "speaking_ai") && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-muted-foreground">Alex</span>
                    <div className="flex gap-1 px-3 py-3">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div className="h-[72px] flex items-center justify-between px-8 border-t border-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="flex gap-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            onClick={toggleMute}
            className="rounded-full w-12 h-12"
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>
        <Button
          variant="destructive"
          size="lg"
          onClick={() => setShowEndDialog(true)}
          className="rounded-full px-8 h-12 gap-2"
        >
          <Square className="w-4 h-4" /> End Interview
        </Button>
        <div className="flex gap-3">
          {!showTranscript && (
            <Button variant="outline" size="icon" onClick={() => setShowTranscript(true)} className="rounded-full w-12 h-12">
              <MessageSquare className="w-5 h-5" />
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={toggleFullscreen} className="rounded-full w-12 h-12">
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* END DIALOG */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">End this interview?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Your session will be saved and Alex will score your performance.
              You'll receive a full report in about 30 seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Going</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowEndDialog(false); endInterview(); }}
            >
              End & Get Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceInterviewRoom;
