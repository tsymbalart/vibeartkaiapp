import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./Breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Design Ops/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Project-local breadcrumb trail for deep pages in the Design Ops section.",
          "**When to use**: Any page more than one level below the top nav — person detail, project detail, item drill-down. Gives users a one-click path back up the hierarchy.",
          "**Key props**: `segments`: array of `{ label, href? }`. The final segment is rendered without a link (current page).",
          "**Where in the app**: Design Team Member page header, project detail pages under the Design Ops section.",
          "**Related**: Breadcrumb (UI primitive version), NavigationMenu, Sidebar (top-level nav).",
        ].join("\n\n"),
      },
    },
  },
};
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
