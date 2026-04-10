import type { Meta, StoryObj } from "@storybook/react-vite";
import { RequireRole } from "./RequireRole";
import { AuthProvider } from "@/context/AuthContext";

const meta: Meta<typeof RequireRole> = {
  title: "Layout/RequireRole",
  component: RequireRole,
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
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
