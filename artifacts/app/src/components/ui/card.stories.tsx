import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Surface container with optional header, content, and footer (shadcn/ui).",
          "**When to use**: Wrap any self-contained block — dashboard widgets, settings sections, project summaries, health snapshots.",
          "**Composition**: `Card` + `CardHeader` (with `CardTitle`, `CardDescription`) + `CardContent` + `CardFooter`. Omit whichever parts you don't need.",
          "**Where in the app**: Dashboard metrics, Design Ops widget tiles, Team Member profile panel, One-on-Ones session summary, settings sections.",
          "**Related**: ItemCard (domain-specific risk/opp card), Sheet (side panel), Dialog (modal).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Content area with some text.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm">Cancel</Button>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="p-6">
        <p className="text-sm">A simple card with just content.</p>
      </CardContent>
    </Card>
  ),
};
