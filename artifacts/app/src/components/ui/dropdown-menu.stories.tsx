import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";
import { Button } from "./button";
import { BiDotsHorizontalRounded, BiSolidPencil, BiArchive, BiTrash } from "react-icons/bi";

const meta: Meta<typeof DropdownMenu> = { title: "UI/DropdownMenu", component: DropdownMenu };
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <BiDotsHorizontalRounded className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <BiSolidPencil className="w-3.5 h-3.5 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BiArchive className="w-3.5 h-3.5 mr-2" /> Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <BiTrash className="w-3.5 h-3.5 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
