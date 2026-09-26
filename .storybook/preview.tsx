import type { Preview } from "@storybook/nextjs-vite";
import "@/styles/globals.css";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "primary",
      values: [{ name: "primary", value: "#f7f0e3" }],
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    }
  },
};

export default preview;