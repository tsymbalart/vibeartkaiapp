import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Multi-line text field (shadcn/ui).",
          "**When to use**: Free-form text — check-in comments, 1:1 notes, risk/opportunity descriptions, feedback body. For short single-line use Input.",
          "**Key props**: Standard `<textarea>` props (`placeholder`, `value`, `defaultValue`, `rows`, `disabled`).",
          "**Where in the app**: Pulse Feedback comment, OneOnOnes notes, ItemDetailPanel description, Kudos message.",
          "**Related**: Input, Field (labelled wrapper), Form (RHF integration).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { placeholder: "Type your message..." } };
export const WithValue: Story = { args: { defaultValue: "This is a longer text that wraps across multiple lines in the textarea component." } };
export const Disabled: Story = { args: { placeholder: "Disabled", disabled: true } };
