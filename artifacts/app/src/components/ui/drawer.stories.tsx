import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { Button } from "./button";

const meta: Meta<typeof Drawer> = {
  title: "UI/Drawer",
  component: Drawer,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Bottom-sheet style panel built on `vaul` (shadcn/ui).",
          "**When to use**: Mobile-first modals where a bottom sheet feels more natural than a centered Dialog or side Sheet — quick actions on mobile, filter panels on small screens.",
          "**Composition**: `Drawer` → `DrawerTrigger` → `DrawerContent` → `DrawerHeader`/`Title`/`Description` → body → `DrawerFooter` (with `DrawerClose`).",
          "**Where in the app**: Reserved for mobile-specific modal flows; desktop uses Sheet / Dialog.",
          "**Related**: Sheet (side slide), Dialog (centered modal).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Edit details</DrawerTitle>
            <DrawerDescription>Update the information and tap save.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 text-sm text-muted-foreground">Form content goes here.</div>
          <DrawerFooter>
            <Button>Save</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ),
};
