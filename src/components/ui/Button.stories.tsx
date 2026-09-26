import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Design System/Button",
  component: Button,
  args: { children: "Launch" },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const PrimaryDisabled: Story = { args: { variant: "primary", disabled: true } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const SecondaryDisabled: Story = { args: { variant: "secondary", disabled: true } };
export const Plain: Story = { args: { variant: "plain", children: "Join" } };
export const PlainDisabled: Story = { args: { variant: "plain", children: "Join", disabled: true } };
