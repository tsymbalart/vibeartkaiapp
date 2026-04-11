import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Animated placeholder block shown while real content loads (shadcn/ui).",
          "**When to use**: Loading states for cards, list rows, charts, or avatars — anywhere that will swap in real data after a fetch. Improves perceived performance vs. a blank screen.",
          "**Key props**: Style entirely via Tailwind `className` (`h-*`, `w-*`, `rounded-*`).",
          "**Where in the app**: Dashboard widget loading, Design Team roster load, Kanban column load, ItemCard loading state.",
          "**Related**: Spinner (indeterminate single-element), Empty (no-data state after load).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Line: Story = { args: { className: "h-4 w-[250px]" } };
export const Circle: Story = { args: { className: "h-12 w-12 rounded-full" } };
export const CardPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col space-y-3 w-[300px]">
      <Skeleton className="h-[125px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};
