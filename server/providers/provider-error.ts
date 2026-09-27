export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
    public readonly kind: "provider" | "timeout" = "provider",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
