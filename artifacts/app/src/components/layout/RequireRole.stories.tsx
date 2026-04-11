import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequireRole } from "./RequireRole";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

const meta: Meta<typeof RequireRole> = {
  title: "Layout/RequireRole",
  component: RequireRole,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Route/component guard that only renders its children if the current user's role matches the allowed list.",
          "**When to use**: Wrap any page section that should be hidden from teammates — Design Ops nav, Operational Tasks, Lead-only widgets, Director-only settings. For full route gating combine with React Router.",
          "**Key props**: `roles: (\"member\" | \"lead\" | \"director\")[]`, `children`, optional `fallback` (renders \"Access denied\" by default).",
          "**Where in the app**: Sidebar section wrappers, Dashboard widget gating, Operational Tasks route, Team settings.",
          "**Related**: Backend middleware `requireRole`/`requireLeadOrDirector`, AuthContext.",
        ].join("\n\n"),
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <AuthProvider>
          <Story />
        </AuthProvider>
      </ThemeProvider>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof RequireRole>;

export const AccessDenied: Story = {
  args: {
    roles: ["lead", "director"],
    children: <div className="p-4 bg-green-100 rounded-lg">You should not see this (member view)</div>,
  },
};
