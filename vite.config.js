import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import motusAccountHandler from "./api/motus-account.js";

function motusApiPlugin() {
  const attach = (server) => {
    server.middlewares.use("/api/motus-account", async (req, res, next) => {
      if (req.method !== "POST") return next();

      let rawBody = "";
      req.on("data", (chunk) => {
        rawBody += chunk.toString("utf8");
      });
      req.on("end", async () => {
        try {
          req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          req.body = {};
        }

        const apiRes = {
          statusCode: 200,
          status(code) {
            this.statusCode = code;
            res.statusCode = code;
            return this;
          },
          json(data) {
            if (!res.headersSent) {
              res.statusCode = this.statusCode || 200;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(data));
            }
            return this;
          },
        };

        await motusAccountHandler(req, apiRes);
      });
    });
  };

  return {
    name: "motus-api-route",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), motusApiPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
  },
});