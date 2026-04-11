import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./aspect-ratio";

const meta: Meta<typeof AspectRatio> = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Forces a child element into a fixed aspect ratio regardless of width (Radix AspectRatio).",
          "**When to use**: Responsive media containers — project cover images, avatar crops, chart thumbnails. Keeps the layout stable as images load.",
          "**Key props**: `ratio: number` (e.g. `16/9`, `4/3`, `1`).",
          "**Where in the app**: Not heavily used yet; reserved for future project media and chart embeds.",
          "**Related**: Skeleton (loading state inside AspectRatio), Card (parent container).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AspectRatio>;

export const Sixteen9: Story = {
  render: () => (
    <div className="w-[400px]">
      <AspectRatio ratio={16 / 9} className="bg-secondary rounded-lg flex items-center justify-center text-sm text-muted-foreground">
        16 : 9
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div className="w-[200px]">
      <AspectRatio ratio={1} className="bg-secondary rounded-lg flex items-center justify-center text-sm text-muted-foreground">
        1 : 1
      </AspectRatio>
    </div>
  ),
};
