import type { Meta, StoryObj } from "@storybook/react-vite";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group";
import { Button } from "./button";

const meta: Meta<typeof ButtonGroup> = {
  title: "UI/ButtonGroup",
  component: ButtonGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Visually joined row of related buttons with optional separators and inline text (shadcn/ui).",
          "**When to use**: Segmented controls where multiple buttons act on the same target — pagination chunks, view switchers (Grid / Table), format toolbars.",
          "**Composition**: `ButtonGroup` contains `Button`s plus optional `ButtonGroupSeparator` and `ButtonGroupText` for inline context.",
          "**Where in the app**: Lightweight view switchers and toolbars on data-dense pages.",
          "**Related**: ToggleGroup (for on/off state), DropdownMenu (overflow), Pagination.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Share</Button>
      <Button variant="outline">Archive</Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Previous</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Page</Button>
      <ButtonGroupText>1 / 12</ButtonGroupText>
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
};
