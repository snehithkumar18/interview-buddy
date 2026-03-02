import { Link } from "react-router-dom";
import { Sparkles, Mic, BarChart3, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Mic, title: "AI-Powered Interviews", description: "Practice with realistic AI interviewers tailored to your target role and company." },
  { icon: BarChart3, title: "Detailed Analytics", description: "Get scored on communication, technical skills, behavior, and problem-solving." },
  { icon: Zap, title: "Instant Feedback", description: "Receive actionable insights and improvement suggestions after every session." },
];

const benefits = [
  "Unlimited practice for any role or company",
  "AI scoring across 4 key dimensions",
  "Personalized improvement recommendations",
  "Track your progress over time",
  "Resume-based interview questions",
  "Industry-specific question banks",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">InterviewAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="glow-primary" style={{ background: "var(--gradient-primary)" }}>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="relative container mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-8 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Interview Practice
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Practice AI Interviews.
            <br />
            <span className="gradient-text">Get Hired Faster.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Practice with AI interviewers, get real-time feedback, and track your improvement. Built for students who want to land their dream job.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button size="lg" className="glow-primary px-8" style={{ background: "var(--gradient-primary)" }}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-border hover:bg-muted">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need to prepare</h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
          Our platform combines AI technology with proven interview techniques to help you succeed.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="glass-card rounded-lg p-8 hover:border-primary/30 transition-colors group">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-border">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why students love InterviewAI</h2>
              <div className="space-y-4">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    <span className="text-muted-foreground">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-lg p-8">
              <div className="space-y-4">
                {[
                  { label: "Communication", pct: 92, color: "bg-primary" },
                  { label: "Technical", pct: 85, color: "bg-secondary" },
                  { label: "Behavioral", pct: 88, color: "bg-success" },
                  { label: "Problem Solving", pct: 79, color: "bg-warning" },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>InterviewAI</span>
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
