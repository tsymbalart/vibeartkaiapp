import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./sidebar";
import { BiSolidDashboard, BiSolidCheckSquare, BiSolidGroup, BiSolidCog } from "react-icons/bi";

const meta: Meta<typeof Sidebar> = {
  title: "UI/Sidebar (shadcn)",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: [
          "**What**: shadcn/ui's composable collapsible sidebar primitive. This is different from the app's layout `Sidebar` (which is the custom, wouter-routed navigation). These primitives power generic layouts.",
          "**When to use**: Building any new sidebar layout — admin panels, document trees, inspector lists. For the main app shell keep using Layout/Sidebar.",
          "**Composition**: `SidebarProvider` → `Sidebar` (`SidebarHeader` + `SidebarContent` with `SidebarGroup` → `SidebarMenu` → `SidebarMenuItem`/`Button` + `SidebarFooter`) plus a `SidebarInset` for the content pane and `SidebarTrigger` to toggle.",
          "**Where in the app**: Not currently used by main pages; available for internal admin/editor UIs.",
          "**Related**: Layout/Sidebar (the app's real navigation), Sheet, NavigationMenu.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="px-2 py-2 text-sm font-medium">Artkai Pulse</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton><BiSolidDashboard className="w-4 h-4" /> Dashboard</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton><BiSolidCheckSquare className="w-4 h-4" /> Pulse Check</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton><BiSolidGroup className="w-4 h-4" /> Design Team</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton><BiSolidCog className="w-4 h-4" /> Settings</SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 p-4 border-b">
          <SidebarTrigger />
          <span className="text-sm font-medium">Main content</span>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          Shadcn sidebar demo — try toggling the trigger button.
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
};
