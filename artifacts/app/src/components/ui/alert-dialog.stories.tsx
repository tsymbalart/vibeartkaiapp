import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./alert-dialog";
import { Button } from "./button";

const meta: Meta<typeof AlertDialog> = {
  title: "UI/AlertDialog",
  component: AlertDialog,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Modal confirmation dialog that interrupts the user to confirm a destructive or irreversible action (Radix AlertDialog).",
          "**When to use**: Only for actions the user *must* confirm — deleting a project, removing a team member, discarding unsaved changes. Prefer Dialog for non-destructive flows.",
          "**Composition**: AlertDialogTrigger → AlertDialogContent → AlertDialogHeader/Title/Description → AlertDialogFooter (Cancel + Action).",
          "**Where in the app**: Delete confirmations on Design Team Member page (remove user), Design Ops Kanban (delete risk/opportunity), Project settings (archive project).",
          "**Related**: Dialog (non-destructive modal), Sheet (side panel), Sonner/Toast (post-action feedback).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the project
            and all associated health checks and assignments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
