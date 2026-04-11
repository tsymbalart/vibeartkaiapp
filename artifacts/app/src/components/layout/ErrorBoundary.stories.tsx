import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorBoundary } from "./ErrorBoundary";

const meta: Meta<typeof ErrorBoundary> = {
  title: "Layout/ErrorBoundary",
  component: ErrorBoundary,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: React error boundary that catches render-time crashes in its children and shows a friendly fallback instead of a blank white screen.",
          "**When to use**: Wrap top-level routes and any large self-contained feature tree (dashboard widgets, Kanban board, chart containers) so a bug in one area doesn't take down the whole page.",
          "**Key props**: `children`. The fallback UI is built in; it logs the error to the global error handler so observability still sees it.",
          "**Where in the app**: Wrapped around each route in `AppLayout`, and around the top-level App component.",
          "**Related**: Alert (inline error), Sonner (transient error toast), global error handler.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ErrorBoundary>;

function CrashingComponent() {
  throw new Error("Test crash for Storybook");
}

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <CrashingComponent />
    </ErrorBoundary>
  ),
};

export const WithoutError: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg text-green-800 dark:text-green-200 text-sm">
        Everything is fine — no crash here.
      </div>
    </ErrorBoundary>
  ),
};
