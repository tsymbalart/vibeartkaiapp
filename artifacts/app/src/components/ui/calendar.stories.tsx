import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./calendar";

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Month-view date picker built on `react-day-picker` (shadcn/ui).",
          "**When to use**: Pick a single date, a range, or multi-select. Commonly embedded in a `Popover` to form a date input.",
          "**Key props**: `mode: \"single\" | \"multiple\" | \"range\"`, `selected`, `onSelect`, `defaultMonth`, `disabled`.",
          "**Where in the app**: Due-date pickers on risks/opportunities, 1:1 session scheduling, reminder scheduling in Pulse Setup.",
          "**Related**: Popover (wrapper), Input (fallback), Field (labelled form field).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Calendar>;

export const Single: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    return <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />;
  },
};

export const Range: Story = {
  render: () => {
    const [range, setRange] = useState<DateRange | undefined>();
    return <Calendar mode="range" selected={range} onSelect={setRange} className="rounded-md border" />;
  },
};
