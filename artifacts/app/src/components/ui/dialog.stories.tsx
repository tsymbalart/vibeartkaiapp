import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Accessible modal overlay for focused editing or decisions (Radix Dialog).",
          "**When to use**: Non-destructive flows that need the user's full attention — edit profile, invite teammate, add project, pulse question editor. Use AlertDialog for destructive confirms.",
          "**Composition**: `Dialog` → `DialogTrigger` → `DialogContent` (with `DialogHeader`/`Title`/`Description`) → body → `DialogFooter`.",
          "**Where in the app**: Invite flow, add/edit project dialogs, pulse question editor, profile edit.",
          "**Related**: AlertDialog (destructive confirm), Sheet (side panel for longer forms), Drawer (mobile-style bottom).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile here.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" defaultValue="Art Tsymbal" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" defaultValue="a.tsymbal@artk.ai" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
