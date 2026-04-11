import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Avatar, AvatarFallback } from "./avatar";

const meta: Meta<typeof HoverCard> = {
  title: "UI/HoverCard",
  component: HoverCard,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Rich preview overlay that appears on hover (Radix HoverCard).",
          "**When to use**: User/project previews on hover — show a mini profile card over a name, or project health preview over a link. Desktop-only (no touch equivalent), so never hide essential info here.",
          "**Composition**: `HoverCard` → `HoverCardTrigger` (wraps the target) → `HoverCardContent` with custom body.",
          "**Where in the app**: Reserved for future user/project preview chips.",
          "**Related**: Tooltip (short text only), Popover (clickable overlay).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger className="cursor-pointer underline underline-offset-4">
        @ksenia
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>KT</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Ksenia Tatsii</p>
            <p className="text-xs text-muted-foreground">Team Lead · 3 active projects</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};
