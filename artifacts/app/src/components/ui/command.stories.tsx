import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

const meta: Meta<typeof Command> = {
  title: "UI/Command",
  component: Command,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Searchable command palette primitive built on `cmdk` (shadcn/ui).",
          "**When to use**: Quick-action launchers and fuzzy-search pickers — jump to project, invite teammate, open a setting. Pair with `CommandDialog` for a keyboard-triggered global palette.",
          "**Composition**: `Command` → `CommandInput` → `CommandList` → `CommandGroup` / `CommandItem` / `CommandSeparator`.",
          "**Where in the app**: Reserved for future global command palette / search.",
          "**Related**: Select (single-pick), Popover (custom overlay), DropdownMenu.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <Command className="rounded-lg border w-[360px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Dashboard <CommandShortcut>⌘D</CommandShortcut></CommandItem>
          <CommandItem>Pulse Check-in <CommandShortcut>⌘P</CommandShortcut></CommandItem>
          <CommandItem>Design Team</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Notifications</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
