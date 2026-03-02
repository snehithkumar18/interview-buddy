import { BarChart3 } from "lucide-react";

export default function AdminAnalytics() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-muted-foreground text-sm mb-8">Detailed platform analytics</p>
      <div className="glass-card rounded-lg p-12 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Advanced analytics coming soon</p>
      </div>
    </div>
  );
}
