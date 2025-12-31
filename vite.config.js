import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // This forces the app to update immediately when a new version is deployed
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Seed & Sell",
        short_name: "Seed&Sell",
        description: "Zimbabwe's marketplace for farmers and suppliers.",
        theme_color: "#689f38",
        icons: [
          {
            src: "/images/icons/logo.webp", // Ensure you move your images to the public folder
            sizes: "192x192",
            type: "image/webp",
          },
          {
            src: "/images/icons/logo.webp",
            sizes: "512x512",
            type: "image/webp",
          },
        ],
      },
    }),
  ],
});
