import { Link } from "react-router-dom";
import { Sparkles, Mic, BarChart3, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Mic,
    title: "AI-Powered Interviews",
    description: "Practice with realistic AI interviewers tailored to your target role and company.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Get scored on communication, technical skills, behavior, and problem-solving.",
  },
  {
    icon: Zap,
    title: "Instant Feedback",
    description: "Receive actionable insights and improvement suggestions after every session.",
  },
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
            <Link to="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
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
            Ace Your Next
            <br />
            <span className="gradient-text">Interview</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Practice with AI interviewers, get real-time feedback, and track your improvement. Built for students who want to land their dream job.
          </p>
          <div className="flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/auth/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 glow-primary px-8">
                Start Practicing Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button size="lg" variant="outline" className="border-border hover:bg-muted">
                Admin Portal
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Communication</span>
                  <span className="font-semibold text-primary">92%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[92%] rounded-full bg-primary" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Technical</span>
                  <span className="font-semibold text-secondary">85%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[85%] rounded-full bg-secondary" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Behavioral</span>
                  <span className="font-semibold text-success">88%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[88%] rounded-full bg-success" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Problem Solving</span>
                  <span className="font-semibold text-warning">79%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[79%] rounded-full bg-warning" />
                </div>
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
