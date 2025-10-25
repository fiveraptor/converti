import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const host = env.VITE_DEV_SERVER_HOST ?? "localhost";
  const port = Number(env.VITE_DEV_SERVER_PORT ?? 5173);

  return {
    plugins: [react()],
    server: {
      host,
      port,
    },
    preview: {
      host,
      port,
    },
  };
});

