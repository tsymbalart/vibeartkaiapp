import type { Meta, StoryObj } from "@storybook/react-vite";
import { ItemDetailPanel } from "./ItemDetailPanel";
import type { KanbanItem } from "./ItemCard";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const sampleRisk: KanbanItem = {
  id: 101,
  title: "Design capacity risk on Project Alpha",
  description: "The team is stretched thin across three active projects and we risk missing the end-of-month deadline.",
  status: "new",
  source: "project",
  sourceName: "Project Alpha",
  sourceLink: "/projects/1",
  computedScore: 9,
  computedLevel: "high",
  itemType: "risk",
  impact: 3,
  probability: 3,
  dueDate: "2026-04-25",
  responsibleUserName: "Ksenia Tatsii",
  responsibleUserId: 2,
  priority: 1,
};

const sampleOpportunity: KanbanItem = {
  id: 202,
  title: "Cross-team design sprint opportunity",
  description: "Run a joint design sprint with the research team to unblock three discovery tracks at once.",
  status: "in_work",
  source: "user",
  sourceName: "Valeria Didkivska",
  sourceLink: "/design-team/3",
  computedScore: 9,
  computedLevel: "high",
  itemType: "opportunity",
  confidence: 3,
  value: 3,
  responsibleUserName: "Art Tsymbal",
  responsibleUserId: 1,
};

const meta: Meta<typeof ItemDetailPanel> = {
  title: "Design Ops/ItemDetailPanel",
  component: ItemDetailPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What**: Side-sheet editor for a single Kanban item (risk or opportunity). Surfaces title, description, responsible user, due date, scoring dimensions (probability × impact for risks, confidence × value for opportunities), and recomputed score/level.",
          "**When to use**: Rendered inside `KanbanBoard`'s Sheet when a card is clicked. Not typically used stand-alone.",
          "**Key props**: `item: KanbanItem` (the record being edited), `onClose()` (called when the sheet should dismiss).",
          "**Where in the app**: Opened from any ItemCard click — Operational Tasks, Design Team Member, and project detail Kanban views.",
          "**Related**: KanbanBoard (container), ItemCard (trigger), ScoreSelector (rendering the dimension pickers), Sheet.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof ItemDetailPanel>;

export const RiskOpen: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] p-0 flex flex-col">
        <ItemDetailPanel item={sampleRisk} onClose={() => {}} />
      </SheetContent>
    </Sheet>
  ),
};

export const OpportunityOpen: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="right" className="w-[440px] sm:max-w-[440px] p-0 flex flex-col">
        <ItemDetailPanel item={sampleOpportunity} onClose={() => {}} />
      </SheetContent>
    </Sheet>
  ),
};
