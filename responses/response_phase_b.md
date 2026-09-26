# Skyline Stack — Phase B izveštaj

## Status

Tehnički deo Faze B je završen i verifikovan. Završeno je 35 od 36 Spec Kit
taskova. Jedini otvoren task je T034, jer nisu dostavljena imena dva člana para,
njihove stvarne driver/observer aktivnosti i tačke zamene uloga. Zbog toga
Sesija 003 još nije formalno proglašena potpuno završenom.

Rad je vođen prema lokalnom `speckit-implement` postupku: checklist gate,
TDD redosled, fazno izvršenje, baseline pre izmene, jedna hipoteza, jedna
kontrolisana izmena i ponavljanje istih evala.

## Šta je napravljeno

- Framework-free TypeScript/HTML/CSS/Canvas igra sa jednim aktivnim blokom.
- Horizontalno kretanje i odbijanje od ivica, vertikalni drop i overlap trim.
- Score +1 samo posle uspešnog postavljanja, Game Over na promašaj i potpun
  restart preko `R` ili dugmeta.
- Runtime validacija svih sedam `GameConfig` polja, whole-object fallback i
  jedno fiksno bezbedno upozorenje.
- Vite dev/build, odvojeni `tsc --noEmit`, Vitest testovi i lokalni Chromium
  smoke bez Playwright/Cypress zavisnosti.
- README sa samo stvarno potvrđenim komandama.
- Realni baseline, screenshot-ovi, eval rezultati, diff i audit u evidence
  dokumentima.

## Promenjeni i novi fajlovi

Projektni setup:

- `.gitignore`
- `README.md`
- `index.html`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

Implementacija:

- `src/main.ts`
- `src/style.css`
- `src/vite-env.d.ts`
- `src/game/config.ts`
- `src/game/engine.ts`
- `src/game/geometry.ts`
- `src/game/input.ts`
- `src/game/model.ts`
- `src/game/render.ts`

Testovi:

- `tests/browser-smoke.mjs`
- `tests/config.test.ts`
- `tests/engine.test.ts`
- `tests/evals.test.ts`
- `tests/geometry.test.ts`
- `tests/input.test.ts`

Evidence i task praćenje:

- `docs/AI_USAGE_LOG.md`
- `docs/EVALS.md`
- `docs/EVIDENCE_003.md`
- `specs/001-skyline-stack-core/tasks.md`
- `artifacts/session-003/baseline.png`
- `artifacts/session-003/baseline-extracted.png`
- `artifacts/session-003/post-change.png`
- `artifacts/session-003/baseline.zip`

Lokalni izveštaj:

- `responses/response_phase_b.md` — folder `responses/` je u `.gitignore` i
  ovaj fajl neće ući u commit.

Zaključani prompt, `GAME_SPEC.md`, `BUILD_PROMPT_V1.md`, context manifest,
constitution, spec, plan, contracts i gameplay pravila nisu menjani.

## Stvarne komande i rezultati

### Setup i zavisnosti

- `npm.cmd ping --loglevel verbose --fetch-timeout=10000 --fetch-retries=0`
  — exit 1, `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
- `$env:NODE_OPTIONS='--use-system-ca'; npm.cmd ping ...`
  — exit 0, registry `PONG`; TLS verifikacija nije isključena.
- `$env:NODE_OPTIONS='--use-system-ca'; npm.cmd install --save-dev --save-exact vite typescript vitest`
  — exit 0, dodato 39 paketa, auditirano 40, 0 ranjivosti.
- Pinovane verzije: TypeScript 7.0.2, Vite 8.3.0, Vitest 5.0.1.

### TDD signali

- Prvi US1 `npm.cmd test` — exit 1; četiri suite-a pala jer moduli još nisu
  postojali.
- US2 pre implementacije — exit 1; 14 testova prošlo, dva restart testa pala.
- US3 pre implementacije — exit 1; 16 testova prošlo, 21 validator test pao.
- Kompletan baseline `npm.cmd test` — exit 0; 5 fajlova, 37/37 testova.

### Finalni gate-ovi

- `npm.cmd run typecheck` — exit 0, bez TypeScript grešaka.
- `npm.cmd test` — exit 0, 5 test fajlova i 37/37 testova.
- `npm.cmd run build` — exit 0, 11 modula transformisano, build 210 ms pri
  poslednjem prolazu.
- `npm.cmd run dev -- --host 127.0.0.1` — Vite ready na
  `http://127.0.0.1:5173/`.
- `npm.cmd run smoke -- http://127.0.0.1:5173/ artifacts/session-003/post-change.png`
  — exit 0; Ready 0 → Playing 1 → Game Over 1 → Ready 0; bez JavaScript
  izuzetaka.

Prvi smoke pokušaj je izvršio ceo tok i napravio screenshot, ali je završio
exit 1 zato što je evidence helper prerano brisao privremeni Chrome profil.
Cleanup helper je stabilizovan pre arhiviranja baseline-a; gameplay/layout kod
tada nije menjan.

## Baseline

