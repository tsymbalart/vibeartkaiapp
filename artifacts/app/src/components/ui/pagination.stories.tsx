import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

const meta: Meta<typeof Pagination> = {
  title: "UI/Pagination",
  component: Pagination,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Numbered page navigation primitives (shadcn/ui).",
          "**When to use**: Long tables or lists that you page server-side — audit logs, historical check-ins, bulk invite results. For short lists just render everything.",
          "**Composition**: `Pagination` → `PaginationContent` → `PaginationItem` (`PaginationLink` for page numbers, `PaginationPrevious`/`PaginationNext`, `PaginationEllipsis` for skipped pages).",
          "**Where in the app**: Audit/log views and any historical data tables.",
          "**Related**: Table (parent), ButtonGroup (compact alternative).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" isActive>2</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
};
