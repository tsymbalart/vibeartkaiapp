import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toaster } from "./toaster";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";

function ToastDemo() {
  const { toast } = useToast();
  return (
    <div className="flex gap-2">
      <Button
        onClick={() =>
          toast({
            title: "Check-in submitted",
            description: "Your pulse check-in has been recorded.",
          })
        }
      >
        Show toast
      </Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "Something went wrong",
            description: "Please try again.",
          })
        }
      >
        Show error
      </Button>
    </div>
  );
}

const meta: Meta<typeof Toaster> = {
  title: "UI/Toaster",
  component: Toaster,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Classic Radix-based toast mount point (shadcn/ui). Reads the queue from the module-level store managed by `useToast()`.",
          "**When to use**: Mount once at the app root. Trigger toasts from anywhere by calling the `toast()` method returned from `useToast()`.",
          "**Key props**: None — behaviour is entirely controlled through `useToast()`.",
          "**Where in the app**: Mounted at the root; called from check-in submit, invite flow, ItemDetailPanel save/delete, settings, etc.",
          "**Related**: Sonner (modern alternative), Toast primitives, useToast hook.",
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
      <ToastDemo />
      <Toaster />
    </>
  ),
};
