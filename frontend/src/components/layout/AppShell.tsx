import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Network, Boxes, LineChart, Sparkles, Route as RouteIcon,
  Globe, Settings as SettingsIcon, Bell, Search, ChevronsLeft, ChevronsRight,
  FileCheck2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { cn } from "@/lib/utils";
import { AssistantLauncher } from "./AssistantLauncher";
import { useCurrentUser } from "@/lib/queries";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/graph", label: "Skill Graph", icon: Network },
  { to: "/projects", label: "Projects", icon: Boxes },
  { to: "/timeline", label: "Timeline", icon: LineChart },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/resume-audit", label: "Resume Audit", icon: FileCheck2 },
  { to: "/roadmap", label: "Roadmap", icon: RouteIcon },
  { to: "/portfolio", label: "Portfolio", icon: Globe },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("ps-theme");
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("ps-theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { dark, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col">
      <DemoModeBanner />
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-line bg-surface/95 backdrop-blur flex items-center px-4 gap-4">
        <Link to="/dashboard" className="flex items-center">
          <Wordmark className="text-[15px]" />
        </Link>
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-2 w-full h-9 border border-line rounded-md px-3 bg-background focus-within:border-signal">
            <Search className="h-4 w-4 text-ink-muted" />
            <input
              className="w-full bg-transparent outline-none font-mono text-[12.5px] placeholder:text-ink-muted"
              placeholder="Search skills, projects, technologies"
            />
            <span className="font-mono text-[10.5px] text-ink-muted border border-line rounded px-1 py-0.5">⌘K</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="font-mono text-[11px] px-2 py-1 border border-line rounded hover:border-signal transition-colors"
          >
            [ {dark ? "light" : "dark"} ]
          </button>
          <button className="h-8 w-8 grid place-items-center border border-line rounded hover:border-signal">
            <Bell className="h-4 w-4" />
          </button>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full border border-line bg-secondary" />
          ) : (
            <div className="h-8 w-8 rounded-full border border-line bg-secondary" />
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (desktop) */}
        <aside
          className={cn(
            "hidden md:flex sticky top-14 self-start h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-line bg-surface transition-[width]",
            collapsed ? "w-14" : "w-56",
          )}
        >
          <nav className="flex-1 py-3">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex items-center gap-3 h-10 px-3 mx-2 rounded text-[13.5px]",
                    active ? "text-signal" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r",
                      active ? "bg-signal" : "bg-transparent",
                    )}
                  />
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-signal")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="mx-2 mb-3 h-9 flex items-center justify-center gap-2 text-ink-muted hover:text-ink font-mono text-[11px] border border-line rounded"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : (<><ChevronsLeft className="h-4 w-4" /> collapse</>)}
          </button>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-surface grid grid-cols-5">
        {nav.slice(0, 5).map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn("flex flex-col items-center justify-center py-2 gap-0.5", active ? "text-signal" : "text-ink-muted")}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px]">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <AssistantLauncher />
    </div>
  );
}
