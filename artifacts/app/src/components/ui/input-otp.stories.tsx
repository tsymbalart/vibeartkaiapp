import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./input-otp";

const meta: Meta<typeof InputOTP> = {
  title: "UI/InputOTP",
  component: InputOTP,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Multi-slot one-time-password input (shadcn/ui wrapping `input-otp`).",
          "**When to use**: Verification codes — sign-in OTP, 2FA, email confirmation. Renders each character as its own slot with automatic focus advance.",
          "**Key props**: `maxLength` (number of slots), optional `pattern` regex, optional `onComplete` callback.",
          "**Where in the app**: Reserved for future 2FA or magic-link confirmation flows.",
          "**Related**: Input, Field, Dialog (usually embedded in).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof InputOTP>;

export const SixDigit: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};
