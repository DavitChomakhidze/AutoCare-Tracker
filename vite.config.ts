import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL;

  return {
    plugins: [figmaAssetResolver(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react/jsx-runtime"],
      force: true,
    },
    server: {
      allowedHosts: ["musky-coherent-diffusive.ngrok-free.dev"],
      ...(supabaseUrl
        ? {
            proxy: {
              "/supabase": {
                target: supabaseUrl,
                changeOrigin: true,
                secure: true,
                rewrite: (proxyPath) => proxyPath.replace(/^\/supabase/, ""),
              },
            },
          }
        : {}),
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
  };
});
