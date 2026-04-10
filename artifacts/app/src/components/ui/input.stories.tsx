import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: "Enter text..." } };
export const WithValue: Story = { args: { defaultValue: "Hello world" } };
export const Disabled: Story = { args: { placeholder: "Disabled", disabled: true } };
export const Email: Story = { args: { type: "email", placeholder: "name@artk.ai" } };
export const Password: Story = { args: { type: "password", placeholder: "Password" } };
