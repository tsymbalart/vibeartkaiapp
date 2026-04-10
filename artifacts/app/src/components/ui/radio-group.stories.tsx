import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta: Meta<typeof RadioGroup> = { title: "UI/RadioGroup", component: RadioGroup };
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="latest_only">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="latest_only" id="r1" />
        <Label htmlFor="r1">Latest check-in only</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="average_all" id="r2" />
        <Label htmlFor="r2">Average all check-ins</Label>
      </div>
    </RadioGroup>
  ),
};
