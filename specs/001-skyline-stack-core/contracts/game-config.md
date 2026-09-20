# Contract: GameConfig Runtime Selection

## Type shape

```ts
type GameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  startingBlockWidth: number;
  blockHeight: number;
  moveSpeed: number;
  fallSpeed: number;
  minOverlap: number;
};
```

## Valid example

```ts
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 28,
  moveSpeed: 180,
  fallSpeed: 520,
  minOverlap: 8,
}
```

Expected selection: use these values, `usedFallback === false`, warning is
`null`.

## Invalid examples

```ts
// Missing fallSpeed.
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 28,
  moveSpeed: 180,
  minOverlap: 8,
}

// Present but non-finite.
{
  canvasWidth: 480,
  canvasHeight: 640,
  startingBlockWidth: 200,
  blockHeight: 28,
  moveSpeed: Infinity,
  fallSpeed: 520,
  minOverlap: 8,
}
```

Both examples reject the entire candidate. Expected selection:

- return a fresh copy of the known default configuration;
- set `usedFallback === true`;
- expose exactly one fixed warning:
  `Invalid game configuration. Safe defaults are in use.`;
- do not include field values or raw input in the warning;
- do not throw.

## Validator obligations

1. Input is treated as `unknown`; a TypeScript assertion is not validation.
2. All seven required own fields must be present.
3. Every value must have JavaScript type `number`.
4. Every value must be finite, thereby rejecting `NaN` and infinities.
5. Canvas dimensions, block dimensions, and speeds must be positive.
6. `startingBlockWidth <= canvasWidth`.
7. `blockHeight < canvasHeight`.
8. `minOverlap > 0`.
9. `minOverlap <= startingBlockWidth`.
10. Extra fields may be ignored, but never copied into selected configuration.

## Planned callable boundary

```ts
type ConfigSelection = {
  config: GameConfig;
  usedFallback: boolean;
  warning: string | null;
};

function selectGameConfig(input: unknown): ConfigSelection;
```

