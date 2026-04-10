import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./sheet";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Sheet> = { title: "UI/Sheet", component: Sheet };
export default meta;

type Story = StoryObj<typeof Sheet>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Details</SheetTitle>
          <SheetDescription>Make changes to this item.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input placeholder="Enter name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="Enter description" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 py-4">
          <a href="#" className="text-sm font-medium hover:text-primary">Dashboard</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Projects</a>
          <a href="#" className="text-sm font-medium hover:text-primary">Design Team</a>
        </nav>
      </SheetContent>
    </Sheet>
  ),
};
