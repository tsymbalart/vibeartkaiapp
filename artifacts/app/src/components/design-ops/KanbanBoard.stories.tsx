import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { KanbanBoard, type KanbanItem } from "./KanbanBoard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const initialItems: KanbanItem[] = [
  {
    id: 1,
    title: "Design capacity risk on Project Alpha",
    description: "The team is stretched thin across three active projects.",
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
  },
  {
    id: 2,
    title: "Sync handoffs with engineering leads",
    description: "Weekly sync to reduce rework on long-running projects.",
    status: "in_work",
    source: "project",
    sourceName: "Project Beta",
    sourceLink: "/projects/2",
    computedScore: 6,
    computedLevel: "medium",
    itemType: "risk",
    impact: 2,
    probability: 3,
    dueDate: "2026-04-18",
    responsibleUserName: "Valeria Didkivska",
    responsibleUserId: 3,
  },
  {
    id: 3,
    title: "Cross-team design sprint opportunity",
    description: "Run a joint sprint with the research team.",
    status: "in_review",
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
  },
  {
    id: 4,
    title: "Design system v2 rollout",
    description: "All surface components migrated to the new tokens.",
    status: "done",
    source: "project",
    sourceName: "Design System",
    sourceLink: "/projects/4",
    computedScore: 6,
    computedLevel: "medium",
    itemType: "opportunity",
    confidence: 3,
    value: 2,
    responsibleUserName: "Ksenia Tatsii",
    responsibleUserId: 2,
  },
];

const meta: Meta<typeof KanbanBoard> = {
  title: "Design Ops/KanbanBoard",
  component: KanbanBoard,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What**: Four-column drag-and-drop board (New → In Work → In Review → Done) for Design Ops risks and opportunities, built on `@hello-pangea/dnd`. Clicking a card opens `ItemDetailPanel` in a side sheet.",
          "**When to use**: Tracking active design-ops work surfaced on the Operational Tasks page and inside a single Team Member's page. Not meant for generic task boards — the columns and scoring are domain-specific.",
          "**Key props**: `items: KanbanItem[]` (rendered into columns by `status`), `onMove(item, newStatus)` (called on drop), optional `onArchive(item)` (shows the overflow menu on cards).",
          "**Where in the app**: Operational Tasks page, Design Team Member detail page.",
          "**Related**: ItemCard (single card), ItemDetailPanel (editor sheet), QuickAddButton (entry point for creating items).",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="p-6 max-w-6xl">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof KanbanBoard>;

export const Default: Story = {
  render: () => {
    const [items, setItems] = useState<KanbanItem[]>(initialItems);
    return (
      <KanbanBoard
        items={items}
        onMove={(item, newStatus) => {
          setItems((prev) => prev.map((i) => (i.id === item.id && i.source === item.source ? { ...i, status: newStatus } : i)));
        }}
        onArchive={(item) => {
          setItems((prev) => prev.filter((i) => !(i.id === item.id && i.source === item.source)));
        }}
      />
    );
  },
};

export const Empty: Story = {
  render: () => (
    <KanbanBoard items={[]} onMove={() => {}} onArchive={() => {}} />
  ),
};
