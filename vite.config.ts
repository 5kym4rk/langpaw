import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// GitHub Pages project-page base path. Local dev/preview stays at "/".
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base =
  process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "/";

export default defineConfig({
  base,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: [
        "icons/favicon.svg",
        "icons/apple-touch-icon.png",
        "robots.txt",
      ],
      manifest: {
        name: "LangPaw — Học ngoại ngữ",
        short_name: "LangPaw",
        description:
          "Ứng dụng học ngoại ngữ dành cho người Việt (Anh, Trung, Hàn, Nhật)",
        lang: "vi",
        theme_color: "#d9823b",
        background_color: "#172033",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Do not precache large background videos.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        globIgnores: ["**/backgrounds/*.{webm,mp4}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes("/data/"),
            handler: "StaleWhileRevalidate",
            options: { cacheName: "langpaw-data" },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes("/backgrounds/"),
            handler: "CacheFirst",
            options: {
              cacheName: "langpaw-backgrounds",
              expiration: { maxEntries: 12 },
            },
          },
        ],
      },
    }),
  ],
});
