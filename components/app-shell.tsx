"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, BarChart3, Droplets, Flame, Home, Moon, Scale, Search, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/components/tabs/dashboard-tab";
import { FoodsTab }     from "@/components/tabs/foods-tab";
import { AnalyticsTab } from "@/components/tabs/analytics-tab";
import { WeightTab }    from "@/components/tabs/weight-tab";
import { SettingsTab }  from "@/components/tabs/settings-tab";

const TABS = [
  { path: "/app/dashboard", label: "Today",     icon: Home      },
  { path: "/app/foods",     label: "Food",       icon: Search    },
  { path: "/app/analytics", label: "Analytics",  icon: BarChart3 },
  { path: "/app/weight",    label: "Weight",     icon: Scale     },
  { path: "/app/settings",  label: "Settings",   icon: Settings  },
] as const;

type TabPath = typeof TABS[number]["path"];
const TAB_PATHS = new Set(TABS.map((t) => t.path));

// Navigate without going through the Next.js router — just updates the URL
// and flips the CSS visibility. Zero network round-trips, zero React remounts.
// Next.js 15 intercepts native pushState and updates usePathname, which the
// shell's pathname effect syncs to activeTab. (Do NOT dispatch a synthetic
// popstate here — Next's router treats a stateless popstate as an external
// navigation and can hard-reload the page.)
function pushTab(path: string) {
  history.pushState(null, "", path);
}

function NavItem({
  tab, active, variant, onNavigate,
}: {
  tab: typeof TABS[number];
  active: boolean;
  variant: "sidebar" | "tabbar";
  onNavigate: () => void;
}) {
  const Icon = tab.icon;
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate();
  };

  if (variant === "tabbar") {
    return (
      <a
        href={tab.path}
        onClick={handleClick}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium text-muted-foreground",
          active && "text-primary",
        )}
      >
        <Icon className="size-5" />
        {tab.label}
      </a>
    );
  }
  return (
    <a
      href={tab.path}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Icon className="size-4" />
      {tab.label}
    </a>
  );
}

export function AppShell({
  children,
  displayName,
  streak,
}: {
  children: React.ReactNode;
  displayName: string;
  streak: number;
}) {
  const pathname = usePathname(); // used only as the initial active tab value
  const router   = useRouter();
  const { theme, setTheme } = useTheme();

  // activeTab drives CSS show/hide — updated via pushState, not Next.js router
  const [activeTab, setActiveTab] = useState<string>(pathname);

  // Sync when the browser back/forward buttons fire OR when another part of
  // the app calls router.push/replace (e.g. onboarding redirect).
  useEffect(() => {
    const sync = () => setActiveTab(window.location.pathname);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Keep activeTab in sync with ANY Next.js router navigation — covers
  // <Link href="/app/foods"> on the dashboard, router.push/replace from tab
  // components (e.g. onboarding redirect), and deep links.
  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const isTabRoute = TAB_PATHS.has(activeTab as TabPath);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card/80 backdrop-blur xl:block">
        <div className="flex h-full flex-col p-4">
          <a
            href="/app/dashboard"
            onClick={(e) => { e.preventDefault(); pushTab("/app/dashboard"); }}
            className="flex items-center gap-3 rounded-lg px-2 py-3"
          >
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-bold">FuelTrack</span>
              <span className="block text-xs text-muted-foreground">Nutrition OS</span>
            </span>
          </a>
          <nav className="mt-6 grid gap-1">
            {TABS.map((tab) => (
              <NavItem
                key={tab.path}
                tab={tab}
                active={activeTab === tab.path}
                variant="sidebar"
                onNavigate={() => pushTab(tab.path)}
              />
            ))}
          </nav>
          <div className="mt-auto rounded-lg border border-border bg-background p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Droplets className="size-4 text-sky-500" />
              2.75L logged today
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Quick-add water and foods from any screen.</p>
          </div>
        </div>
      </aside>

      {/* ── Top header ── */}
      <header className="safe-top sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur xl:ml-64">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Nutrition OS</p>
            <h1 className="text-lg font-bold">
              {displayName ? `Welcome to FuelTrack, ${displayName}` : "FuelTrack"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pushTab("/app/foods")}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-accent"
              aria-label="Track food"
            >
              <Flame className="size-4 text-orange-500" />
              <span>{streak}</span>
              <span className="hidden text-muted-foreground sm:inline">day streak</span>
            </button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="xl:ml-64" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6rem)" }}>
        {isTabRoute ? (
          <>
            {/* All 5 tabs always mounted. CSS hides inactive ones.
                No routing, no remounts — switching is a single setState call. */}
            <div className={cn(activeTab !== "/app/dashboard" && "hidden")}><DashboardTab /></div>
            <div className={cn(activeTab !== "/app/foods"     && "hidden")}><FoodsTab /></div>
            <div className={cn(activeTab !== "/app/analytics" && "hidden")}><AnalyticsTab /></div>
            <div className={cn(activeTab !== "/app/weight"    && "hidden")}><WeightTab /></div>
            <div className={cn(activeTab !== "/app/settings"  && "hidden")}><SettingsTab /></div>
          </>
        ) : (
          // Non-tab routes (onboarding, etc.) render normally as children
          children
        )}
      </main>

      {/* ── Mobile tab bar ── */}
      {isTabRoute && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur xl:hidden">
          {TABS.map((tab) => (
            <NavItem
              key={tab.path}
              tab={tab}
              active={activeTab === tab.path}
              variant="tabbar"
              onNavigate={() => pushTab(tab.path)}
            />
          ))}
        </nav>
      )}
    </div>
  );
}
