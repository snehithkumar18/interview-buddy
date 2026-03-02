import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const plans = [
  { credits: 10, price: "₹99", popular: false },
  { credits: 30, price: "₹249", popular: true },
  { credits: 100, price: "₹699", popular: false },
];

export default function Credits() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Credits</h1>
        <p className="text-muted-foreground text-sm">Manage your interview credits</p>
      </div>

      {/* Balance */}
      <div className="glass-card rounded-lg p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-3xl font-bold">{profile?.credits_balance ?? 0} <span className="text-lg text-muted-foreground font-normal">credits</span></p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold mb-4">Buy Credits</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {plans.map(({ credits, price, popular }) => (
          <div
            key={credits}
            className={`glass-card rounded-lg p-6 text-center relative ${popular ? "border-primary/40 glow-primary" : ""}`}
          >
            {popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-medium">
                Popular
              </span>
            )}
            <p className="text-3xl font-bold mb-1">{credits}</p>
            <p className="text-sm text-muted-foreground mb-4">credits</p>
            <p className="text-xl font-semibold mb-4">{price}</p>
            <Button
              className={popular ? "w-full bg-primary hover:bg-primary/90" : "w-full"}
              variant={popular ? "default" : "outline"}
              onClick={() => toast.info("Payment integration coming soon!")}
            >
              <Plus className="h-4 w-4 mr-1" />
              Buy Now
            </Button>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
      {!transactions?.length ? (
        <div className="glass-card rounded-lg p-8 text-center text-muted-foreground text-sm">
          No transactions yet
        </div>
      ) : (
        <div className="glass-card rounded-lg divide-y divide-border">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm font-medium">+{t.credits_added} credits</p>
                  <p className="text-xs text-muted-foreground">{t.payment_provider || "System"}</p>
                </div>
              </div>
              <div className="text-right">
                {t.amount_paid && <p className="text-sm font-medium">₹{t.amount_paid}</p>}
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_at!).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
