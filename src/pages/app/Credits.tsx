import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Zap, Mic, MessageSquare, FileText, CreditCard, ArrowUpRight, ArrowDownRight, Gift, Crown, Rocket, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const packages = [
  {
    id: "starter",
    name: "Starter",
    icon: "⚡",
    credits: 30,
    inr: 199,
    usd: 3,
    label: "Try it out",
    features: ["30 min voice OR 30 text interviews", "Full reports"],
    popular: false,
    variant: "outline" as const,
  },
  {
    id: "standard",
    name: "Standard",
    icon: "🚀",
    credits: 100,
    inr: 499,
    usd: 7,
    label: "Best value",
    features: ["100 min voice OR 100 text interviews", "Full reports", "Priority AI scoring"],
    popular: true,
    variant: "default" as const,
  },
  {
    id: "pro",
    name: "Pro",
    icon: "👑",
    credits: 300,
    inr: 1199,
    usd: 17,
    label: "Serious practice",
    features: ["Everything in Standard", "Interview history export", "Detailed analytics"],
    popular: false,
    variant: "outline" as const,
  },
];

export default function Credits() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [isINR, setIsINR] = useState(true);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (profile) {
      setIsINR(profile.country === "India" || profile.country_code === "IN");
    }
  }, [profile]);

  const { data: transactions } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleBuy = (pkg: typeof packages[0]) => {
    toast.info("Payment integration coming soon!");
  };

  const formatPrice = (pkg: typeof packages[0]) =>
    isINR ? `₹${pkg.inr.toLocaleString("en-IN")}` : `$${pkg.usd}`;

  const getTransactionIcon = (type: string) => {
    if (type === "signup_bonus") return <Gift className="h-4 w-4 text-primary" />;
    if (type === "purchase") return <ArrowUpRight className="h-4 w-4 text-success" />;
    return <ArrowDownRight className="h-4 w-4 text-destructive" />;
  };

  const getTransactionColor = (type: string) => {
    if (type === "signup_bonus") return "text-primary";
    if (type === "purchase") return "text-success";
    return "text-destructive";
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Balance Card */}
      <div className="rounded-xl bg-gradient-to-br from-primary/30 via-primary/10 to-background border border-primary/20 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="text-3xl md:text-4xl font-bold">
                {profile?.credits_balance ?? 0}
              </span>
              <span className="text-lg text-muted-foreground font-medium">Credits Available</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Credits power your AI interviews</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs bg-muted border-border">
                Never expires
              </Badge>
              <Badge variant="secondary" className="text-xs bg-muted border-border">
                30 free on signup
              </Badge>
            </div>
          </div>
          {/* Currency Toggle */}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
            <span className={`text-sm font-medium ${isINR ? "text-foreground" : "text-muted-foreground"}`}>₹ INR 🇮🇳</span>
            <Switch checked={!isINR} onCheckedChange={(v) => setIsINR(!v)} />
            <span className={`text-sm font-medium ${!isINR ? "text-foreground" : "text-muted-foreground"}`}>$ USD 🌍</span>
          </div>
        </div>
      </div>

      {/* How Credits Work */}
      <div>
        <h2 className="text-lg font-semibold mb-4">How Credits Work</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Mic className="h-5 w-5 text-primary" />, title: "Voice Interview", desc: "1 credit = 1 minute" },
            { icon: <MessageSquare className="h-5 w-5 text-secondary" />, title: "Text Interview", desc: "1 credit flat per session" },
            { icon: <FileText className="h-5 w-5 text-success" />, title: "Reports & Dashboard", desc: "Always free" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                pkg.popular
                  ? "border-primary/40 bg-primary/5 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]"
                  : pkg.id === "pro"
                  ? "border-warning/30 bg-card"
                  : "border-border bg-card"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                  ⭐ Most Popular
                </span>
              )}
              <div className="text-center mb-4">
                <span className="text-3xl">{pkg.icon}</span>
                <h3 className="text-lg font-bold mt-2">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground">{pkg.label}</p>
              </div>
              <div className="text-center mb-4">
                <span className="text-3xl font-bold">{formatPrice(pkg)}</span>
                <p className="text-sm text-muted-foreground mt-1">{pkg.credits} credits</p>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  pkg.popular
                    ? "bg-primary hover:bg-primary/90"
                    : pkg.id === "pro"
                    ? "border-warning/40 text-warning hover:bg-warning/10"
                    : ""
                }`}
                variant={pkg.variant}
                onClick={() => handleBuy(pkg)}
              >
                Get {pkg.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Payment info */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Secure payments powered by Dodo Payments.
          </p>
          <p className="text-xs text-muted-foreground">
            Accepts UPI, credit/debit cards, Apple Pay, Google Pay, and 100+ payment methods worldwide.
          </p>
          <p className="text-xs text-muted-foreground">All prices include applicable taxes.</p>
          <div className="flex items-center justify-center gap-3 mt-3 text-muted-foreground text-[10px] font-medium tracking-wider">
            {["UPI", "Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"].map((m) => (
              <span key={m} className="px-2 py-1 rounded border border-border bg-muted">{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors"
        >
          Credit History
          {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showHistory && (
          <>
            {!transactions?.length ? (
              <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
                No transactions yet
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => {
                      const isPositive = t.type === "purchase" || t.type === "signup_bonus";
                      return (
                        <TableRow key={t.id} className="border-border">
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(t.created_at!).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(t.type)}
                              <span className="text-sm font-medium">
                                {t.package_name || t.type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-right text-sm font-semibold ${getTransactionColor(t.type)}`}>
                            {isPositive ? "+" : "-"}{t.credits_added}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {t.amount_paid ? `${t.currency === "INR" ? "₹" : "$"}${t.amount_paid}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
