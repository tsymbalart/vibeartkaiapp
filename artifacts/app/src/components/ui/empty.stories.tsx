import type { Meta, StoryObj } from "@storybook/react-vite";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty";
import { Button } from "./button";
import { BiSolidInbox } from "react-icons/bi";

const meta: Meta<typeof Empty> = {
  title: "UI/Empty",
  component: Empty,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Composable empty-state block with icon/media slot, title, description, and action area (shadcn/ui).",
          "**When to use**: Any list, grid, or board that could legitimately have zero items. Always pair with a clear next-action. Prefer the domain `EmptyState` wrapper for Design Ops pages.",
          "**Composition**: `Empty` → `EmptyMedia` (icon or illustration) → `EmptyHeader` → `EmptyTitle` / `EmptyDescription` → `EmptyContent` (action slot).",
          "**Where in the app**: My Feedback, Kudos, Pulse Feedback, Projects list.",
          "**Related**: Design Ops/EmptyState (domain wrapper), Skeleton (loading), Alert.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Empty>;

export const Default: Story = {
  render: () => (
    <Empty className="w-[380px]">
      <EmptyMedia variant="icon">
        <BiSolidInbox className="w-6 h-6" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>No feedback yet</EmptyTitle>
        <EmptyDescription>
          New feedback from your check-ins will appear here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Submit a check-in</Button>
      </EmptyContent>
    </Empty>
  ),
};
