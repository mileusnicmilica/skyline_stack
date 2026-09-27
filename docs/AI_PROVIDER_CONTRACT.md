# AI Crane Coach provider contract

- **Provider:** Google Gemini API
- **Model:** `gemini-3.1-flash-lite` (stable model ID, provereno 2026-09-26)
- **Razlog izbora:** kratak savet iz već izračunatih činjenica je jednostavan
  structured-output zadatak; Flash-Lite je dovoljan i jeftiniji od većih
  modela. Zvanična cena pri proveri: USD 0.25 / 1M text input tokena i USD
  1.50 / 1M output tokena na paid tier-u.
- **Endpoint:** Gemini `generateContent`; ključ ide u `x-goog-api-key` header,
  nikada u URL, browser ili odgovor.
- **Input providera:** samo `RunStatistics` agregati i kratko pravilo igre.
- **Output:** JSON objekat sa `headline`, `timingBias`, obaveznim numeričkim
  `biggestMistakeFloor` i `tip`.
- **Structured output:** `responseMimeType: application/json` i eksplicitna
  JSON šema koja koristi Gemini podržani podskup. Dužine stringova se namerno
  sprovode nezavisnom backend runtime proverom, jer provider šema ne podržava
  `minLength`/`maxLength`; backend proverava i semantiku.
- **Ukupni rok:** 10 sekundi; pojedinačni attempt je ograničen na 4.5 sekunde.
- **Retry:** najviše dva attempt-a ukupno, sa 250 ms backoff-om. Retry važi
  samo za mrežnu grešku, HTTP 429 ili HTTP 5xx dok ukupni rok traje.
- **Bez retry-a:** invalidan lokalni input, HTTP 400/403, nepostojeći kandidat,
  malformed JSON, pogrešna šema ili semantički netačan odgovor.
- **Fallback:** stabilan `503` sa porukom `AI analiza trenutno nije dostupna.`;
  osnovna igra i Restart ostaju dostupni. Nema drugog modela/providera.
- **Secret:** `.env` samo lokalno na serveru; `.env.example` ima praznu
  vrednost. Dozvoljeno ime je `GEMINI_API_KEY`, nikada `VITE_*`.
- **Usage zapis:** provider, model, timestamp, latencija, ishod, pokušaji i
  token usage kada ga Gemini vrati; nema ključa, prompta, request loga ni
  sirovog provider odgovora.

Zvanični izvori provereni 2026-09-26:

- https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
