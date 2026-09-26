import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteHeader } from "./SiteHeader";

const meta: Meta<typeof SiteHeader> = {
  title: "Layout/SiteHeader",
  component: SiteHeader,
};

export default meta;
type Story = StoryObj<typeof SiteHeader>;

export const Default: Story = {};
export const WithRoomCode: Story = { args: { roomCode: "123456" } };
