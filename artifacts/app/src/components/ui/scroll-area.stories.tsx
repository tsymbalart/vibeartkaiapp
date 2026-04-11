import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Styled scrollable container with custom scrollbars (Radix ScrollArea).",
          "**When to use**: Long lists inside a constrained-height area — notification panels, chat history, inline dropdowns that could overflow. For the whole page just use the browser scroll.",
          "**Key props**: Standard div props. Apply `height`/`max-height` via Tailwind class or inline style.",
          "**Where in the app**: Notification drawer, inline large-list pickers, Sheet bodies with long content.",
          "**Related**: Sheet, Sidebar body, Resizable panes.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-[320px] rounded-md border p-4">
      <div className="space-y-2">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="text-sm">Item {i + 1}</div>
        ))}
      </div>
    </ScrollArea>
  ),
};
