import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/** En desarrollo sirve /api/v1/* con los mismos handlers que Vercel (api/v1/db.ts y api/v1/auth/[accion].ts). */
function apiLocal(): Plugin {
  return {
    name: "api-local",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv("development", process.cwd(), "");
      for (const k of ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "TURSO_CONTROL_PLANE_URL", "TURSO_CONTROL_PLANE_AUTH_TOKEN"]) {
        if (env[k] && !process.env[k]) process.env[k] = env[k];
      }
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const archivo =
          url.pathname === "/api/v1/db" ? "/api/v1/db.ts" : url.pathname.startsWith("/api/v1/auth/") ? "/api/v1/auth/[accion].ts" : null;
        if (!archivo) return next();
        try {
          const mod = await server.ssrLoadModule(archivo);
          const handler = mod[req.method ?? "GET"];
          if (!handler) {
            res.statusCode = 405;
            return res.end();
          }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: ["GET", "HEAD"].includes(req.method ?? "GET") ? undefined : Buffer.concat(chunks),
          });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String(e));
          res.statusCode = 500;
          res.end(JSON.stringify({ error: { message: "Error interno" } }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), apiLocal()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs", "@radix-ui/react-tooltip", "lucide-react"],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
  },
}));

