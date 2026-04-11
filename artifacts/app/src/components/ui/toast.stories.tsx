import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Low-level Radix Toast primitives (shadcn/ui) — `Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`, `ToastViewport`, `ToastProvider`.",
          "**When to use**: Rarely directly — almost everything should use the higher-level `useToast()` hook + `<Toaster />`. Use these primitives only when you need a fully custom toast shape.",
          "**Composition**: Wrap everything in `ToastProvider`, render one or more `Toast` elements, place `ToastViewport` at the end (anchors the corner).",
          "**Where in the app**: Indirectly via `useToast()` across the app.",
          "**Related**: Toaster (high-level), Sonner (alternative), useToast hook.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <Toast open>
        <div className="grid gap-1">
          <ToastTitle>Check-in submitted</ToastTitle>
          <ToastDescription>Your pulse check-in has been recorded.</ToastDescription>
        </div>
        <ToastAction altText="Undo">Undo</ToastAction>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};

export const Destructive: Story = {
  render: () => (
    <ToastProvider>
      <Toast open variant="destructive">
        <div className="grid gap-1">
          <ToastTitle>Something went wrong</ToastTitle>
          <ToastDescription>Please try again in a moment.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
};
