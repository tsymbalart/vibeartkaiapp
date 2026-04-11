import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "./input-group";
import { BiSearch, BiSolidEnvelope } from "react-icons/bi";

const meta: Meta<typeof InputGroup> = {
  title: "UI/InputGroup",
  component: InputGroup,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Joined input + addon composition (shadcn/ui) — put an icon, text, or button flush against an Input or Textarea.",
          "**When to use**: Search fields with a magnifying glass, email fields with a domain suffix, URL fields with protocol prefix, any input that needs inline actions.",
          "**Composition**: `InputGroup` → `InputGroupAddon` (icon/text) + `InputGroupInput` or `InputGroupTextarea` + optional `InputGroupButton`.",
          "**Where in the app**: Search bars on Design Team / Projects, invite form email field, URL settings.",
          "**Related**: Input (plain), Field (labelled wrapper).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof InputGroup>;

export const Search: Story = {
  render: () => (
    <InputGroup className="w-[320px]">
      <InputGroupAddon>
        <BiSearch className="w-4 h-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search projects..." />
    </InputGroup>
  ),
};

export const EmailWithSuffix: Story = {
  render: () => (
    <InputGroup className="w-[320px]">
      <InputGroupAddon>
        <BiSolidEnvelope className="w-4 h-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="name" />
      <InputGroupText>@artk.ai</InputGroupText>
    </InputGroup>
  ),
};

export const WithButton: Story = {
  render: () => (
    <InputGroup className="w-[320px]">
      <InputGroupInput placeholder="Paste link..." />
      <InputGroupButton>Copy</InputGroupButton>
    </InputGroup>
  ),
};
