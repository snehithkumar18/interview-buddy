import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  LayoutDashboard,
  Mic,
  FileText,
  CreditCard,
  User,
  LogOut,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/interview/setup", icon: Mic, label: "Start Interview" },
  { to: "/app/reports", icon: FileText, label: "My Reports" },
  { to: "/app/credits", icon: CreditCard, label: "Credits" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

const FLAG_MAP: Record<string, string> = {
  India: "🇮🇳", USA: "🇺🇸", "United States": "🇺🇸", "United Kingdom": "🇬🇧", UK: "🇬🇧",
  Canada: "🇨🇦", Australia: "🇦🇺", Germany: "🇩🇪", Singapore: "🇸🇬", France: "🇫🇷",
  Japan: "🇯🇵", "South Korea": "🇰🇷", China: "🇨🇳", Brazil: "🇧🇷", Mexico: "🇲🇽",
  Spain: "🇪🇸", Italy: "🇮🇹", Netherlands: "🇳🇱", Sweden: "🇸🇪", UAE: "🇦🇪",
  "United Arab Emirates": "🇦🇪", Indonesia: "🇮🇩", Malaysia: "🇲🇾", Nigeria: "🇳🇬",
  Kenya: "🇰🇪", "South Africa": "🇿🇦", Pakistan: "🇵🇰", Bangladesh: "🇧🇩",
  Philippines: "🇵🇭", Thailand: "🇹🇭", Vietnam: "🇻🇳", Egypt: "🇪🇬",
};

function getFlag(country?: string | null) {
  if (!country) return "🌍";
  return FLAG_MAP[country] || "🌍";
}

export default function StudentLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const credits = profile?.credits_balance ?? 0;
  const creditColor = credits < 5 ? "text-destructive" : credits < 15 ? "text-warning" : "text-warning";
  const creditBg = credits < 5 ? "bg-destructive/10" : credits < 15 ? "bg-warning/10" : "bg-warning/10";

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link to="/app/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="text-lg font-bold gradient-text">InterviewAI</span>
        </Link>
      </div>

      {/* User card */}
      <div className="p-4 mx-3 mt-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{profile?.full_name || "User"}</p>
              <span className="text-sm">{getFlag(profile?.country)}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 mt-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to === "/app/dashboard" && pathname === "/app");
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border space-y-3">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${creditBg}`}>
          <Zap className={`h-4 w-4 ${creditColor}`} />
          <span className={`text-sm font-semibold ${creditColor}`}>{credits} credits</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-border" style={{ background: "hsl(240 20% 4%)" }}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] flex flex-col border-r border-border animate-slide-in-right" style={{ background: "hsl(240 20% 4%)" }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border">
          <button onClick={() => setMobileOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-bold gradient-text">InterviewAI</span>
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
