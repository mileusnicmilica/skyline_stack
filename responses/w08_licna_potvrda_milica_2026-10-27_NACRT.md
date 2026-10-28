# W08 lična potvrda — Milica (nacrt sa naknadno potvrđenim demo zapisom)

**Status 27.10.2026:** Milica Mileusnić se u ovom razgovoru identifikovala i izričito odobrila W08 `spec.md`, `plan.md`, `tasks.md` i ovaj nacrt. Dozvolila je njegovo doterivanje. Nacrt je sastavljen iz W08 dokumentacije i lokalnih izlaza Codexa. Odobrenje teksta ne popunjava neizrečene lične radnje, rezultate i objašnjenja niti je potpis ili završna evidencija.

**Datum zajedničke probe koji je Nemanja prijavio:** 27.10.2026.

**Commit ranije lokalno proverenog koda:** `f10e7dcde5865e5a94f8267017259c8ae25520d0` (W08 tehnički checkpoint: `bc7de67`).

**Milicino puno ime:** Milica Mileusnić, potvrđeno u razgovoru. **Vreme njene lične provere:** nije navedeno.

## Dokumenti i doprinos

U poruci od 27.10.2026. Milica je izričito odobrila W08 `spec.md`, `plan.md` i `tasks.md` bez navedenih primedbi. Nemanjino zasebno odobrenje dokumentovano je u njegovom nacrtu.

Prema [handoff-u](../specs/005-secure-the-arcade/handoff-milica-nemanja.md), Milica je vodila HTTP/browser blok. Njen naknadno zabeležen konkretan doprinos 28.10.2026. jeste izbor zaštite koja zatvara telo neuspešnog Gemini HTTP odgovora pre retry-ja u `server/providers/gemini-agent-provider.ts`, uz odluku da se dodaju negativne 429/503 regresije u `tests/server/w08-provider.test.ts` i `tests/server/w08-admission.test.ts`. Zatražila je i puni API/browser `verify` tok u CI. Codex je napisao kod i testove; ovo je doprinos kroz izbor pravila, usmeravanje i proveru ishoda, a ne tvrdnja da je Milica lično kucala implementaciju.

Njen izabrani negativan scenario proverava da HTTP 429/503 response body bude otkazan pre sledećeg pokušaja; ako otkazivanje ne uspe, retry se ne pokreće. Zaseban admission test drži otkazivanje otvorenim, proverava 504, zauzet slot, 429 za višak zahteva i oporavak 200 po oslobađanju. T01/T02 je dodatni HTTP/browser primer: `maxSteps: 99` daje 400/`INVALID_REQUEST`, provider 0 i tool 0, jer klijent ne bira serverov budžet.

**Predlog kako Milica može da opiše svoj blok, uz proveru pre konačne predaje:** „Za svoj HTTP/browser blok prihvatam pravilo da zahtev sa dodatnim poljem `maxSteps` ili drugim poljem koje bira serverovu politiku bude odbijen pre poziva providera i alata. Kao negativan primer biram T01/T02: nevalidan zahtev dobija 400/`INVALID_REQUEST`, a brojači provider i tool poziva ostaju nula. Codex je pisao i pokretao kod i testove; ne tvrdim da sam ih sama napisala ili da sam lično pokrenula komande koje su navedene ispod.“ Ovo je predlog formulacije zasnovan na odobrenom nacrtu i proverljivom testu, a ne naknadno izmišljena istorija ličnog rada.

## Lokalni rezultat koji Milica može da ponovi

Codex je na ovom računaru 27.10.2026. uz `AI_COACH_PROVIDER=fake` pokrenuo `npm.cmd ci` (izlaz 0), `npm.cmd run test:security:w08` (izlaz 0, **46/46 W08**), i `npm.cmd run verify` (ponovljena komanda van sandbox-a: izlaz 0, **207/207**, build, Edge browser). Prvi sandbox pokušaj `verify` imao je `uv_os_get_passwd returned ENOMEM` pri startovanju lokalnog API-ja nakon prolaska testova i build-a. Ta greška nije prećutana niti pripisana aplikaciji.

Izdvojeni T01/T02 HTTP test koji je pokrenuo Codex: `npm.cmd test -- tests/server/w08-http.test.ts -t 'T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work'` — izlaz 0, 1 izabran test prošao, 8 preskočenih. W08 Edge provera: `dangerousNodeCount=0`, `xssExecuted=false`, stvarni CSP blok `script-src 'self'` za dostupan strani skript; normalna igra i srpski tekst prikazani. **Ovo nisu Milicine lično pokrenute komande.** Ona treba da unese svoje komande, izlazne kodove i brojeve ako je lično izvodila proveru.

## Zajednička proba — Nemanjina potvrda

Nemanja je potvrdio da su 27.10.2026. održali osmominutni demo i zamenu uloga prema [vodiču](../specs/005-secure-the-arcade/demo-guide.md): Milica je vodila HTTP/browser deo, Nemanja agent/tool deo, pa su zamenili uloge. Dana 28.10. potvrdio je da su prikazali uspeh 200/provider 2/tool 1, HTTP odbijanje 400/provider 0/tool 0 i agent odbijanje 503/provider 1/tool 0 ili ekvivalentne testove. Preneo je Milicinu potvrdu da je posle zamene uloga objasnila zatvorenu `evaluate_drill` proveru: `constructor`/`read_file` dobija `unknown_tool` pre `runTool`, posle jedne fake provider odluke, bez izvršenog alata i promene ulazne partije. Codex je 28.10. nezavisno ponovio tri sintetička traga komandom `npm.cmd run evidence:w08`; taj novi skript nije bio deo demoa održanog dan ranije.

**Status:** T001, T030 i T032 zatvoreni su u [W08 evidence](../docs/EVIDENCE_W08.md) na osnovu tehničkih rezultata i prijavljenih/potvrđenih radnji para. Ovaj dokument i dalje nosi oznaku `NACRT` jer Milica treba da pregleda svoju punu ličnu formulaciju pre korišćenja kao potpisanu potvrdu; Codexove komande nisu predstavljene kao njene lično pokrenute komande.
