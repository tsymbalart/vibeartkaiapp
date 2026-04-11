import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./field";
import { Input } from "./input";

const meta: Meta<typeof Field> = {
  title: "UI/Field",
  component: Field,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Form field layout primitives (shadcn/ui) — `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, grouped inside `FieldGroup` and `FieldSet` / `FieldLegend`.",
          "**When to use**: When you want structured label + input + description + error without pulling in `react-hook-form`. For RHF flows use the `Form` components instead.",
          "**Composition**: `FieldGroup` → `Field` → `FieldLabel` + `FieldContent` (input) + `FieldDescription` / `FieldError`.",
          "**Where in the app**: Simple settings forms and inline edit sections.",
          "**Related**: Form (RHF integration), Label, Input.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <FieldGroup className="w-[380px]">
      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <FieldContent>
          <Input id="email" type="email" placeholder="name@artk.ai" />
        </FieldContent>
        <FieldDescription>We'll never share your email.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <FieldContent>
          <Input id="name" defaultValue="" />
        </FieldContent>
        <FieldError>Name is required.</FieldError>
      </Field>
    </FieldGroup>
  ),
};

export const Fieldset: Story = {
  render: () => (
    <FieldSet className="w-[380px]">
      <FieldLegend>Notification preferences</FieldLegend>
      <FieldSeparator />
      <Field>
        <FieldLabel htmlFor="weekly">Weekly summary</FieldLabel>
        <FieldContent>
          <Input id="weekly" placeholder="email" />
        </FieldContent>
      </Field>
    </FieldSet>
  ),
};
