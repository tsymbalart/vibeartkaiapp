import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { BiSolidError, BiSolidCheckCircle } from "react-icons/bi";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Static callout box for surfacing status messages inline with page content (shadcn/ui).",
          "**When to use**: Non-blocking notifications that should stay visible — e.g. \"your pulse check-in is due\", permission errors, success confirmations after saving.",
          "**Variants**: `default` (neutral), `destructive` (error/danger). For success states compose with green Tailwind classes (see Success story).",
          "**Where in the app**: Pulse Feedback banner, Design Ops empty-state guidance, settings validation errors.",
          "**Related**: AlertDialog (blocking confirmation), Toast/Sonner (transient pop-up), Badge (inline status).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>Your pulse check-in is due this week.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <BiSolidError className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>Something went wrong. Please try again.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert className="border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20">
      <BiSolidCheckCircle className="h-4 w-4 text-emerald-600" />
      <AlertTitle className="text-emerald-800 dark:text-emerald-200">Success</AlertTitle>
      <AlertDescription className="text-emerald-700 dark:text-emerald-300">
        Your check-in has been submitted.
      </AlertDescription>
    </Alert>
  ),
};
