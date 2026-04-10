import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "./badge";

const meta: Meta<typeof Table> = { title: "UI/Table", component: Table };
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
