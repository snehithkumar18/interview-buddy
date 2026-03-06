import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { messages, interview_id } = await req.json();
    if (!messages || !interview_id) throw new Error("Missing messages or interview_id");

    // Verify interview belongs to user
    const { data: interview, error: intErr } = await supabase
      .from("interviews")
      .select("*")
      .eq("id", interview_id)
      .eq("user_id", user.id)
      .single();

    if (intErr || !interview) throw new Error("Interview not found");

    // Fetch user profile for name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const userName = profile?.full_name || "Candidate";

    const systemPrompt = `You are Alex, a senior professional interviewer at ${interview.company_name}. You are conducting a job interview for ${userName} applying for ${interview.role}. Experience level: ${interview.experience_level}. Job description context: ${interview.job_description || "Not provided"}. Conduct the interview in: ${interview.interview_language || "English"}.

STRICT INTERVIEW STRUCTURE:
1. Warm welcome + 1 icebreaker question
2. Background + motivation: 2 questions
3. Technical/role-specific: 3 questions (tailor specifically to the role)
4. Behavioral (STAR method): 2 questions starting with "Tell me about a time..."
5. Situational: 1 problem-solving scenario
6. Ask if candidate has any questions
7. Professional closing

ABSOLUTE RULES:
- Ask EXACTLY ONE question per message. Never combine questions.
- Keep acknowledgments to 1 sentence max before next question.
- Be warm, professional, encouraging.
- Do NOT evaluate or give feedback during the interview.
- Conduct fully in ${interview.interview_language || "English"}.
- If the candidate sends "<<<END>>>", immediately stop the interview, give a brief professional closing, and output the scores block below based on whatever conversation happened so far.
- After your closing message (or when receiving <<<END>>>), on a NEW line output ONLY this block:
<<<SCORES>>>
{
  "communication": [0-25],
  "technical": [0-35],
  "behavioral": [0-20],
  "problem_solving": [0-20],
  "total": [0-100],
  "strengths": ["specific point 1", "specific point 2", "specific point 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "summary": "Detailed 3-4 sentence paragraph about overall performance."
}`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("text-interview-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
