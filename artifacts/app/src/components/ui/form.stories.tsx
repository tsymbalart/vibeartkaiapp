import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Button } from "./button";

const meta: Meta<typeof Form> = {
  title: "UI/Form",
  component: Form,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: `react-hook-form` binding for shadcn/ui inputs. Wires `FormField` → `FormItem` → `FormLabel` / `FormControl` / `FormDescription` / `FormMessage` using RHF's `Controller`.",
          "**When to use**: Any non-trivial form where validation, error messages, and controlled inputs are needed — invite teammate, add project, edit pulse question.",
          "**Composition**: `useForm()` → `<Form {...form}>` → `<FormField control={form.control} name=\"x\" render={({field}) => ...}>`.",
          "**Where in the app**: Invite flow, Pulse Setup question editor, project/user edit forms.",
          "**Related**: Field (non-RHF alternative), Input, Select, Textarea.",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Form>;

export const Default: Story = {
  render: () => {
    const form = useForm<{ email: string }>({ defaultValues: { email: "" } });
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => {})}
          className="space-y-4 w-[380px]"
        >
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@artk.ai" {...field} />
                </FormControl>
                <FormDescription>We'll use this to send an invite.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Send invite</Button>
        </form>
      </Form>
    );
  },
};
