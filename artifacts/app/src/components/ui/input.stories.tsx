import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Single-line form text field (shadcn/ui).",
          "**When to use**: Any short text input — name, email, URL, project title, search boxes. For multi-line use Textarea; for OTP use InputOTP.",
          "**Key props**: Standard `<input>` props (`type`, `placeholder`, `value`, `defaultValue`, `disabled`), plus Tailwind class overrides.",
          "**Where in the app**: Sign-in email field, invite form, project name, pulse question editor, filter/search bars.",
          "**Related**: Textarea, Label, Field (labelled wrapper), InputGroup (with addons), Form (RHF integration).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: "Enter text..." } };
export const WithValue: Story = { args: { defaultValue: "Hello world" } };
export const Disabled: Story = { args: { placeholder: "Disabled", disabled: true } };
export const Email: Story = { args: { type: "email", placeholder: "name@artk.ai" } };
export const Password: Story = { args: { type: "password", placeholder: "Password" } };
