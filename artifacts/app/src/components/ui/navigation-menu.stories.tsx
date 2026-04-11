import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

const meta: Meta<typeof NavigationMenu> = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Accessible top-level site navigation with fly-out panels (Radix NavigationMenu).",
          "**When to use**: Marketing-style horizontal nav with grouped mega-menu panels. For the authenticated app we use `Sidebar` instead.",
          "**Composition**: `NavigationMenu` → `NavigationMenuList` → `NavigationMenuItem` → `NavigationMenuTrigger` + `NavigationMenuContent` (or a direct `NavigationMenuLink`).",
          "**Where in the app**: Reserved for future public/marketing pages.",
          "**Related**: Sidebar (authenticated app), Menubar, Tabs.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="p-4 w-[280px] space-y-2 text-sm">
              <div className="font-medium">Artkai Pulse</div>
              <p className="text-muted-foreground">Team health check-ins and Design Ops in one place.</p>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#">
            Docs
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
