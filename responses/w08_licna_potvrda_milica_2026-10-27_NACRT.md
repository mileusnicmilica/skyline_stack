# W08 lična potvrda — Milica (odobren nacrt, čeka lične detalje)

**Status 27.10.2026:** Milica Mileusnić se u ovom razgovoru identifikovala i izričito odobrila W08 `spec.md`, `plan.md`, `tasks.md` i ovaj nacrt. Dozvolila je njegovo doterivanje. Nacrt je sastavljen iz W08 dokumentacije i lokalnih izlaza Codexa. Odobrenje teksta ne popunjava neizrečene lične radnje, rezultate i objašnjenja niti je potpis ili završna evidencija.

**Datum zajedničke probe koji je Nemanja prijavio:** 27.10.2026.

**Commit ranije lokalno proverenog koda:** `f10e7dcde5865e5a94f8267017259c8ae25520d0` (W08 tehnički checkpoint: `bc7de67`).

**Milicino puno ime:** Milica Mileusnić, potvrđeno u razgovoru. **Vreme njene lične provere:** nije navedeno.

## Dokumenti i doprinos

U poruci od 27.10.2026. Milica je izričito odobrila W08 `spec.md`, `plan.md` i `tasks.md` bez navedenih primedbi. Nemanjino zasebno odobrenje dokumentovano je u njegovom nacrtu. Milica kaže da ju je Nemanja ovlastio da potvrdi i njegov nacrt.

Prema [handoff-u](../specs/005-secure-the-arcade/handoff-milica-nemanja.md), Milica je vodila HTTP/browser blok. Kao konkretan doprinos zaštiti može da potvrdi pravilo u `server/index.ts` i `server/agent/validate-request.ts` koje odbija nepoznata/politička polja u ulaznom zahtevu pre provider i tool rada, uz ograničenje veličine tela, prijemnog vremena i lokalni admission u `server/rate-limit.ts`/`server/admission.ts`. U browser delu [W08 evidence](../docs/EVIDENCE_W08.md) beleži tekstualni prikaz i CSP. Neka označi **koje je od tih pravila ona lično izabrala, tražila, pregledala i proverila**; dokumentovana raspodela posla sama po sebi ne dokazuje to.

Kao odgovarajući negativan test može da potvrdi `T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work` u `tests/server/w08-http.test.ts`. Test šalje sintetičke nevalidne zahteve direktno lokalnom HTTP handleru, uključujući `role`, `model`, `provider`, `ownerId`, `resourceId` i `maxSteps: 99`; za svaki očekuje HTTP 400 i `INVALID_REQUEST`, zatim proverava **nula provider i nula tool poziva**. Neka Milica potvrdi šta je lično odlučila ili pregledala u ovom negativnom testu. Codex je, prema evidenciji, pisao W08 kod i testove uz ljudsko usmeravanje; samo izvršavanje postojećeg testa nije dokaz autorstva.

**Predlog kako Milica može da opiše svoj blok, uz proveru pre konačne predaje:** „Za svoj HTTP/browser blok prihvatam pravilo da zahtev sa dodatnim poljem `maxSteps` ili drugim poljem koje bira serverovu politiku bude odbijen pre poziva providera i alata. Kao negativan primer biram T01/T02: nevalidan zahtev dobija 400/`INVALID_REQUEST`, a brojači provider i tool poziva ostaju nula. Codex je pisao i pokretao kod i testove; ne tvrdim da sam ih sama napisala ili da sam lično pokrenula komande koje su navedene ispod.“ Ovo je predlog formulacije zasnovan na odobrenom nacrtu i proverljivom testu, a ne naknadno izmišljena istorija ličnog rada.

## Lokalni rezultat koji Milica može da ponovi

Codex je na ovom računaru 27.10.2026. uz `AI_COACH_PROVIDER=fake` pokrenuo `npm.cmd ci` (izlaz 0), `npm.cmd run test:security:w08` (izlaz 0, **46/46 W08**), i `npm.cmd run verify` (ponovljena komanda van sandbox-a: izlaz 0, **207/207**, build, Edge browser). Prvi sandbox pokušaj `verify` imao je `uv_os_get_passwd returned ENOMEM` pri startovanju lokalnog API-ja nakon prolaska testova i build-a. Ta greška nije prećutana niti pripisana aplikaciji.

Izdvojeni T01/T02 HTTP test koji je pokrenuo Codex: `npm.cmd test -- tests/server/w08-http.test.ts -t 'T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work'` — izlaz 0, 1 izabran test prošao, 8 preskočenih. W08 Edge provera: `dangerousNodeCount=0`, `xssExecuted=false`, stvarni CSP blok `script-src 'self'` za dostupan strani skript; normalna igra i srpski tekst prikazani. **Ovo nisu Milicine lično pokrenute komande.** Ona treba da unese svoje komande, izlazne kodove i brojeve ako je lično izvodila proveru.

## Zajednička proba — Nemanjina potvrda

Nemanja je potvrdio da su 27.10.2026. održali osmominutni demo i zamenu uloga prema [vodiču](../specs/005-secure-the-arcade/demo-guide.md): Milica je vodila HTTP/browser deo, Nemanja agent/tool deo, pa su zamenili uloge. Tačne osporene varijante i izlazi viđeni tokom njihovog demoa nisu dostavljeni u ovom razgovoru. Codexovi lokalni testovi istog commita daju proverljiv uspešan T00 trag (HTTP 200, 2 provider odluke, 1 tool), HTTP T01/T02 odbijanje (400, provider/tool 0) i agent T07/T09 odbijanje (`unknown_tool`, provider 1, tool 0). Milica treba svojim rečima da potvrdi svoju ulogu, opažene tragove i objasni Nemanjinu agent kontrolu nakon zamene uloga.

**Za završnu evidenciju i zatvaranje T030/T032:** zabeležiti Milicin stvarni lični rad na zaštiti i negativnom testu, AI pomoć i njen pregled, samo stvarno lično pokrenute komande/rezultate i njeno objašnjenje obe kontrole. Odobrenje dokumenata za T001 je potvrđeno; ovaj nacrt se još ne šalje kao završna lična potvrda.
