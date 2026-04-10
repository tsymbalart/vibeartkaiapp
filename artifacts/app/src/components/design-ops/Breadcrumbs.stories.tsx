import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = { title: "Design Ops/Breadcrumbs", component: Breadcrumbs };
export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const TwoSegments: Story = {
  args: { segments: [{ label: "Dashboard", href: "/" }, { label: "Projects" }] },
};
export const ThreeSegments: Story = {
  args: {
    segments: [
      { label: "Dashboard", href: "/" },
      { label: "Design Team", href: "/design-team" },
      { label: "John Doe" },
    ],
  },
};
