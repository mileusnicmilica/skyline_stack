# W04 provider usage log

Ovo je provider evidencija, odvojena od `docs/AI_USAGE_LOG.md`, koji beleži
razvojnu upotrebu AI asistenta.

## Verifikacija 2026-09-26

| Provider/model | Put | Pozivi | Ishod | Attempts | Tokeni | Cena |
| --- | --- | ---: | --- | ---: | --- | --- |
| `fake/deterministic-v1` | production proxy contract | 1 | success | 1 | nije dostupno | USD 0 |
| `fake/deterministic-v1` | Edge browser Game Over analiza | 1 | success | 1 | nije dostupno | USD 0 |
| `gemini/gemini-3.1-flash-lite` | live Game Over analiza | 1 | success, 1.459 s | 1 | 156 input + 74 output = 230 | USD 0.000150 list-price ekvivalent |

Live zapis: `2026-09-26T21:43:15.121Z`. Obračun prema cenama proverеним tog
dana: `156 × 0.25 / 1,000,000 + 74 × 1.50 / 1,000,000 = USD 0.000150`.
Stvarno zaduženje naloga može biti USD 0 ako je poziv bio u free tier-u;
provider usage odgovor ne sadrži billing status.

Automatski runtime zapis sadrži samo provider, model, ISO timestamp,
latenciju, ishod, broj pokušaja i token usage kada postoji. Ne sadrži secret,
prompt, run log ili sirov provider payload.
