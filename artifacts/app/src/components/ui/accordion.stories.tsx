import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const meta: Meta<typeof Accordion> = { title: "UI/Accordion", component: Accordion };
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
