import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { Sidebar, MobileNav } from "./Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth, type Role } from "@/context/AuthContext";

function MockUser({ role, name, children }: { role: Role; name: string; children: ReactNode }) {
  const { setUser } = useAuth();
  useEffect(() => {
    setUser({ id: 1, name, email: `${name.toLowerCase().replace(/\s+/g, ".")}@artk.ai`, role, teamId: 1, avatarUrl: null });
  }, [setUser, role, name]);
  return <>{children}</>;
}

const meta: Meta<typeof Sidebar> = {
  title: "Layout/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What**: Fixed left navigation for desktop, plus a companion `MobileNav` (bottom tab bar + overflow drawer) for mobile.",
          "**When to use**: Rendered once by `AppLayout` — you almost never instantiate it directly. Stories below show the role-gated variants.",
          "**Key sections**: Main nav (everyone) → Design Ops (lead/director) → Lead Tools / Director Tools (lead/director). Footer: theme toggle + user block with role icon and log out.",
          "**Where in the app**: Visible on every authenticated page as part of `AppLayout`. Collapses to `MobileNav` below the `md` breakpoint.",
          "**Related**: AppLayout (container), RequireRole (component-level gating), MobileNav (mobile variant).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

export const TeammateView: Story = {
  render: () => (
    <ThemeProvider>
      <AuthProvider>
        <MockUser role="member" name="Ksenia Tatsii">
          <div className="min-h-screen bg-background">
            <Sidebar />
          </div>
        </MockUser>
      </AuthProvider>
    </ThemeProvider>
  ),
};

export const LeadView: Story = {
  render: () => (
    <ThemeProvider>
      <AuthProvider>
        <MockUser role="lead" name="Valeria Didkivska">
          <div className="min-h-screen bg-background">
            <Sidebar />
          </div>
        </MockUser>
      </AuthProvider>
    </ThemeProvider>
  ),
};

export const DirectorView: Story = {
  render: () => (
    <ThemeProvider>
      <AuthProvider>
        <MockUser role="director" name="Art Tsymbal">
          <div className="min-h-screen bg-background">
            <Sidebar />
          </div>
        </MockUser>
      </AuthProvider>
    </ThemeProvider>
  ),
};

export const MobileBottomNav: StoryObj<typeof MobileNav> = {
  render: () => (
    <ThemeProvider>
      <AuthProvider>
        <MockUser role="director" name="Art Tsymbal">
          <div className="min-h-screen bg-background md:hidden">
            <MobileNav />
          </div>
        </MockUser>
      </AuthProvider>
    </ThemeProvider>
  ),
};
