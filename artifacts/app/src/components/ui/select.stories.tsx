import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Native-feeling single-value dropdown (Radix Select).",
          "**When to use**: Picking one item from a longer list (5+) — assign a responsible user, choose a project, pick a role on invite. For 2–5 visible options use RadioGroup.",
          "**Composition**: `Select` → `SelectTrigger` (with `SelectValue`) → `SelectContent` → `SelectItem`s.",
          "**Where in the app**: Invite role picker, Kanban assignee picker, project selector, pulse period filter.",
          "**Related**: DropdownMenu (action menu), Command (search-first picker), ComboBox.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="member">Teammate</SelectItem>
        <SelectItem value="lead">Team Lead</SelectItem>
        <SelectItem value="director">Director</SelectItem>
      </SelectContent>
    </Select>
  ),
};
