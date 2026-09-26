import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { JoinField } from "./JoinField";

const meta: Meta<typeof JoinField> = {
  title: "Design System/JoinField",
  component: JoinField,
  args: { onSubmit: () => undefined },
  decorators: [
    (Story) => (
      <div style={{ width: 420, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof JoinField>;

export const Join: Story = { args: { variant: "join" } };
export const Register: Story = { args: { variant: "register" } };
