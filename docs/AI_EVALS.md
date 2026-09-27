# W04 AI Crane Coach evals

Stvarni rezultati su iz `npm.cmd run verify` i jednog ograničenog live Gemini
poziva izvršenih 2026-09-26.

| ID | Scenario | Očekivanje | Rezultat |
| --- | --- | --- | --- |
| A1 | Validan zahtev + fake provider | Validiran strukturisan savet | PASS |
| A2 | Invalidan input | `providerCallCount === 0` | PASS |
| A3 | Transient greška | Najviše jedan retry; drugi uspeh se prihvata | PASS |
| A4 | Ponovljena transient greška | Tačno dva attempt-a, zatim safe failure | PASS |
| A5 | Timeout | Abort oba ograničena attempt-a; safe failure | PASS |
| A6 | Malformed šema / `biggestMistakeFloor: null` | Bez retry-a i bez prikaza kao success | PASS |
| A7 | Semantički pogrešan bias/floor | Odbijeno pre browser odgovora | PASS |
| A8 | HTTP 400/403 providera | Bez retry-a | PASS |
| A9 | HTTP 429/5xx providera | Označeno transient za ograničen retry | PASS |
| A10 | Dupli klik dok je pending | Drugi zahtev blokiran | PASS |
| A11 | Odgovor posle Restart-a | Stari request ID više nije važeći | PASS |
| A12 | Browser fake success | Savet prikazan posle Game Over-a | PASS |
| A13 | Browser unavailable | Safe poruka; Restart pokreće novu partiju | PASS |
| A14 | Stvarni Gemini poziv | Strukturisan live odgovor i usage | PASS — success, 1 attempt, 1.459 s, 230 tokena |

Komande:

```powershell
npm.cmd test -- --reporter=dot tests/coach-client.test.ts tests/request-gate.test.ts tests/server
npm.cmd run verify
npm.cmd run check:secrets
```
