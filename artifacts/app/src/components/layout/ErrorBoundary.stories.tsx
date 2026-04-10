import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorBoundary } from "./ErrorBoundary";

const meta: Meta<typeof ErrorBoundary> = { title: "Layout/ErrorBoundary", component: ErrorBoundary };
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
