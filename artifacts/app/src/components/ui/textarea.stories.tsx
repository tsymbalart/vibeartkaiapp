import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = { title: "UI/Textarea", component: Textarea };
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { placeholder: "Type your message..." } };
export const WithValue: Story = { args: { defaultValue: "This is a longer text that wraps across multiple lines in the textarea component." } };
export const Disabled: Story = { args: { placeholder: "Disabled", disabled: true } };
