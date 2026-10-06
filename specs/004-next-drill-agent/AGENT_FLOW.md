# Next Drill Agent Flow

```mermaid
flowchart TD
    A[Game Over: player requests next drill] --> B[Validate fixed goal and completed drop log]
    B -->|invalid| X[Safe unavailable; zero model and tool calls]
    B --> C[Model decision 1: propose evaluate_drill]
    C --> D[Validate allowlist, exact arguments, repetition and budgets]
    D -->|rejected| Y[Stop; zero execution for rejected proposal]
    D --> E[Execute deterministic read-only evaluator]
    E --> F[Validate normalized result and add evidence ID]
    F --> G[Model decision 2 with evidence]
    G -->|different candidate, budget remains| D
    G -->|final| H[Validate same-run supported evidence]
    H -->|valid| I[Compose fixed text and show recommendation]
    H -->|invalid| Z[Safe unavailable]
    C -->|provider failure or deadline| Z
    E -->|tool failure| Z
    F -->|invalid result| Z
    G -->|repeat, limit, failure or deadline| Z
```

The server, not the model, decides whether a proposed action may execute. Maximums are three model steps, two tool calls, four provider attempts, and 25 seconds per logical run. A provider retry does not add an agent step. No chain-of-thought is exposed or logged.
