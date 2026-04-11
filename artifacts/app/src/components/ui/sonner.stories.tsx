import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta: Meta<typeof Toaster> = {
  title: "UI/Sonner",
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Sonner toast mount point (shadcn/ui wrapping `sonner`). Integrates with `next-themes` to match the app's light/dark mode.",
          "**When to use**: Modern replacement for `Toaster`. Mount `<Toaster />` once in the app root, then call `toast()`/`toast.success()`/`toast.error()` from anywhere.",
          "**Key props**: Standard sonner Toaster props (`position`, `expand`, `richColors`).",
          "**Where in the app**: Use for transient feedback — \"Check-in submitted\", \"Invite sent\", \"Something went wrong\".",
          "**Related**: Toaster (classic), Toast primitives, Alert (persistent inline).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <>
      <div className="flex gap-2">
        <Button onClick={() => toast("Event created", { description: "Your check-in was submitted" })}>
          Show toast
        </Button>
        <Button
          variant="destructive"
          onClick={() => toast.error("Something went wrong", { description: "Please try again" })}
        >
          Show error
        </Button>
      </div>
      <Toaster />
    </>
  ),
};
