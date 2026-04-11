import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Vertically stacked, expandable panels built on Radix Accordion (shadcn/ui).",
          "**When to use**: Progressive disclosure of long content — FAQ lists, grouped question categories on the Pulse Setup page, or any collapsible sections inside settings.",
          "**Key props**: `type` (`single` for one-open, `multiple` for many-open), `collapsible` (allows closing the last open item), `defaultValue`.",
          "**Where in the app**: Pulse Setup (question banks grouped by dimension), settings panels.",
          "**Related**: Collapsible (single item), Tabs (horizontal alternative).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="wellness">
        <AccordionTrigger>Wellness (5 questions)</AccordionTrigger>
        <AccordionContent>
          Questions about energy levels, work-life balance, and stress.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="alignment">
        <AccordionTrigger>Alignment (5 questions)</AccordionTrigger>
        <AccordionContent>
          Questions about clarity of goals, priorities, and success metrics.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="growth">
        <AccordionTrigger>Growth (5 questions)</AccordionTrigger>
        <AccordionContent>
          Questions about learning, career development, and challenges.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
