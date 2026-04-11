import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Floating panel anchored to a trigger element (Radix Popover).",
          "**When to use**: Inline editors, filter panels, date pickers, quick settings — anywhere you'd show a small form or info block without a full modal.",
          "**Composition**: `Popover` → `PopoverTrigger` → `PopoverContent` with custom body.",
          "**Where in the app**: Date pickers (Calendar), filter menus on Design Team, lightweight edit panels.",
          "**Related**: Dialog (modal for larger forms), Tooltip (hover info only), HoverCard (link preview), DropdownMenu (action menu).",
        ].join("\n\n"),
      },
    },
  },
};
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
