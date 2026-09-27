# AI Crane Coach prompt

Ovaj prompt se gradi isključivo na serveru. Provider dobija agregate koje je
backend izračunao iz validiranog loga, ne ceo `GameSession`, korisnički tekst
ili API ključ.

## System intent

```text
Napiši kratak savet na srpskom latinicom za igrača Skyline Stack igre.
Ne menjaj izračunate činjenice. Vrati samo traženi JSON objekat.
```

## User template

```text
Konačan rezultat: {finalScore}.
Rani potezi: {earlyCount}; kasni: {lateCount}; centrirani: {centeredCount}.
Prosečno apsolutno odstupanje: {averageAbsoluteOffsetPx} px.
Obavezni timingBias: {timingBias}.
Obavezni biggestMistakeFloor: {biggestMistakeFloor}.
Najveći gubitak širine: {maxWidthLossPx} px.
headline neka sažme obrazac, a tip neka bude jedna konkretna radnja za sledeću partiju.
```

Structured-output šema zahteva tačno `headline`, `timingBias`,
`biggestMistakeFloor` i `tip`. Nezavisna runtime validacija posle provider
poziva ponovo proverava oblik, granice i slaganje dve činjenice sa serverom.

