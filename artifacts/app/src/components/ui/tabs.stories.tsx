import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Horizontal tab switcher with animated content panels (Radix Tabs).",
          "**When to use**: 2–5 peer views of the same page context — People / Pulse / Access on Design Team, Overview / Risks / Opportunities on a project detail.",
          "**Composition**: `Tabs` (with `defaultValue`) → `TabsList` → `TabsTrigger` for each tab → matching `TabsContent`s.",
          "**Where in the app**: Design Team tabs, Project detail tabs, Settings sections.",
          "**Related**: Accordion (vertical progressive disclosure), NavigationMenu (top-level routing).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="people" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="people">People</TabsTrigger>
        <TabsTrigger value="pulse">Pulse</TabsTrigger>
        <TabsTrigger value="access">Access</TabsTrigger>
      </TabsList>
      <TabsContent value="people" className="p-4 text-sm">People tab content</TabsContent>
      <TabsContent value="pulse" className="p-4 text-sm">Pulse tab content</TabsContent>
      <TabsContent value="access" className="p-4 text-sm">Access tab content</TabsContent>
    </Tabs>
  ),
};
