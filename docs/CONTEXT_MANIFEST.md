# Context Manifest — Skyline Stack

**Updated**: 2026-09-21
**Current feature**: `002-crane-tower-gameplay`
**Current branch at audit**: `phase-b/crane-tower-v2`
**Current state**: V2 implemented and verified; project documentation synchronized locally

## Purpose

Ovaj manifest opisuje trenutno stanje projekta. Prethodna verzija opisivala je isključivo kraj Faze A, zbog čega je ispravno tvrdila da README, package manifest, source, testovi, Git i remote tada nisu postojali. Te tvrdnje više nisu aktuelne.

Originalni Phase A snapshot ostaje proverljiv u Git tagu `phase-a-approved` i commitu `fb36c28`. U ovom manifestu i README-u, Session 003 dokumenti i feature 001 artefakti jasno su klasifikovani kao istorijski. Sami zaključani fajlovi ostaju neizmenjeni, pa njihove Phase A statusne rečenice treba čitati kao snapshot tog trenutka, a ne kao opis trenutnog repozitorijuma.

## Current authoritative context

| Izvor | Postoji? | Trenutna uloga | Prioritet | Napomena / rizik |
| --- | --- | --- | --- | --- |
| Aktuelne eksplicitne odluke korisnika | Da | Najnoviji odobreni scope i korekcije | 0 | Ne proširivati implicitno; konflikt koji menja gameplay traži novu odluku |
| `.specify/memory/constitution.md` | Da, v1.0.0 | Governance, dokazivanje, bezbednost i kontrola scope-a | 1 | Ustav ima prednost nad planom i taskovima |
| `docs/GAME_SPEC_V2.md` | Da, v2.0 | Trenutni gameplay, vizuelni, no-lives i scope ugovor | 2 | Kreiran je naknadno radi zatvaranja dokumentacionog propusta; to je eksplicitno zabeleženo |
| `docs/BUILD_PROMPT_V2.md` | Da, v2.0 | Trenutni build/maintenance postupak i zabrane | 2 | Ne sme se predstavljati kao pre-implementation lock |
| `specs/002-crane-tower-gameplay/spec.md` | Da; implemented and verified | User stories, FR-001–FR-020, SC-001–SC-008 i acceptance scenariji | 3 | City Bloxx je samo gameplay inspiracija |
| `specs/002-crane-tower-gameplay/plan.md` | Da | Aktuelna arhitektura, alati i struktura modula | 3 | Grana je `phase-b/crane-tower-v2` |
| Feature 002 research, data model i contracts | Da | Obrazloženje sway/camera/debris odluka i precizni ugovori | 3 | Proceduralni vizuelni sloj; bez tuđih runtime asseta |
| `specs/002-crane-tower-gameplay/tasks.md` | Da; 28/28 završeno | Izvršeni implementacioni redosled i traceability | 4 | Nema otvorenog implementacionog taska |
| `docs/EVALS_V2.md` | Da | Zaključana V2-E1–V2-E6 očekivanja i stvarni rezultati | 2 za V2 evale | V2-E4 proverava odsustvo lives sistema |
| `tests/v2-evals.test.ts` | Da | Izvršna V2-E1–V2-E5 provera | 4 | 5/5 PASS 2026-09-21 |
| `docs/AI_USAGE_LOG.md` | Da | Hronološki zapis Session 003 i naknadnog V2 rada | 4 | Redovi se dodaju; istorijski ishodi se ne prepisuju |
| `package.json` i `package-lock.json` | Da | Autoritet za stvarne scripts i instalirane verzije | 3 za toolchain | TypeScript 7.0.2, Vite 8.3.0, Vitest 5.0.1 |
| `src/` | Da | Autoritet za trenutno implementirano ponašanje | 4 | Framework-free TypeScript/Canvas; nema backend-a |
| `tests/` | Da | Deterministički regression, input, engine i eval testovi | 4 | 9 fajlova / 54 testa PASS pri poslednjoj punoj proveri |
| `README.md` | Da | Kratak korisnički setup/run/verify vodič | 5 | Komande odgovaraju stvarnom `package.json` |
| `artifacts/crane-tower/` | Da | V2 browser screenshot i stvarni smoke rezultat | 4 za vizuelni dokaz | Edge flow PASS; runtime i log errors prazni |
| Git istorija, branch, tag i remote | Da | Autoritet za verzionisano stanje i istorijske checkpoint-e | 4 | `origin` postoji; `phase-a-approved` čuva Phase A snapshot |

## Historical Session 003 context

Sledeći izvori ostaju autoritativni samo za feature 001 / Session 003 istoriju:

