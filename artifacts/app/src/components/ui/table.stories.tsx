import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "./badge";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Styled HTML `<table>` primitives (shadcn/ui).",
          "**When to use**: Tabular data with multiple columns — team roster, pulse response log, audit trail. For card-based or board layouts use Card or KanbanBoard instead.",
          "**Composition**: `Table` → `TableHeader` (`TableRow` → `TableHead`) + `TableBody` (`TableRow` → `TableCell`) + optional `TableCaption` / `TableFooter`.",
          "**Where in the app**: Design Team roster, invite list, raw check-in log for leads, access-control audit.",
          "**Related**: DataGrid patterns, KanbanBoard (vertical-column alternative), Card list.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Team members</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">Art Tsymbal</TableCell>
          <TableCell>Director</TableCell>
          <TableCell><Badge variant="secondary">Active</Badge></TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Ksenia Tatsii</TableCell>
          <TableCell>Team Lead</TableCell>
          <TableCell><Badge variant="secondary">Active</Badge></TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Valeria Didkivska</TableCell>
          <TableCell>Team Lead</TableCell>
          <TableCell><Badge variant="secondary">Active</Badge></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