- Arhiva: `artifacts/session-003/baseline.zip`
- Veličina: 158.941 bajt
- Broj ulaza: 67
- Read-only: `True`
- SHA-256:
  `AB531FCFD7277167B49368346FC4044A1EEB7E6FA54C019EEF512206A691123E`
- Isključeno: `.git/`, `node_modules/`, `dist/`, sopstveni
  `artifacts/session-003/` i mašinski `.specify/feature.json`.
- Nezavisna reprodukcija: 67 fajlova izvučeno u poseban temp direktorijum;
  fresh install exit 0; E1–E3 3/3 PASS; E4 ponovljivo FAIL; temp kopija je
  zatim uklonjena.

Prvi archive pokušaj je proizveo prazan ZIP od 22 bajta zato što Windows
PowerShell 5.1 nema `Path.GetRelativePath`. Taj fajl je provereno uklonjen i
nikada nije tretiran kao baseline. Validna arhiva je zatim napravljena
kompatibilnim fail-fast postupkom.

## Baseline E1–E4

| Eval | Baseline rezultat |
| --- | --- |
| E1 | PASS — kretanje, overlap trim, score 0→1 i jedan sledeći moving blok |
| E2 | PASS — tačno 8 jedinica (`minOverlap`) prihvaćeno, score +1 |
| E3 | PASS — nevalidan config odbačen kao celina; fresh defaults; jedno fiksno upozorenje; igra ostaje playable |
| E4 | FAIL — na 1280×1002 viewport-u canvas je bio 826×1101.328 px; `bottom=1231.594 > 1002`; donji deo igre i footer zahtevali su scroll |

Baseline screenshot-ovi su `baseline.png` i nezavisno reprodukovani
`baseline-extracted.png`.

## Tvrdnja, signal i jedna hipoteza

```text
Tvrdnja: Baseline uvećava canvas iznad visine zaključanog desktop viewport-a,
pa kompletan toranj i footer nisu zajedno vidljivi bez skrolovanja.

Signal: Dva Chromium smoke prolaza izmerila su canvas 826×1101.328 px,
top 130.266, bottom 1231.594 i viewportHeight 1002.

Hipoteza: `.play-area` koristi punu širinu šireg kontejnera, a
`canvas { width: 100% }` zato proporcionalno uvećava 480×640 canvas.
```

## Planirani i stvarni kontrolisani diff

Planirana je jedna deklaracija u jednom implementacionom fajlu:

```diff
 .play-area {
+  width: min(100%, 30rem);
   margin: 1.5rem auto;
 }
```

Stvarno je napravljena upravo ta semantička izmena u `src/style.css`.
Poređenje kompletnog `src/` direktorijuma sa izdvojenim baseline-om pokazalo je
samo tu deklaraciju; alat je još normalizovao završni prazan red bez promene
ponašanja. Baseline ZIP je ostao read-only i hash mu se nije promenio.

## Post-change E1–E4

| Eval | Post-change rezultat |
| --- | --- |
| E1 | PASS — identični test i browser score transition |
| E2 | PASS — identični boundary scenario |
| E3 | PASS — identični fallback scenario |
| E4 | PASS — canvas 474×632 px; `bottom=762.266 <= viewportHeight=1002`; kompletan play area i footer vidljivi |

Post-change dokaz je `artifacts/session-003/post-change.png`.

## Poznata ograničenja

- Dev-server smoke i pre i posle izmene beleži jedan non-fatal 404 resource log
  entry; JavaScript izuzetaka nema. Ovaj 404 nije bio cilj zaključane promene.
- Realni responsive dokaz pokriva zaključani Chrome viewport 1280×1002, ne
  široku matricu stvarnih uređaja i browsera.
- Klik/tap ekvivalencija je pokrivena determinističkim input testovima; realni
  smoke koristi Space i `R`.

## Definition of Done

Core GAME_SPEC stavke su proverene: browser start, Canvas/HUD, kretanje, input
gating, vertikalni pad, overlap trim, score, boundary, Game Over, restart,
GameConfig i fallback, četiri evala, immutable baseline, jedan realni baseline
FAIL, jedna hipoteza, jedna kontrolisana izmena i isti eval skup pre/posle.

Evidence gate-ovi su takođe provereni: arhiva/hash, stvarne komande i output,
screenshot-ovi, TDD statusi, E1–E4, planned/actual diff, reprodukcija, secret
scan bez pogodaka, bez multiplayer/backend/database/deployment/Session 004
proširenja.

Formalno nisu završene samo ove dve ljudske stavke:

- doprinos oba člana para;
- stvarne driver/observer zamene uloga.

Poznata ljudska akcija je da je requester kreirao i push-ovao
`phase-b/skyline-stack-core`, ali to nije dovoljno da se imena, obe uloge i
zamene uloga izvedu bez izmišljanja.

## Potreban poslednji podatak

Za zatvaranje T034 potrebni su: imena oba člana, ko je bio driver/observer u
Phase A i Phase B blokovima, šta je svako stvarno uradio/proverio i kada su
zamenjene uloge.
