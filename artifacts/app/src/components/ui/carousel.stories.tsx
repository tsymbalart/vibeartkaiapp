import type { Meta, StoryObj } from "@storybook/react-vite";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./carousel";
import { Card, CardContent } from "./card";

const meta: Meta<typeof Carousel> = {
  title: "UI/Carousel",
  component: Carousel,
  parameters: {
    docs: {
      description: {
        component: [
          "**What**: Horizontal content carousel built on `embla-carousel-react` (shadcn/ui).",
          "**When to use**: Swipeable rows of equal-size items — recent check-ins, kudos cards, onboarding slides. Not for long lists (use a grid or scroll area).",
          "**Composition**: `Carousel` → `CarouselContent` → multiple `CarouselItem`s + `CarouselPrevious` / `CarouselNext` buttons.",
          "**Where in the app**: Reserved for onboarding and lightweight showcases.",
          "**Related**: Tabs (non-scrolling alternative), ScrollArea (free-form scrolling container).",
        ].join("\n\n"),
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  render: () => (
    <Carousel className="w-[320px]">
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <CarouselItem key={i}>
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-6">
                <span className="text-3xl font-semibold">{i + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};
