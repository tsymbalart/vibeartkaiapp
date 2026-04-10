import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { BiSolidRightArrow, BiSolidEnvelope } from "react-icons/bi";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = { args: { children: "Button" } };
export const Secondary: Story = { args: { variant: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Link: Story = { args: { variant: "link", children: "Link" } };
export const Small: Story = { args: { size: "sm", children: "Small" } };
export const Large: Story = { args: { size: "lg", children: "Large" } };
export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };
export const WithIcon: Story = {
  args: { children: <>Send <BiSolidRightArrow className="ml-2 w-4 h-4" /></> },
};
export const IconOnly: Story = {
  args: {
    size: "icon",
    variant: "outline",
    children: <BiSolidEnvelope className="w-4 h-4" />,
    "aria-label": "Send email",
  },
};
