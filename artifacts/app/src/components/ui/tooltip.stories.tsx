import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Button } from "./button";
import { BiSolidHelpCircle } from "react-icons/bi";

const meta: Meta<typeof Tooltip> = { title: "UI/Tooltip", component: Tooltip };
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon">
            <BiSolidHelpCircle className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
