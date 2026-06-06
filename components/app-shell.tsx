"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Droplets, Home, Moon, Plus, Scale, Search, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/app/dashboard", label: "Today", icon: Home },
  { href: "/app/foods", label: "Food", icon: Search },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/weight", label: "Weight", icon: Scale },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-card/80 backdrop-blur xl:block">
        <div className="flex h-full flex-col p-4">
          <Link href="/app/dashboard" className="flex items-center gap-3 rounded-lg px-2 py-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-bold">FuelTrack</span>
              <span className="block text-xs text-muted-foreground">Nutrition OS</span>
            </span>
          </Link>
          <nav className="mt-6 grid gap-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground")}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
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
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur xl:ml-64">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">FuelTrack</p>
            <h1 className="text-lg font-bold">Nutrition OS</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" aria-label="Quick add food"><Plus className="size-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Toggle theme" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </header>
      <main className="pb-24 xl:ml-64">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur xl:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-medium text-muted-foreground", active && "text-primary")}>
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
