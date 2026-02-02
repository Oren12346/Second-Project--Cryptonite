import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Required for GitHub Pages (repo name)
  base: "/Second-Project-Cryptonite/",

  plugins: [react()],

  server: {
    proxy: {
      // CoinGecko proxy
      "/cg": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/cg/, ""),
      },

      // AI server proxy (Express) - dev only
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
