import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, type ReactNode } from "react";
import { QuickAddButton } from "./QuickAddButton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth, type Role } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

function MockUser({ role, name, children }: { role: Role; name: string; children: ReactNode }) {
  const { setUser } = useAuth();
  useEffect(() => {
    setUser({ id: 1, name, email: null, role, teamId: 1, avatarUrl: null });
  }, [setUser, role, name]);
  return <>{children}</>;
}

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
queryClient.setQueryData(["/api/design-ops/dashboard"], {
  projects: [
    { id: 1, name: "Project Alpha" },
    { id: 2, name: "Project Beta" },
  ],
  people: [
    { id: 1, name: "Art Tsymbal" },
    { id: 2, name: "Ksenia Tatsii" },
  ],
  registerItems: [],
});
queryClient.setQueryData(["/api/projects"], [
  { id: 1, name: "Project Alpha" },
  { id: 2, name: "Project Beta" },
]);
queryClient.setQueryData(["/api/design-team"], [
  { id: 1, name: "Art Tsymbal", roleTitle: "Director" },
  { id: 2, name: "Ksenia Tatsii", roleTitle: "Team Lead" },
]);

const meta: Meta<typeof QuickAddButton> = {
  title: "Design Ops/QuickAddButton",
  component: QuickAddButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "**What**: Floating entry-point that opens a multi-step Sheet for quickly creating a health check, a risk, or an opportunity — for either a project or a person.",
          "**When to use**: On pages where leads add new data in bulk — Operational Tasks and Design Team Member detail. Click the button to walk through: 1) category → 2) scope → 3) target → 4) details form.",
          "**Key props**: None — it's self-contained and fetches its own project/user lists.",
          "**Where in the app**: Operational Tasks page (leads/directors), Design Team Member detail page.",
          "**Related**: ScoreSelector (used in step 4 for scoring), KanbanBoard (where created items land), ItemDetailPanel.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <MockUser role="director" name="Art Tsymbal">
              <Story />
            </MockUser>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof QuickAddButton>;

export const Default: Story = {
  render: () => (
    <div className="relative w-[400px] h-[200px] flex items-end justify-end">
      <QuickAddButton />
    </div>
  ),
};
