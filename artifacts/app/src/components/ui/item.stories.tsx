import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";
import { Button } from "./button";
import { BiSolidFolder, BiSolidUser } from "react-icons/bi";

const meta: Meta<typeof Item> = {
  title: "UI/Item",
  component: Item,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Generic list-row primitive (shadcn/ui) — media slot + content (title + description) + actions slot.",
          "**When to use**: Vertical lists of heterogeneous things that don't fit a Table — project summaries, team member rows, notification list, file list. For a pure visual card use `Card`.",
          "**Composition**: `ItemGroup` → `Item` → `ItemMedia` + `ItemContent` (`ItemTitle`, `ItemDescription`) + `ItemActions` + `ItemSeparator` between rows.",
          "**Where in the app**: My Feedback list, notification drawer, bulk-invite review list.",
          "**Related**: Card (visual tile), ItemCard (Design Ops specialization), Table.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Item>;

export const Default: Story = {
  render: () => (
    <ItemGroup className="w-[440px] border rounded-lg">
      <Item>
        <ItemMedia variant="icon"><BiSolidFolder className="w-4 h-4" /></ItemMedia>
        <ItemContent>
          <ItemTitle>Project Alpha</ItemTitle>
          <ItemDescription>3 active teammates · last check-in yesterday</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">Open</Button>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon"><BiSolidUser className="w-4 h-4" /></ItemMedia>
        <ItemContent>
          <ItemTitle>Ksenia Tatsii</ItemTitle>
          <ItemDescription>Team Lead · 2 open risks</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="outline">View</Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  ),
};
