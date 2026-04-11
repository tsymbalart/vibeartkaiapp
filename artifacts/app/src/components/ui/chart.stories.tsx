import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./chart";

const meta: Meta<typeof ChartContainer> = {
  title: "UI/Chart",
  component: ChartContainer,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Themeable `recharts` wrapper (shadcn/ui). Provides CSS variables for series colours, tooltip styling, and legend helpers.",
          "**When to use**: Any time-series or categorical chart — pulse-score trend, check-in volume by week, risk/opp level mix. For single-value indicators use Progress or HealthGauge.",
          "**Key props**: `config: ChartConfig` (maps data keys to `{ label, color }` and CSS vars). Combine with any `recharts` chart inside.",
          "**Where in the app**: My Journey trend charts, Team Summary analytics, Pulse Setup question-level trend.",
          "**Related**: Progress, HealthGauge, Skeleton (loading).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ChartContainer>;

const data = [
  { week: "W1", score: 7.2 },
  { week: "W2", score: 7.4 },
  { week: "W3", score: 6.8 },
  { week: "W4", score: 7.6 },
  { week: "W5", score: 8.1 },
];

const config = {
  score: { label: "Pulse score", color: "hsl(220, 70%, 50%)" },
};

export const Line_: Story = {
  name: "Line",
  render: () => (
    <div className="w-[400px]">
      <ChartContainer config={config}>
        <LineChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line dataKey="score" stroke="var(--color-score)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  ),
};

export const Bar_: Story = {
  name: "Bar",
  render: () => (
    <div className="w-[400px]">
      <ChartContainer config={config}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="week" tickLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="score" fill="var(--color-score)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
};
