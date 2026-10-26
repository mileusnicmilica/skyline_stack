import { defineConfig } from "vite";

// The production preview serves the same browser policy as Vercel. Keep the
// values in vercel.json in sync; tests/w08-browser.mjs checks both responses.
const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const apiProxy = {
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: false,
  },
};

export default defineConfig({
  server: {
    host: "127.0.0.1",
    proxy: apiProxy,
  },
  preview: {
    host: "127.0.0.1",
    proxy: apiProxy,
    headers: securityHeaders,
  },
});
