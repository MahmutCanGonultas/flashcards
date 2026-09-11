import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Kelimece — English, one word at a time",
        short_name: "Kelimece",
        description: "Learn English one word at a time — meet it, hear it, use it, and keep it.",
        theme_color: "#FDF9F3",
        background_color: "#FDF9F3",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      // The API lives on a different origin and is never precached or served
      // from the cache — only the app shell (JS/CSS/HTML) is, so a card you
      // review is always read from and written to the real server.
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
      },
    }),
  ],
});
