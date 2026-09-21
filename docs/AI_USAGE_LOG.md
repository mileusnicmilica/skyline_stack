# AI Usage Log — Skyline Stack

Rows 1–9 record Session 003 and its controlled baseline change. Later rows
record the separately approved Crane Tower V2 feature and documentation
synchronization. Historical results are retained as originally measured.

|  # | Faza | Zašto je AI pozvan | Šta se očekivalo | Rezultat | Sledeća odluka |
| -: | ---- | ------------------ | ---------------- | -------- | -------------- |
| 1 | Intake i planiranje | Sačuvati originalni prompt, proveriti prazno početno stanje i objasniti kontrolisan SDD tok | Identična prompt kopija; plan bez implementacije; jasan uslov za Spec Kit | Prompt kopija ima isti broj bajtova i SHA-256; početno stanje pregledano; plan saopšten | Instalirati pinovani zvanični Spec Kit uz odobrenje |
| 2 | Spec Kit inicijalizacija | Instalirati CLI i inicijalizovati Codex/PowerShell scaffold bez Git-a | CLI 1.0.8; `.specify/` i `.agents/skills/`; bez `.git` | Instalacija i init exit 0; tražene putanje kreirane; `.git ABSENT` | Pokrenuti constitution |
| 3 | Constitution | Pretvoriti template u testabilna governance pravila za scope, dokaze, config i jednu izmenu | v1.0.0 bez placeholdera i bez aplikacionih fajlova | Constitution v1.0.0 kreiran; placeholder scan NONE | Pokrenuti specify |
| 4 | Specify + clarify | Definisati korisničke priče, zahteve, edge slučajeve i merljive ishode; proveriti nejasnoće | Spec + checklist; bez kritičnih otvorenih pitanja | `spec.md` i checklist kreirani; 16/16; clarify postavio 0 pitanja | Napraviti tehnički plan |
| 5 | Plan | Izabrati najmanji setup, model, contracts, quickstart i baseline metod | Plan bez gate prekršaja i bez implementacije | Vite/Vitest obrazloženi zvaničnim izvorima; plan, research, model, contracts i quickstart kreirani | Napraviti task listu |
| 6 | Tasks + Phase A docs | Napraviti zavisno uređene taskove i obavezne dokumente sa poštenim NOT RUN/TBD statusima | Validan tasks format; zaključiv scope/prompt/context/evals/evidence/log | 36 taskova; 0 format grešaka; šest docs artefakata kreirano | Ljudski review i eksplicitno odobrenje Faze A |
| 7 | Baseline implementacija | Izvršiti odobrene T001–T029 bez proširenja Core scope-a | Runnabilan baseline, TDD signal, stvarne komande, browser dokaz i read-only ZIP | TypeScript/Canvas Core napravljen; 37/37 testova, typecheck/build/dev prolaze; realni Chrome tok izvršen; read-only ZIP `AB531F…123E`; E4 viewport problem ponovljen iz izdvojene kopije | Zaključati jednu hipotezu i planirani one-file CSS diff |
| 8 | Ciljana izmena | Ispraviti samo zaključani E4 viewport problem | `canvas.bottom <= viewportHeight` uz nepromenjene E1–E3 i baseline hash | U `src/style.css` dodat `width: min(100%, 30rem);`; E4 prešao sa 1231.594/1002 FAIL na 762.266/1002 PASS; E1–E3 ostali PASS | Izvršiti kompletne gate-ove i diff/scope audit |
| 9 | AI pregled diff-a | Proveriti da je promenjena samo unapred odobrena implementaciona oblast | Poređenje sa izdvojenim baseline-om pokazuje samo planirani CSS declaration | `src/` poređenje pokazuje samo jednu semantičku CSS izmenu; baseline ZIP hash i read-only atribut su nepromenjeni; typecheck, 37/37 testova, build i browser smoke prolaze | Završiti evidence audit; ljudske pair podatke ostaviti TBD dok ne budu dostavljeni |
| 10 | V2 specifikacija i plan | Prevesti odobreni crane/city zahtev u zasebnu funkcionalnost bez menjanja Session 003 dokaza | Novi `002` Spec Kit paket sa jasnim gameplay, vizuelnim i original-asset granicama | Kreirani su spec, plan, research, data model, ugovori, quickstart, checklist i 28 taskova; City Bloxx je označen isključivo kao gameplay inspiracija | Implementirati V2 na posebnoj grani |
| 11 | Crane Tower V2 implementacija | Dodati kran, njihanje, vertikalni pad, odlamanje viška, kameru i proceduralni gradski izgled | Igriva originalna V2 petlja uz očuvane konfiguracione i baseline ugovore | Implementacija završena; typecheck i build prolaze; prvobitni V2 skup prošao je 49/49 testova; lokalni browser smoke i screenshot potvrđeni | Zatvoriti nedostajuću V2 dokumentaciju i eksplicitne evale |
| 12 | V2 dokumentaciono zatvaranje | Napraviti obećane V2 game/build dokumente i merljive evale | `GAME_SPEC_V2`, `BUILD_PROMPT_V2`, `EVALS_V2` i izvršivi V2 eval testovi | Fokusirani V2 evali prošli su 5/5; kompletan skup prošao je 9 test datoteka i 54/54 testa; typecheck i build ostali PASS | Uskladiti sve projektne dokumente sa stvarnim stanjem repozitorijuma |
| 13 | Dokumentaciona sinhronizacija | Pronaći i ispraviti zastarele tvrdnje o nepostojećem Git-u, source-u, testovima i runtime dokazima | Trenutni manifest i README moraju opisivati V2, dok zaključani V1/Session 003 fajlovi ostaju neizmenjeni | `CONTEXT_MANIFEST.md`, README, V2 reference, AI log i rezultati su usklađeni; lokalni linkovi, typecheck, 54/54 testova i build prolaze; baseline hash/read-only stanje i istorijski sadržaj su nepromenjeni | Commitovati i pushovati dokumentacioni paket kada ga par odobri |

## Usage Data

Usage podatak nije dostupan u korišćenom okruženju.

Nisu zabeleženi privatni chain-of-thought, token procene ili izmišljeni troškovi.

## Ongoing Logging Rule

Za svaki naredni veći AI poziv dopuniti stvarni cilj, očekivani signal, stvarni
rezultat i sledeću odluku. Ako poziv nije izvršen, red ostaje `NOT RUN`.

