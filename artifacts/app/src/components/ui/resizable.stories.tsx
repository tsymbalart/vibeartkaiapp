import type { Meta, StoryObj } from "@storybook/react-vite";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Split-pane layout with draggable dividers (shadcn/ui wrapping `react-resizable-panels`).",
          "**When to use**: Editor-style pages with adjustable panels — inspector sidebars, log + preview splits, two-pane email views. For ordinary pages use plain Tailwind grid.",
          "**Composition**: `ResizablePanelGroup` (`direction=\"horizontal\" | \"vertical\"`) → `ResizablePanel`s separated by `ResizableHandle`.",
          "**Where in the app**: Reserved for future editor / analytics pages.",
          "**Related**: Sheet, ScrollArea.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ResizablePanelGroup>;

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup direction="horizontal" className="w-[500px] h-[200px] rounded-lg border">
      <ResizablePanel defaultSize={33}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Left</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={67}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Right</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup direction="vertical" className="w-[300px] h-[300px] rounded-lg border">
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Top</div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Bottom</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
