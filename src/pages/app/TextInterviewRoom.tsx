import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, Loader2, Zap } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
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

const langFlags: Record<string, string> = {
  English: "🇺🇸", Hindi: "🇮🇳", Spanish: "🇪🇸", French: "🇫🇷",
  German: "🇩🇪", Arabic: "🇸🇦", Portuguese: "🇧🇷", Japanese: "🇯🇵",
  Korean: "🇰🇷", "Chinese (Mandarin)": "🇨🇳", Mandarin: "🇨🇳",
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-interview-chat`;

const TextInterviewRoom = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const interviewId = searchParams.get("id");

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startTime] = useState(() => Date.now());

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);

  // Fetch interview
  useEffect(() => {
    if (!interviewId || !user) return;
    (async () => {
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
      if (data.status === "completed") {
        navigate(`/app/reports`);
        return;
      }
      setInterview(data as InterviewData);
      // Update status to in_progress
      await supabase.from("interviews").update({ status: "in_progress" }).eq("id", interviewId);
    })();
  }, [interviewId, user, navigate]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Send opening message on load
  useEffect(() => {
    if (interview && messages.length === 0 && !isThinking) {
      sendToAI([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview]);

  const sendToAI = useCallback(async (history: { role: "user" | "assistant"; content: string }[]) => {
    if (!interview || !user) return;
    setIsThinking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          messages: history,
          interview_id: interview.id,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      // Stream response
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add placeholder assistant message
      const assistantMsg: ChatMessage = { role: "assistant", content: "", timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantContent };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) assistantContent += delta;
          } catch {}
        }
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantContent };
          return copy;
        });
      }

      historyRef.current = [...history, { role: "assistant", content: assistantContent }];

      // Check for scores
      if (assistantContent.includes("<<<SCORES>>>")) {
        await handleScoresDetected(assistantContent);
      }
    } catch (err: any) {
      console.error("AI error:", err);
      toast.error(err.message || "Failed to get response from Alex");
      // Remove empty assistant message on error
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsThinking(false);
    }
  }, [interview, user]);

  const handleScoresDetected = async (content: string) => {
    if (!interviewId || !user) return;
    try {
      const marker = "<<<SCORES>>>";
      const idx = content.indexOf(marker);
      const jsonPart = content.slice(idx + marker.length).trim();
      const scores = JSON.parse(jsonPart);
      const durationMinutes = Math.max(1, Math.ceil((Date.now() - startTime) / 60000));

      // Build transcript
      const transcript = historyRef.current.map(m => ({
        role: m.role === "assistant" ? "agent" : "user",
        content: m.content.replace(/<<<SCORES>>>[\s\S]*$/, "").trim(),
      }));

      await supabase.from("interviews").update({
        status: "completed",
        score_communication: scores.communication,
        score_technical: scores.technical,
        score_behavioral: scores.behavioral,
        score_problem_solving: scores.problem_solving,
        score_total: scores.total,
        strengths: scores.strengths,
        improvements: scores.improvements,
        ai_summary: scores.summary,
        transcript,
        duration_minutes: durationMinutes,
        credits_used: 1,
      }).eq("id", interviewId);

      // Deduct 1 credit
      if (profile) {
        await supabase.from("profiles").update({
          credits_balance: Math.max(0, profile.credits_balance - 1),
          total_interviews: profile.total_interviews + 1,
        }).eq("user_id", user.id);
      }

      toast.success("Interview completed! Redirecting to report...");
      setTimeout(() => navigate(`/app/reports`), 2000);
    } catch (err) {
      console.error("Score parsing error:", err);
      toast.error("Interview ended but couldn't parse scores");
    }
  };

  const handleSend = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const newHistory = [...historyRef.current, { role: "user" as const, content: input.trim() }];
    historyRef.current = newHistory;
    setInput("");
    sendToAI(newHistory);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndEarly = async () => {
    if (!interviewId || !user) return;
    setIsEnding(true);
    setShowEndDialog(false);

    // Send end signal to get partial scores
    const endHistory = [...historyRef.current, { role: "user" as const, content: "<<<END>>>" }];
    await sendToAI(endHistory);
    setIsEnding(false);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (!interview) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* TOP BAR */}
      <div className="h-[60px] flex items-center justify-between px-6 border-b border-border backdrop-blur-md bg-background/80 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-foreground font-medium text-sm">
            {interview.company_name} · {interview.role}
          </span>
          {interview.interview_language && (
            <Badge variant="secondary" className="text-xs">
              {langFlags[interview.interview_language] || ""} {interview.interview_language}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">1 credit for this session</span>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowEndDialog(true)}
            disabled={isEnding}
          >
            <Square className="w-3.5 h-3.5 mr-1.5" />
            End Interview
          </Button>
        </div>
      </div>

      {/* CHAT AREA */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <span className="text-[11px] text-muted-foreground mb-1.5 px-1">
                {msg.role === "assistant" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">A</span>
                    Alex
                  </span>
                ) : "You"}
              </span>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "assistant"
                    ? "bg-gradient-to-br from-[hsl(263_70%_20%)] to-[hsl(263_60%_30%)] text-foreground rounded-tl-md"
                    : "bg-muted border border-border text-foreground rounded-tr-md"
                }`}
              >
                {msg.content.replace(/<<<SCORES>>>[\s\S]*$/, "").trim() || (
                  <span className="text-muted-foreground italic">...</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))}

          {/* Typing indicator */}
          {isThinking && messages.length > 0 && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex flex-col items-start">
              <span className="text-[11px] text-muted-foreground mb-1.5 px-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">A</span>
                Alex
              </span>
              <div className="bg-gradient-to-br from-[hsl(263_70%_20%)] to-[hsl(263_60%_30%)] px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">Alex is thinking...</span>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* INPUT AREA */}
      <div className="border-t border-border backdrop-blur-md bg-background/80 px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              placeholder={isThinking ? "Alex is thinking..." : "Type your answer here... (Press Enter to send, Shift+Enter for new line)"}
              disabled={isThinking}
              className={`min-h-[44px] max-h-[160px] resize-none pr-12 text-sm ${
                isThinking ? "bg-muted/50 cursor-not-allowed" : "bg-card"
              }`}
              rows={1}
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              {input.length}/2000
            </span>
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="rounded-full w-11 h-11 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* END DIALOG */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">End this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              Alex will generate partial scores based on your conversation so far.
              You'll receive a report shortly after.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Keep Going</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndEarly}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              End & Get Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TextInterviewRoom;
