# Context Manifest — Skyline Stack Session 003

**Date**: 2026-09-20  
**Phase**: A — specification and planning  
**Rule**: Presence, inclusion, and priority reflect the filesystem at the end of
Phase A, before any application implementation.

| Izvor | Uključen? | Zašto? | Prioritet | Rizik |
| ----- | --------- | ------ | --------- | ----- |
| `prompts/prompt_v00.md` / projektni zadatak | Da; postoji i verifikovan je prema prilogu | Izvor cilja, redosleda, zabrana i dokaznih zahteva | 0 za nameru i proces | Vrlo širok; pogrešno prepričavanje bi promenilo scope |
| `docs/GAME_SPEC.md` | Da; Phase A lock kandidat | Autoritet za gameplay, UX, scope i Definition of Done | 1 | Ne sme se menjati tokom baseline/fix ciklusa |
| `docs/BUILD_PROMPT_V1.md` | Da; Phase A lock kandidat | Autoritet za dozvoljeni implementacioni rad i verifikaciju | 2 | Izvršenje pre odobrenja bi prekršilo checkpoint |
| `.specify/memory/constitution.md` | Da; v1.0.0 | Upravlja procesom, dokazima, minimalnim scope-om i bezbednošću | 2 za governance | Privremeni Sync Impact Report ostaje za ljudski review |
| Spec Kit specification: `specs/001-skyline-stack-core/spec.md` | Da; postoji | Tehnološki neutralno ponašanje, priče, zahtevi i kriterijumi uspeha | 3 | Jednostavan viewport shift je dokumentovana pretpostavka |
| Spec Kit technical plan: `specs/001-skyline-stack-core/plan.md` | Da; postoji | Dogovorena tehnička struktura i alati | 3 za strukturu | Planirane komande nisu dokaz da su izvršene |
| Spec Kit tasks: `specs/001-skyline-stack-core/tasks.md` | Da; postoji | Zavisno uređen rad Faze B i evidence ciklus | 4 | T031 ciljna putanja namerno se bira tek nakon stvarnog E4 |
| Spec Kit research, data model i contracts | Da; postoje | Obrazloženje alata, stanja, GameConfig i gameplay ugovora | 4 | Dizajn još nema runtime dokaz |
| `docs/EVALS.md` | Da; sva izvršenja su NOT RUN | Zaključava E1–E3 i čuva E4 kao TBD pre baseline-a | 2 za eval očekivanja | Rezultati se ne smeju popuniti iz očekivanja |
| `docs/EVIDENCE_003.md` | Da; Phase A template | Mesto za stvarne komande, baseline, evale, diff i doprinose | 4 | Većina Faze B polja je NOT RUN ili TBD |
| `docs/AI_USAGE_LOG.md` | Da; početni log | Beleži ciljeve, signale i ishode AI koraka bez chain-of-thought | 4 | Token/cost podatak nije dostupan |
| `README.md` | Ne postoji | Nastaje u Fazi B tek sa stvarno potvrđenim komandama | 5 kada nastane | Izmišljena komanda bi bila lažan dokaz |
| `package.json` i lockfile | Ne postoje | Nastaju u minimalnom setup-u Faze B | 5 kada nastanu; tada su autoritet za komande i verzije | Verzije i scripts trenutno nisu činjenice |
| Relevantni `src/` fajlovi | Ne postoje | Implementacija je zabranjena u Fazi A | 5 kada nastanu | Planirana stabla nisu stvarni fajlovi |
| Relevantni `tests/` fajlovi | Ne postoje | Test implementacija je zabranjena u Fazi A | 5 kada nastanu | Planirani testovi nisu pokrenuti rezultati |
| Stari chat transcript | Ne | Nije dostavljen niti potreban | Nije autoritativan | Može sadržati zastarele ili konfliktne odluke |
| Slučajni web primeri | Ne | Nisu korišćeni za scope ili gameplay | Nije autoritativan | Kopiranje može proširiti scope ili tuđi identitet |
| Zvanična Spec Kit dokumentacija | Da, samo za CLI instalaciju/inicijalizaciju | Potvrđuje aktuelnu v1.0.8 sintaksu i Codex integraciju | Tehnički pomoćni izvor | Ne može promeniti projektni scope |
| Zvanična Vite/Vitest dokumentacija | Da, samo u `research.md` | Potvrđuje potrebe build/test alata i odvojen typecheck | Tehnički pomoćni izvor | Verzije se biraju i beleže tek pri stvarnoj instalaciji |
| Kod i asset-i postojeće igre | Ne | Zabranjeni su kopirani kod, asset-i i identitet | Nije autoritativan | Autorska prava i gubitak originalnosti |
| Tajne, credential-i, privatni tokeni, `.env` vrednosti | Ne | Nisu potrebni i namerno su izostavljeni | Nikada nisu kontekst | Curenje privatnih podataka |
| Git istorija, branch i remote | Ne postoje | Git ekstenzija nije uključena; remote je zabranjen | Nije primenljivo | Ne sme se tvrditi da baseline ima commit/tag |

## Šta je model stvarno dobio?

- kompletan korisnički projektni zadatak iz priloženog tekstualnog fajla;
- stvarno stanje prvobitno praznog projektnog foldera;
- lokalno generisane Spec Kit 1.0.8 template-e, skillove i Phase A artefakte;
- lokalne verzijske signale za Git 2.53, Node 24.20, Python 3.11 i Spec Kit 1.0.8;
- zvaničnu Spec Kit, Vite i Vitest dokumentaciju korišćenu samo za promenljive
  tehničke odluke;
- fajlove navedene kao uključene u gornjoj tabeli.

Model nije dobio starter, postojeći izvorni kod, testove, package manifest,
baseline, screenshot igre, komande projekta, rezultate projekta ili podatke o
imenima i stvarnim doprinosima članova para.

## Šta je namerno izostavljeno?

- stari chat i slučajni web primeri;
- tuđi game code, asset-i, muzika, logo i vizuelni identitet;
- bilo koji backend, baza, hosting ili deployment kontekst;
- tajne, `.env`, credential-i, privatni URL-ovi i nepotrebni privatni payload-i;
- funkcionalnosti izvan Core-a i Sesije 003;
- nepostojeći README, package manifest, source, testovi i rezultati.

## Pravila prioriteta i konflikta

1. `docs/GAME_SPEC.md` ima prioritet za gameplay, UX i scope.
2. `docs/BUILD_PROMPT_V1.md` ima prioritet za dozvoljeni implementacioni rad.
3. Spec Kit plan ima prioritet za dogovorenu tehničku strukturu.
4. Kada nastanu, stvarni `package.json`, lockfile i konfiguracija imaju
   prioritet za postojeće komande i instalirane verzije.
5. `docs/EVALS.md` ima prioritet za zaključana očekivanja; stvarni output ima
   prioritet za rezultate.
6. Ako konflikt menja scope, gameplay pravilo, GameConfig šemu ili evidence
   metod, rad se zaustavlja i traži se ljudska odluka.
7. Stari chat, slučajni web primeri i kod postojeće igre nisu autoritativni.

