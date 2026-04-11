import type { Meta, StoryObj } from "@storybook/react-vite";
import { DimensionBadge } from "./dimension-badge";

const meta: Meta<typeof DimensionBadge> = {
  title: "UI/DimensionBadge",
  component: DimensionBadge,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Colour-coded label for one of the eight Artkai Pulse health dimensions (wellness, alignment, management, growth, design_courage, collaboration, recognition, belonging).",
          "**When to use**: Tagging questions, check-in rows, or aggregated scores by the dimension they measure. The colour and icon are deterministic per dimension so users can scan a list quickly.",
          "**Key props**: `dimension: string` (one of the known keys, falls back to muted if unknown), `className`.",
          "**Where in the app**: Pulse Feedback question rows, My Journey dimension breakdown, Pulse Setup question editor.",
          "**Related**: Badge (generic), HealthBadge (score-based), `getPillarLabel`, `getPillarIcon`, `getPillarColor` helpers.",
        ].join("\n\n"),
      },
    },
  },
  argTypes: {
    dimension: {
      control: "select",
      options: ["wellness", "alignment", "management", "growth", "design_courage", "collaboration", "recognition", "belonging"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof DimensionBadge>;

export const Wellness: Story = { args: { dimension: "wellness" } };
export const Alignment: Story = { args: { dimension: "alignment" } };
export const Growth: Story = { args: { dimension: "growth" } };

export const AllDimensions: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-[500px]">
      {["wellness", "alignment", "management", "growth", "design_courage", "collaboration", "recognition", "belonging"].map((d) => (
        <DimensionBadge key={d} dimension={d} />
      ))}
    </div>
  ),
};
