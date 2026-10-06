export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly kind: "provider" | "timeout" | "rate_limit" | "unavailable" | "unauthorized" = "provider",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
