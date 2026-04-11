import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Low-level breadcrumb primitives (shadcn/ui) — list, item, link, page (current), separator, ellipsis (for collapsed middles).",
          "**When to use**: Any page deeper than one level below the top nav. For the Design Ops section we usually use the wrapper `Breadcrumbs` domain component instead.",
          "**Composition**: `Breadcrumb` → `BreadcrumbList` → `BreadcrumbItem` (with `BreadcrumbLink` for past steps / `BreadcrumbPage` for current) → separated by `BreadcrumbSeparator`.",
          "**Where in the app**: Design Ops deep pages (use the domain `Breadcrumbs` component which wraps this).",
          "**Related**: Design Ops/Breadcrumbs (domain wrapper), Sidebar (top-level nav), NavigationMenu.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/design-team">Design Team</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Ksenia Tatsii</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const WithEllipsis: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Project detail</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};
