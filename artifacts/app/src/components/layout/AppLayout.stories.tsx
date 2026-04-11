import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { AppLayout } from "./AppLayout";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth, type Role } from "@/context/AuthContext";

function MockUser({ role, name, children }: { role: Role; name: string; children: ReactNode }) {
  const { setUser } = useAuth();
  useEffect(() => {
    setUser({ id: 1, name, email: `${name.toLowerCase().replace(/\s+/g, ".")}@artk.ai`, role, teamId: 1, avatarUrl: null });
  }, [setUser, role, name]);
  return <>{children}</>;
}

const meta: Meta<typeof AppLayout> = {
  title: "Layout/AppLayout",
  component: AppLayout,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What**: Top-level page chrome. Wraps every authenticated route with the fixed left `Sidebar`, mobile bottom `MobileNav`, and a centered max-6xl content container with responsive padding.",
          "**When to use**: Around any authenticated page. Unauthenticated flows (sign-in, invite acceptance, error pages) should render without it.",
          "**Key props**: `children` only. All other chrome (navigation, theme toggle, user menu) is provided by the composed `Sidebar` + `MobileNav`.",
          "**Where in the app**: Every main page — Dashboard, Pulse Check-in, Pulse Feedback, My Journey, My Feedback, Kudos, Projects, Design Team, Design Team Member, Operational Tasks, One-on-Ones, Pulse Setup, Settings.",
          "**Related**: Sidebar (the desktop nav), MobileNav (mobile bottom bar + drawer), ErrorBoundary (wraps routes inside this layout).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AppLayout>;

export const TeammateView: Story = {
  render: () => (
    <ThemeProvider>
      <AuthProvider>
        <MockUser role="member" name="Ksenia Tatsii">
          <AppLayout>
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-muted-foreground">
                This is a teammate's view — only the main navigation is visible in the Sidebar.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-card border">Widget A</div>
                <div className="p-6 rounded-lg bg-card border">Widget B</div>
                <div className="p-6 rounded-lg bg-card border">Widget C</div>
              </div>
            </div>
          </AppLayout>
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
          <AppLayout>
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              <p className="text-muted-foreground">
                Director view — Sidebar shows Design Ops and Director Tools sections.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-lg bg-card border">Widget A</div>
                <div className="p-6 rounded-lg bg-card border">Widget B</div>
                <div className="p-6 rounded-lg bg-card border">Widget C</div>
              </div>
            </div>
          </AppLayout>
        </MockUser>
      </AuthProvider>
    </ThemeProvider>
  ),
};