| Izvor | Istorijska uloga | Trenutni tretman |
| --- | --- | --- |
| `prompts/prompt_v00.md` | Originalni projektni zadatak | Ne menja se; izvor procesa i prvobitnog scope-a |
| `docs/GAME_SPEC.md` | Core v1 gameplay ugovor | Istorijski odobren i izvršen; zaglavlje “ready for review” je sačuvani Phase A snapshot, ne trenutni status |
| `docs/BUILD_PROMPT_V1.md` | Baseline i one-change build postupak | Istorijski izvršen prompt; zaglavlje “do not execute” je sačuvani pre-implementation checkpoint, ne trenutni nalog |
| `specs/001-skyline-stack-core/` | Spec Kit paket za Core baseline | Istorijski feature 001 paket; “Draft”, planirane komande i slične oznake pripadaju Phase A snapshot-u |
| `docs/EVALS.md` | Zaključani E1–E4 baseline/post-change evali | Rezultatski redovi su izvršeni; početna `NOT RUN` statusna rečenica je sačuvani pre-execution snapshot; konačni dokaz je `docs/EVIDENCE_003.md` |
| `docs/EVIDENCE_003.md` | Baseline, stvarni E4 problem, hipoteza, CSS diff i ponovljeni evali | Tehnički dokaz završen; pair imena i driver/observer aktivnosti ostaju `TBD` |
| `artifacts/session-003/` | Read-only baseline ZIP i pre/posle screenshotovi | Ne prepisivati; baseline ZIP ostaje read-only |
| `docs/AI_USAGE_LOG.md` redovi 1–9 | Stvarni AI tok za Phase A/Core/controlled change | Istorijski log; novi V2 koraci se samo dodaju |

## Current repository facts

- Git repozitorijum postoji.
- Remote `origin` postoji.
- Aktivna razvojna grana je `phase-b/crane-tower-v2` i prati istoimenu remote granu.
- Feature 001 implementacija je sačuvana u commitu `dccbbb9`.
- Feature 002 crane/city implementacija je sačuvana u commitu `90e6259`.
- `README.md`, `package.json`, `package-lock.json`, `index.html`, `src/`, `tests/` i `tsconfig.json` postoje.
- Stvarni npm scripts su `dev`, `build`, `smoke`, `typecheck` i `test`.
- Poslednja puna lokalna provera 2026-09-21: typecheck PASS, 9 test fajlova/54 testa PASS, build PASS.
- V2 browser smoke je stvarno izvršen 2026-09-20 i sačuvan u `artifacts/crane-tower/`.
- Session 003 baseline je `artifacts/session-003/baseline.zip`, 158.941 bajt, read-only, SHA-256 `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`.

## Current implementation map

| Oblast | Stvarna putanja |
| --- | --- |
| Runtime konfiguracija i fallback | `src/game/config.ts` |
| Session/block/debris model | `src/game/model.ts` |
| Overlap i detached geometrija | `src/game/geometry.ts` |
| Crane sway i kabl | `src/game/crane.ts` |
| Debris generisanje i fizika | `src/game/debris.ts` |
| Vertikalna kamera | `src/game/camera.ts` |
| Gameplay state transitions | `src/game/engine.ts` |
| Input gating i restart | `src/game/input.ts` |
| Proceduralni city/building renderer | `src/game/render.ts` |
| DOM/HUD/frame wiring | `src/main.ts` |
| Responsive prikaz | `src/style.css`, `index.html` |
| Determinističke provere | `tests/*.test.ts` |
| Real-browser flow | `tests/browser-smoke.mjs` |

## Included external references

- Zvanična Spec Kit dokumentacija korišćena je za CLI 1.0.8 tok i artefakte.
- Zvanična Vite/Vitest dokumentacija korišćena je za build/test odluke.
- `Example.jpeg`, istorijski screenshot izvori i javni opisi klasične igre korišćeni su samo za vizuelno/gameplay istraživanje.
- **City Bloxx je samo gameplay inspiracija.** Nije autoritet za Skyline Stack scope, kod, UI ili assete.

## Intentionally excluded context

- tuđi game code, sprite-ovi, logo, muzika, zvuk i kopirani vizuelni identitet;
- tajne, tokeni, credential-i, `.env` vrednosti i privatni payload-i;
- backend, baza, hosting i deployment konfiguracija;
- multiplayer, accounts, persistence, leaderboard, named modes i lives sistem;
- `Example.jpeg` kao runtime ili verzionisani asset — fajl je lokalna referenca i nalazi se u `.gitignore`;
- izmišljena pair imena, doprinosi ili role-swap aktivnosti.

## Priority and conflict rules

1. Najnovija eksplicitna ljudska odluka ima prioritet za scope.
2. Constitution ima prioritet za proces, dokaze, bezbednost i zabranu izmišljanja.
3. `docs/GAME_SPEC_V2.md` i feature 002 spec imaju prioritet za trenutno gameplay ponašanje.
4. `docs/BUILD_PROMPT_V2.md` i feature 002 plan imaju prioritet za trenutni build/maintenance tok.
5. `package.json`, lockfile i source imaju prioritet za ono što je stvarno instalirano i implementirano.
6. `docs/EVALS_V2.md` ima prioritet za V2 očekivanja; stvarni command/browser output ima prioritet za rezultat.
7. V1/Session 003 dokumenti ostaju autoritet za sopstvenu istorijsku tačku i ne tumače se kao trenutno stanje.
8. Ako konflikt zahteva promenu gameplay-a, GameConfig šeme, evidence metode ili istorijskog rezultata, rad staje do eksplicitne ljudske odluke.

## Known open information

- Imena dva člana para i njihove stvarne driver/observer aktivnosti nisu dostavljeni; ostaju `TBD` u Session 003 evidence-u.
- Nije izvršen deployment jer nije deo odobrenog scope-a.
- Dokumentacione izmene od 2026-09-21 moraju biti commitovane/pushovane da bi remote odgovarao ovom manifestu.
