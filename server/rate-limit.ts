import type { IncomingMessage } from "node:http";

export type RequestRateLimiter = {
  allow(request: IncomingMessage): { allowed: true } | { allowed: false; retryAfterSeconds: number };
};

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  maxClients?: number;
  now?: () => number;
  trustProxyHeaders?: boolean;
};

type ClientWindow = {
  count: number;
  resetAt: number;
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function clientKey(request: IncomingMessage, trustProxyHeaders: boolean): string {
  const forwarded = trustProxyHeaders ? firstHeader(request.headers["x-forwarded-for"])?.split(",")[0]?.trim() : undefined;
  const realIp = trustProxyHeaders ? firstHeader(request.headers["x-real-ip"])?.trim() : undefined;
  return (forwarded || realIp || request.socket.remoteAddress || "unknown").slice(0, 64);
}

export function createRequestRateLimiter(options: RateLimiterOptions): RequestRateLimiter {
  const limit = Math.max(1, Math.floor(options.limit));
  const windowMs = Math.max(1_000, Math.floor(options.windowMs));
  const maxClients = Math.max(100, Math.floor(options.maxClients ?? 10_000));
  const now = options.now ?? Date.now;
  const clients = new Map<string, ClientWindow>();

  return {
    allow(request) {
      const timestamp = now();
      for (const [key, window] of clients) {
        if (window.resetAt <= timestamp) clients.delete(key);
      }

      const key = clientKey(request, options.trustProxyHeaders === true);
      let window = clients.get(key);
      if (!window || window.resetAt <= timestamp) {
        if (clients.size >= maxClients) {
          const oldestKey = clients.keys().next().value as string | undefined;
          if (oldestKey !== undefined) clients.delete(oldestKey);
        }
        window = { count: 0, resetAt: timestamp + windowMs };
        clients.set(key, window);
      }

      if (window.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((window.resetAt - timestamp) / 1_000)),
        };
      }

      window.count += 1;
      return { allowed: true };
    },
  };
}
