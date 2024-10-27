// vite.config.ts
import path from "path";
import { defineConfig } from "file:///Users/paul/sync-engine/client/node_modules/vite/dist/node/index.js";
import react from "file:///Users/paul/sync-engine/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///Users/paul/sync-engine/client/node_modules/vite-plugin-pwa/dist/index.js";
import topLevelAwait from "file:///Users/paul/sync-engine/client/node_modules/vite-plugin-top-level-await/exports/import.mjs";
var __vite_injected_original_dirname = "/Users/paul/sync-engine/client";
var vite_config_default = defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { version: "2023-05" }]
        ]
      }
    }),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"]
      }
    }),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGF1bC9zeW5jLWVuZ2luZS9jbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9wYXVsL3N5bmMtZW5naW5lL2NsaWVudC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGF1bC9zeW5jLWVuZ2luZS9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgdG9wTGV2ZWxBd2FpdCBmcm9tIFwidml0ZS1wbHVnaW4tdG9wLWxldmVsLWF3YWl0XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3Qoe1xuICAgICAgICAgICAgYmFiZWw6IHtcbiAgICAgICAgICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAgICAgICAgICAgIFtcIkBiYWJlbC9wbHVnaW4tcHJvcG9zYWwtZGVjb3JhdG9yc1wiLCB7IHZlcnNpb246IFwiMjAyMy0wNVwiIH1dLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICAgVml0ZVBXQSh7XG4gICAgICAgICAgICByZWdpc3RlclR5cGU6IFwiYXV0b1VwZGF0ZVwiLFxuICAgICAgICAgICAgd29ya2JveDoge1xuICAgICAgICAgICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmd9XCJdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAgIHRvcExldmVsQXdhaXQoe1xuICAgICAgICAgICAgLy8gVGhlIGV4cG9ydCBuYW1lIG9mIHRvcC1sZXZlbCBhd2FpdCBwcm9taXNlIGZvciBlYWNoIGNodW5rIG1vZHVsZVxuICAgICAgICAgICAgcHJvbWlzZUV4cG9ydE5hbWU6IFwiX190bGFcIixcbiAgICAgICAgICAgIC8vIFRoZSBmdW5jdGlvbiB0byBnZW5lcmF0ZSBpbXBvcnQgbmFtZXMgb2YgdG9wLWxldmVsIGF3YWl0IHByb21pc2UgaW4gZWFjaCBjaHVuayBtb2R1bGVcbiAgICAgICAgICAgIHByb21pc2VJbXBvcnROYW1lOiAoaSkgPT4gYF9fdGxhXyR7aX1gLFxuICAgICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICB9LFxuICAgIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFEsT0FBTyxVQUFVO0FBQzdSLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxtQkFBbUI7QUFKMUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLE1BQ0YsT0FBTztBQUFBLFFBQ0gsU0FBUztBQUFBLFVBQ0wsQ0FBQyxxQ0FBcUMsRUFBRSxTQUFTLFVBQVUsQ0FBQztBQUFBLFFBQ2hFO0FBQUEsTUFDSjtBQUFBLElBQ0osQ0FBQztBQUFBLElBQ0QsUUFBUTtBQUFBLE1BQ0osY0FBYztBQUFBLE1BQ2QsU0FBUztBQUFBLFFBQ0wsY0FBYyxDQUFDLGdDQUFnQztBQUFBLE1BQ25EO0FBQUEsSUFDSixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUE7QUFBQSxNQUVWLG1CQUFtQjtBQUFBO0FBQUEsTUFFbkIsbUJBQW1CLENBQUMsTUFBTSxTQUFTLENBQUM7QUFBQSxJQUN4QyxDQUFDO0FBQUEsRUFDTDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0gsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3hDO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
