import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta<typeof Tabs> = { title: "UI/Tabs", component: Tabs };
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
