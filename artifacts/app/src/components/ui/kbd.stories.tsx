import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "./kbd";

const meta: Meta<typeof Kbd> = {
  title: "UI/Kbd",
  component: Kbd,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Keyboard shortcut label styled like a physical key (shadcn/ui).",
          "**When to use**: Inline next to an action — tooltip footer, menu shortcut column, help modal. Group combos with `KbdGroup`.",
          "**Composition**: `<Kbd>⌘</Kbd>` for a single key; `<KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>` for combos.",
          "**Where in the app**: Future command palette shortcuts, tooltip footers on power-user actions.",
          "**Related**: Tooltip, CommandShortcut, Menubar.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Kbd>;

export const Single: Story = { render: () => <Kbd>Esc</Kbd> };

export const Combo: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const InSentence: Story = {
  render: () => (
    <p className="text-sm">
      Press <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup> to open the command palette.
    </p>
  ),
};
