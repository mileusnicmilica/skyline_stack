# W04 AI Crane Coach evals

Live eval A14 je izvršen 2026-09-26. Kompletan trenutni test/build/browser
rezultat ponovljen je 2026-10-06 kroz `npm.cmd run verify` u fake režimu:
25 test fajlova / 161 test, uz typecheck, build, secret boundary, W04/W05
preview API i Edge smoke. Produkcijski serverless rate-limit entrypoint je
posebno pokriven A15.

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
| A15 | Produkcijski `api/ai/coach` serverless entrypoint: 5 zahteva, zatim 6. sa istom prosleđenom IP adresom | Prvih 5 su 200; 6. je bez provider poziva 429 i `Retry-After: 600` | PASS — test koristi produkcijski handler factory i fake provider; bez live Gemini poziva |

Komande:

```powershell
npm.cmd test -- --reporter=dot tests/coach-client.test.ts tests/request-gate.test.ts tests/server
npm.cmd run verify
npm.cmd run check:secrets
```
