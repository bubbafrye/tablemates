import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Logo } from "./Logo";

const meta: Meta<typeof Logo> = {
  title: "Design System/Logo",
  component: Logo,
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Header: Story = { args: { size: 20 } };
export const Master: Story = { args: { size: 30 } };
