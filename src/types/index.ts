import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Interview = Tables<"interviews">;
export type CreditTransaction = Tables<"credit_transactions">;

export interface InterviewSetup {
  role: string;
  company_name: string;
  experience_level: string;
  job_description?: string;
}

export interface ScoreBreakdown {
  communication: number;
  technical: number;
  behavioral: number;
  problem_solving: number;
  total: number;
}
