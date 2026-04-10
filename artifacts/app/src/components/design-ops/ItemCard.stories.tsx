import type { Meta, StoryObj } from "@storybook/react-vite";
import { ItemCard, type KanbanItem } from "./ItemCard";

const meta: Meta<typeof ItemCard> = { title: "Design Ops/ItemCard", component: ItemCard };
export default meta;

type Story = StoryObj<typeof ItemCard>;

const baseItem: KanbanItem = {
  id: 1,
  title: "Design capacity risk on Project Alpha",
  description: "The team is stretched thin across 3 active projects.",
  status: "new",
  type: "risk",
  linkedTo: "project",
  priority: 1,
  riskLevel: "high",
  riskScore: 9,
  oppLevel: null,
  oppScore: null,
  responsibleName: "Ksenia Tatsii",
  dueDate: "2026-04-20",
  linkedName: "Project Alpha",
};

export const Risk: Story = {
  args: { item: baseItem, onMove: () => {}, onEdit: () => {} },
};

export const Opportunity: Story = {
  args: {
    item: {
      ...baseItem,
      id: 2,
      title: "Cross-team design sprint opportunity",
      type: "opportunity",
      riskLevel: null,
      riskScore: null,
      oppLevel: "high",
      oppScore: 9,
      status: "in_work",
    },
    onMove: () => {},
    onEdit: () => {},
  },
};
