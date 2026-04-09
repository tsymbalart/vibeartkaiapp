import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  BiSolidDashboard,
  BiSolidCheckSquare,
  BiLineChart,
  BiSolidGroup,
  BiSolidCog,
  BiSolidAdjust,
  BiSolidUser,
  BiSolidShield,
  BiSolidSun,
  BiSolidMoon,
  BiSolidMessageRounded,
  BiSolidInbox,
  BiSolidHeart,
  BiMenu,
  BiX,
  BiLogOut,
  BiSolidCrown,
  BiSolidFolder,
  BiSolidGridAlt,
} from "react-icons/bi";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: BiSolidDashboard },
  { href: "/check-in", label: "Pulse Check", icon: BiSolidCheckSquare },
  { href: "/my-journey", label: "My Journey", icon: BiLineChart },
  { href: "/my-feedback", label: "My Feedback", icon: BiSolidInbox },
  { href: "/kudos", label: "Pulse Kudos", icon: BiSolidHeart },
];

const DESIGN_OPS_NAV_ITEMS = [
  { href: "/projects", label: "Projects", icon: BiSolidFolder },
  { href: "/design-team", label: "Design Team", icon: BiSolidGroup },
  { href: "/operational-tasks", label: "Operational Tasks", icon: BiSolidGridAlt },
];

const LEAD_NAV_ITEMS = [
  { href: "/team-insights", label: "Team Summary", icon: BiSolidGroup },
  { href: "/one-on-ones", label: "1:1s", icon: BiSolidUser },
  { href: "/pulse-feedback", label: "Pulse Feedback", icon: BiSolidMessageRounded },
  { href: "/pulse-setup", label: "Pulse Set-up", icon: BiSolidCog },
  { href: "/settings", label: "Settings", icon: BiSolidAdjust },
];

const MOBILE_BOTTOM_ITEMS = [
  { href: "/", label: "Dashboard", icon: BiSolidDashboard },
  { href: "/check-in", label: "Pulse Check", icon: BiSolidCheckSquare },
  { href: "/my-journey", label: "Journey", icon: BiLineChart },
];

const MOBILE_DRAWER_ITEMS = [
  { href: "/my-feedback", label: "My Feedback", icon: BiSolidInbox },
  { href: "/kudos", label: "Pulse Kudos", icon: BiSolidHeart },
];

function getRoleLabel(role: string) {
  if (role === "director") return "Director";
  if (role === "lead") return "Team Lead";
  return "Teammate";
}

function RoleIcon({ role, className }: { role: string; className?: string }) {
  if (role === "director") return <BiSolidCrown className={className} />;
  if (role === "lead") return <BiSolidShield className={className} />;
  return <BiSolidUser className={className} />;
}

function isLeadOrDirector(role: string) {
  return role === "lead" || role === "director";
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const role = user?.role ?? "member";
  const userName = user?.name ?? "";

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border hidden flex-col md:flex">
      <div className="h-20 flex items-center px-8 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-medium text-xl shadow-lg shadow-primary/20">
            A
          </div>
          <span className="font-medium text-xl tracking-tight text-primary">Artkai Pulse</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
              )} />
              {item.label}
            </Link>
          );
        })}
        {isLeadOrDirector(role) && (
          <>
            <div className="pt-4 pb-1 px-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Design Ops</span>
            </div>
            {DESIGN_OPS_NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 pb-1 px-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{role === "director" ? "Director Tools" : "Lead Tools"}</span>
            </div>
            {LEAD_NAV_ITEMS.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border/50 space-y-3">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200 group"
        >
          {theme === "light" ? (
            <BiSolidMoon className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <BiSolidSun className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />
          )}
          <span className="text-sm font-medium">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </button>
        <div className="px-3 py-3 rounded-lg bg-secondary/50 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <RoleIcon role={role} className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground">{getRoleLabel(role)}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
          >
            <BiLogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const role = user?.role ?? "member";
  const userName = user?.name ?? "";

  const isDrawerItemActive = [
    ...MOBILE_DRAWER_ITEMS,
    ...(isLeadOrDirector(role) ? DESIGN_OPS_NAV_ITEMS : []),
    ...(isLeadOrDirector(role) ? LEAD_NAV_ITEMS : []),
  ].some((item) => location === item.href || (item.href !== "/" && location.startsWith(item.href)));

  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <>
      <div
        className={cn(
          "md:hidden fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />

      <div
        className={cn(
          "md:hidden fixed bottom-0 right-0 z-[70] bg-card border border-border rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out w-full max-w-sm",
          drawerOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm shadow-lg shadow-primary/20">
              A
            </div>
            <span className="font-medium text-base tracking-tight text-primary">Artkai Pulse</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <BiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-2 space-y-0.5">
          {MOBILE_DRAWER_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}

          {isLeadOrDirector(role) && (
            <>
              <div className="pt-3 pb-1 px-4">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Design Ops</span>
              </div>
              {DESIGN_OPS_NAV_ITEMS.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 pb-1 px-4">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">{role === "director" ? "Director Tools" : "Lead Tools"}</span>
              </div>
              {LEAD_NAV_ITEMS.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/50 mt-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground hover:bg-secondary transition-all"
          >
            {theme === "light" ? <BiSolidMoon className="w-5 h-5 text-muted-foreground" /> : <BiSolidSun className="w-5 h-5 text-muted-foreground" />}
            <span className="font-medium">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>

          <div className="px-3 py-3 rounded-xl bg-secondary/50 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <RoleIcon role={role} className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(role)}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
            >
              <BiLogOut className="w-3.5 h-3.5" />
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
        <nav className="flex justify-around items-center h-16 px-2">
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-full transition-all duration-300",
                  isActive ? "bg-primary/10" : "transparent"
                )}>
                  <item.icon className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isDrawerItemActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-full transition-all duration-300",
              isDrawerItemActive ? "bg-primary/10" : "transparent"
            )}>
              <BiMenu className={cn(
                "w-5 h-5",
                isDrawerItemActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </div>
    </>
  );
}
