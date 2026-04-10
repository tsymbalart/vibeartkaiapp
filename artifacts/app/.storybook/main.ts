import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    // Inherit path aliases from the app's vite config
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "/home/user/vibeartkaiapp/artifacts/app/src",
    };
    return config;
  },
};

export default config;
