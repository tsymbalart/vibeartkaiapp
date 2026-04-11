import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: User or entity avatar with image + text-fallback (shadcn/ui wrapping Radix Avatar).",
          "**When to use**: Anywhere you display a person — team roster, comment author, assignee chip, Sidebar footer, ItemCard responsible user.",
          "**Composition**: `Avatar` wraps `AvatarImage` (primary) and `AvatarFallback` (initials shown if image fails or is absent). Size via Tailwind `h-*`/`w-*`.",
          "**Where in the app**: Sidebar user block, Design Team roster, ItemCard responsible user, OneOnOnes participant chips, KanbanBoard assignee.",
          "**Related**: Badge (status next to avatar), Tooltip (name on hover).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://ui-avatars.com/api/?name=Art+Tsymbal&background=07142D&color=fff" />
      <AvatarFallback>AT</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>KT</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">SM</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>MD</AvatarFallback></Avatar>
      <Avatar className="h-14 w-14"><AvatarFallback className="text-lg">LG</AvatarFallback></Avatar>
    </div>
  ),
};
