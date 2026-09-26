import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter } from "./SiteFooter";

const meta: Meta<typeof SiteFooter> = {
  title: "Layout/SiteFooter",
  component: SiteFooter,
};

export default meta;
type Story = StoryObj<typeof SiteFooter>;

export const Default: Story = {};
