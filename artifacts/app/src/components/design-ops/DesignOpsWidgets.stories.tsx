import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignOpsWidgets } from "./DesignOpsWidgets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockData = {
  projects: [
    { id: 1, name: "Project Alpha", latestHealth: { healthScore: 2, overallHealth: "red" as const } },
    { id: 2, name: "Project Beta", latestHealth: { healthScore: 5, overallHealth: "yellow" as const } },
    { id: 3, name: "Project Gamma", latestHealth: { healthScore: 8, overallHealth: "green" as const } },
    { id: 4, name: "Design System", latestHealth: { healthScore: 9, overallHealth: "green" as const } },
    { id: 5, name: "Onboarding Redesign", latestHealth: null },
  ],
  people: [
    { id: 1, name: "Art Tsymbal", latestHealth: { healthScore: 8, overallHealth: "green" as const } },
    { id: 2, name: "Ksenia Tatsii", latestHealth: { healthScore: 5, overallHealth: "yellow" as const } },
    { id: 3, name: "Valeria Didkivska", latestHealth: { healthScore: 3, overallHealth: "red" as const } },
    { id: 4, name: "New Teammate", latestHealth: null },
  ],
  registerItems: [
    {
      id: 11,
      type: "risk" as const,
      linkedTo: "project" as const,
      projectId: 1,
      userId: null,
      title: "Design capacity risk on Project Alpha",
      status: "new",
      impact: 3,
      probability: 3,
      confidence: null,
      value: null,
    },
    {
      id: 12,
      type: "risk" as const,
      linkedTo: "user" as const,
      projectId: null,
      userId: 3,
      title: "Valeria heading into busy period — burnout risk",
      status: "in_work",
      impact: 3,
      probability: 2,
      confidence: null,
      value: null,
    },
    {
      id: 21,
      type: "opportunity" as const,
      linkedTo: "project" as const,
      projectId: 4,
      userId: null,
      title: "Design system v2 rollout",
      status: "in_work",
      impact: null,
      probability: null,
      confidence: 3,
      value: 2,
    },
    {
      id: 22,
      type: "opportunity" as const,
      linkedTo: "user" as const,
      projectId: null,
      userId: 2,
      title: "Cross-team design sprint opportunity",
      status: "new",
      impact: null,
      probability: null,
      confidence: 3,
      value: 3,
    },
  ],
};

function createSeededClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(["/api/design-ops/dashboard"], mockData);
  return client;
}

const meta: Meta<typeof DesignOpsWidgets> = {
  title: "Design Ops/DesignOpsWidgets",
  component: DesignOpsWidgets,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "**What**: Dashboard rollup section for lead/director views. Four widgets: Projects health gauge + top worst, People health gauge + top worst, Risks level bar + top items, Opportunities level bar + top items. Each item links to the drill-down page.",
          "**When to use**: Only on the main Dashboard, gated behind a lead/director role check. Reads from `GET /api/design-ops/dashboard` via React Query.",
          "**Key props**: None — the component fetches its own data. In Storybook we pre-seed the query cache with mock data so nothing hits the network.",
          "**Where in the app**: Dashboard page, only for users with role `lead` or `director`.",
          "**Related**: HealthGauge, HealthBadge, RiskLevelBadge, OppLevelBadge, LevelBar.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={createSeededClient()}>
        <div className="max-w-5xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof DesignOpsWidgets>;

export const Default: Story = { render: () => <DesignOpsWidgets /> };

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
      client.setQueryData(["/api/design-ops/dashboard"], { projects: [], people: [], registerItems: [] });
      return (
        <QueryClientProvider client={client}>
          <div className="max-w-5xl">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  render: () => <DesignOpsWidgets />,
};
