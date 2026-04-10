import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta<typeof Select> = { title: "UI/Select", component: Select };
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
