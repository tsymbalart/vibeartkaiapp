import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Popover> = { title: "UI/Popover", component: Popover };
export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">Set the dimensions for the layer.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Width</Label>
              <Input className="col-span-2 h-8" defaultValue="100%" />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Height</Label>
              <Input className="col-span-2 h-8" defaultValue="25px" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
