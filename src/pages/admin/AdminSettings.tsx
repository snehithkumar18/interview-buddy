import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground text-sm mb-8">Platform configuration</p>
      <div className="glass-card rounded-lg p-12 text-center">
        <Settings className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Admin settings coming soon</p>
      </div>
    </div>
  );
}
