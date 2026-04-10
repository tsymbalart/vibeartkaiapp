import type { Meta, StoryObj } from "@storybook/react-vite";
import { HealthGauge } from "./HealthGauge";

const meta: Meta<typeof HealthGauge> = { title: "Design Ops/HealthGauge", component: HealthGauge };
export default meta;

type Story = StoryObj<typeof HealthGauge>;

export const Projects: Story = {
  args: {
    label: "Projects",
    green: 3,
    yellow: 2,
    red: 1,
    noData: 0,
  },
};

export const People: Story = {
  args: {
    label: "People",
    green: 5,
    yellow: 1,
    red: 0,
    noData: 2,
  },
};

export const Empty: Story = {
  args: {
    label: "Projects",
    green: 0,
    yellow: 0,
    red: 0,
    noData: 0,
  },
};
