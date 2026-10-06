# W04 evidence — AI Crane Coach

**W04 live evidence datum:** 2026-09-26
**Current repository verification:** 2026-10-06, fake mode; 25 test files / 161 tests PASS. The W04 live results below are historical and unchanged. Nemanja's earlier diff review is recorded; the joint demo remains unverified.

## Arhitektura i granica

```text
Game Over browser UI
  -> POST /api/ai/coach (finalScore, startingWidth, drops)
  -> loopback TypeScript backend
     -> runtime input validation + server statistics
     -> fake provider (test/verify) ili Gemini (lokalni server env)
     -> runtime shape + semantic validation
  <- validated advice ili stabilna safe greška
```

Browser ne zna provider endpoint/ključ i ne poziva Gemini. Gemini adapter šalje
samo server agregate. `biggestMistakeFloor` je obavezan integer; `null` i
neslaganje sa server činjenicom su odbijeni.

## Reliability i korisnički tok

- Ukupni provider rok je 10 s; attempt rok 4.5 s; backoff 250 ms.
- Dozvoljen je najviše jedan retry za network/429/5xx.
- Invalid input, 400/403 i deterministički malformed output nemaju retry.
- Dugme „Analiziraj partiju“ postoji samo posle Game Over-a.
- Pending stanje blokira dupli zahtev. Restart abortuje zahtev i invalidira
  njegov ID, pa zastareo odgovor ne može da se prikaže u novoj partiji.
- Validan odgovor prikazuje headline, tajming, sprat i tip. Sve greške se
  svode na `AI analiza trenutno nije dostupna.`; Restart ostaje dostupan.

## Stvarni rezultati

| Provera | Rezultat |
| --- | --- |
| `npm.cmd run verify` (current repository; fake mode) | PASS: 25 test fajlova / 161 test, oba TypeScript typecheck-a, production build |
| Secret boundary u `verify` | PASS: tracked files, Git history i `dist` |
| API + preview proxy | PASS: health i fake W04/W05 success |
| Edge production smoke | PASS: Game Over dugme, fake success, safe failure, restart; 0 browser/console grešaka |
| Production serverless rate-limit entrypoint | PASS: 5 zahteva uspešno; šesti isti-klijent zahtev vraća 429 sa `Retry-After: 600`; provider pozvan tačno 5 puta |
| Provider usage | 2 fake poziva i 2 live poziva; sva četiri success u jednom attempt-u |
| Stvarni Gemini pozivi | PASS: lokalno 1.459 s i 230 tokena; Vercel 0.980 s i 227 tokena; ukupno 457 tokena |

Prvi sandbox pokušaj `verify` stigao je do 116/116 testova, build-a i secret
gate-a, ali je `tsx` pre server koda dobio poznato ograničenje okruženja
`uv_os_get_passwd/ENOMEM`. Ista komanda je zatim ponovljena u normalnom
lokalnom procesu i kompletno je prošla.

Aktuelni `npm.cmd run verify` rezultat je ponovljen 2026-10-06 posle ažuriranja
evidence-a. Komanda je radila sa `AI_COACH_PROVIDER=fake`; produkcijska
rate-limit provera koristi fake provider u testu i ne šalje Gemini zahtev.
Provera potvrđuje limiter u produkcionom handleru na jednoj instanci; ne
potvrđuje deljeni limit između zasebnih Vercel serverless instanci. Detalji,
HEAD commit i kompletni rezultati su u
[`CURRENT_STATE_2026-10-06.md`](CURRENT_STATE_2026-10-06.md).

## Security checklist

- [x] API key nije u frontend bundle-u.
- [x] Obrazac Google ključa i lokalna vrednost (kada postoji) proveravaju se u tracked fajlovima, Git istoriji i `dist`.
- [x] Pravi `.env` nije verzionisan; u ovom izvršenju nije ni postojao.
- [x] `.env.example` sadrži prazan `GEMINI_API_KEY=`.
- [x] Backend ne vraća ključ, provider body, stack trace ili interni error.
- [x] Provider usage log ne sadrži ključ, prompt ni game payload.
- [x] Input se validira pre provider poziva; invalid testovi dokazuju 0 poziva.
- [x] Structured output se runtime-validira pre browser odgovora i ponovo ograničeno proverava u klijentu.
- [x] Nema `VITE_` provider secreta.

## Model i cena

`gemini-3.1-flash-lite` je 2026-09-26 potvrđen kao stabilan model sa
structured output podrškom. Tadašnja paid-tier cena je USD 0.25/1M text input
i USD 1.50/1M output tokena. Live poziv je vratio 156 input i 74 output tokena,
pa je list-price ekvivalent `156 × 0.25 / 1M + 74 × 1.50 / 1M = USD 0.000150`.
Stvarno zaduženje može biti USD 0 na free tier-u; billing status nije deo
provider usage odgovora.

## Doprinosi i review

- Nemanja: prethodno isporučio frontend/backend split, request/statistics
  validaciju, response semantiku, fake provider, safe HTTP boundary i handoff.
- Milicin blok: Gemini adapter/config testovi, timeout/retry/abort, sanitizovan
  usage zapis, Game Over UI, pending/advice/unavailable stanja, duplicate/stale
  zaštita, browser smoke, secret gate i ovaj redigovani evidence.
- Nemanjin pregled Milicinog završnog diff-a: **URAĐENO** (Nemanjina potvrda
  2026-09-28; posebna ponovljena `verify`/security provera nije potvrđena).
- Zajednički šestominutni demo i stvarna potvrda zamene reviewer/driver uloga:
  **NOT RUN**.

## Poznata ograničenja / sledeći gate

Live gate je zatvoren jednim lokalnim i jednim produkcijskim kontrolisanim
pozivom. Nemanja je potvrdio pregled diff-a; njegovo zasebno ponavljanje
`npm.cmd run verify` i security checklist-e nije potvrđeno. Par još treba da
evidentira stvarni zajednički šestominutni demo i zamenu uloga.
