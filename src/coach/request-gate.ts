export class AnalysisRequestGate {
  #revision = 0;
  #pending = false;

  begin(): number | null {
    if (this.#pending) return null;
    this.#pending = true;
    this.#revision += 1;
    return this.#revision;
  }

  isCurrent(requestId: number): boolean {
    return this.#pending && requestId === this.#revision;
  }

  finish(requestId: number): boolean {
    if (!this.isCurrent(requestId)) return false;
    this.#pending = false;
    return true;
  }

  invalidate(): void {
    this.#revision += 1;
    this.#pending = false;
  }
}
