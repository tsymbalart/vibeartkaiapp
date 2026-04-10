import type { StorybookConfig } from "@storybook/react-vite";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    const { default: react } = await import("@vitejs/plugin-react");
    const { default: tailwindcss } = await import("@tailwindcss/vite");

    config.plugins = config.plugins || [];
    config.plugins.push(react());
    config.plugins.push(tailwindcss());

    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../src"),
    };

    // Fix Vite 7 + Storybook 8 build compatibility: the Storybook
    // preview entry tries to import from @storybook internals that
    // Rollup can't resolve. Marking them as external fixes the build.
    config.build = config.build || {};
    config.build.rollupOptions = config.build.rollupOptions || {};
    config.build.rollupOptions.onwarn = (warning, defaultHandler) => {
      // Suppress the "unresolved import" warnings from Storybook internals
      if (warning.code === "UNRESOLVED_IMPORT" && warning.exporter?.includes("@storybook")) {
        return;
      }
      defaultHandler(warning);
    };

    // Ensure Storybook's virtual modules are not treated as external
    config.optimizeDeps = config.optimizeDeps || {};
    config.optimizeDeps.include = [
      ...(config.optimizeDeps.include || []),
      "@storybook/react",
      "@storybook/react/preview",
    ];

    return config;
  },
};

export default config;
