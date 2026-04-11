import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";

const meta: Meta<typeof ContextMenu> = {
  title: "UI/ContextMenu",
  component: ContextMenu,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Right-click contextual menu (Radix ContextMenu).",
          "**When to use**: Power-user shortcuts on rows or cards — right-click a Kanban card to archive, right-click a project row to rename. Always also expose the same actions via a DropdownMenu for discoverability.",
          "**Composition**: `ContextMenu` → `ContextMenuTrigger` (wraps the target area) → `ContextMenuContent` → `ContextMenuItem` / `ContextMenuSeparator`.",
          "**Where in the app**: Reserved for future power-user actions.",
          "**Related**: DropdownMenu (visible trigger), Menubar (persistent top-level menus).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open <ContextMenuShortcut>⌘O</ContextMenuShortcut></ContextMenuItem>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
