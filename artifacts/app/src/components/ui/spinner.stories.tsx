import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./spinner";

const meta: Meta<typeof Spinner> = {
  title: "UI/Spinner",
  component: Spinner,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Animated indeterminate loading indicator (shadcn/ui).",
          "**When to use**: Short-lived loading states inside buttons, inline forms, or single widgets where a full Skeleton would be overkill. Prefer Skeleton for structural loading of a whole page.",
          "**Key props**: Tailwind `className` for sizing (`w-4 h-4` / `w-6 h-6`).",
          "**Where in the app**: Submit buttons during API calls, inline save indicators, dialog body loaders.",
          "**Related**: Skeleton (structural loading), Progress (determinate).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = { render: () => <Spinner /> };

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner className="w-3 h-3" />
      <Spinner className="w-5 h-5" />
      <Spinner className="w-8 h-8" />
    </div>
  ),
};
