import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { catalog } from "@/platform/catalog";
import { GameCard } from "./GameCard";

const meta: Meta<typeof GameCard> = {
  title: "Design System/GameCard",
  component: GameCard,
  args: { game: catalog[0] },
};

export default meta;
type Story = StoryObj<typeof GameCard>;

export const Default: Story = {};
