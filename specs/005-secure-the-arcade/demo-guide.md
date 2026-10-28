# W08 — lična provera i osmominutni demo

Ovo je pripremljen vodič za Milicu i Nemanju. Obe odluke o W08 dokumentima i planirana zamena uloga zabeležene su kao T001; tehnička evidencija i pripisani doprinosi zatvaraju T030. Par je potom potvrdio održan demo, tri ishoda, stvarnu zamenu uloga i individualna objašnjenja; njihov zapis u [EVIDENCE_W08.md](../../docs/EVIDENCE_W08.md) zatvara T032. Ovaj vodič ostaje scenario za ponavljanje i sam po sebi nije dokaz izvođenja.

## 1. Priprema na oba računara

Otvorite PowerShell iz svog postojećeg klona repozitorijuma. Sledeće komande rade iz bilo kog podfoldera klona, pa Milica i Nemanja ne moraju da imaju istu Windows putanju:

```powershell
$w08RepoRoot = git rev-parse --show-toplevel
if ($LASTEXITCODE -ne 0) { throw 'Otvori terminal iz klona skyline_stack.' }
Set-Location -LiteralPath $w08RepoRoot
$env:AI_COACH_PROVIDER = 'fake'
git status --short
git rev-parse HEAD
```

Zapišite stvarni commit koji oboje proveravate. Ako postoji lokalna izmena drugog zadatka, sačuvajte je i prijavite; nije deo W08 provere. Potrebni su Node, instalirane zavisnosti iz lockfile-a i lokalni Edge/Chromium. Ako nedostaje `node_modules`, pokrenite `npm.cmd ci` pre proba.

Pre probe demoa, jednom pokrenite integrisanu proveru i proverite izlazni kod:

```powershell
npm.cmd run test:security:w08
if ($LASTEXITCODE -ne 0) { throw 'W08 provera nije prošla; zapiši grešku.' }
```

Ova komanda uključuje typecheck, W08 testove, produkcioni build, pravi browser i proveru sintetičke tajne. Za evidenciju prepišite **broj iz upravo završenog izlaza**, a ne istorijski broj iz poruke drugog agenta. Ne treba pravi ključ, promena `.env` fajla ili live provider. Svaka naredna PowerShell sesija mora zasebno dobiti `$env:AI_COACH_PROVIDER = 'fake'`.

## 2. Milicina lična provera: browser i početni HTTP zahtev

Pročitaj [HTTP handler](../../server/index.ts), [runtime validator](../../server/agent/validate-request.ts), [tekstualni prikaz](../../src/main.ts), [CSP podešavanje](../../vite.config.ts), [HTTP test](../../tests/server/w08-http.test.ts) i [browser test](../../tests/w08-browser.mjs).

Pokreni tačno izdvojen negativan HTTP test:

```powershell
$env:AI_COACH_PROVIDER = 'fake'
npm.cmd test -- tests/server/w08-http.test.ts -t 'T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work'
if ($LASTEXITCODE -ne 0) { throw 'Milicina HTTP provera nije prošla.' }
```

Očekuje se **1 izabran test koji prolazi**; ostali u fajlu mogu biti prikazani kao preskočeni zbog filtera. Test za svako neispravno početno telo proverava HTTP **400**, `errorCode=INVALID_REQUEST`, a na kraju **0 provider poziva i 0 tool poziva**, uz zaseban spy za svaki. Među slučajevima su `role`, `model`, `provider`, `maxSteps`, `ownerId` i `resourceId`. To su zahtevi poslati stvarnom lokalnom HTTP handleru, mimo UI-ja.

Zatim proveri browser na već izgrađenom produkcionom frontend-u:

```powershell
node tests/w08-browser.mjs
if ($LASTEXITCODE -ne 0) { throw 'Browser provera nije prošla.' }
```

U završnom JSON izlazu pokaži `dangerousNodeCount: 0`, `xssExecuted: false`, `blockedDirective: "script-src 'self'"`, stvarni CSP violation, normalan srpski tekst i `gameplayStatus: "Game Over"`. Skript koji CSP odbija prethodno je potvrđen dostupnim preko HTTP 200. Ova browser proba koristi kontrolisane sintetičke odgovore u stvarnoj render putanji; stvaran agentski loop dokazuje zaseban T00 ispod.

Milica treba svojim rečima da objasni: ko kontroliše tekst i JSON; gde tačno dolazi do odbijanja; zašto `textContent` daje bezbedan DOM; šta dodatno blokira CSP; zašto 400 bez brojača nije dovoljan dokaz; zašto klijent ne može da podigne `maxSteps`.

## 3. Nemanjina lična provera: zatvoren alat i poreklo evidence

Pročitaj [agent loop](../../server/agent/run.ts), [validator tool rezultata](../../server/agent/evaluate-drill.ts), [agent testove](../../tests/server/w08-agent.test.ts) i [fake fixture](../../tests/server/w08-fixtures.ts).

Pokreni jedan postojeći zabranjeni predlog:

```powershell
$env:AI_COACH_PROVIDER = 'fake'
npm.cmd test -- tests/server/w08-agent.test.ts -t 'T07/T09 rejects forbidden tool read_file after one provider decision'
if ($LASTEXITCODE -ne 0) { throw 'Nemanjina provera zatvorenog alata nije prošla.' }
```

Očekuje se **1 izabran test koji prolazi**: `ok=false`, `stopReason=unknown_tool`, **1 provider pokušaj**, **0 izvršenih alata**, nepromenjen snimak ulazne partije. Model je namerno dao nedozvoljen predlog, a izvršni kod je odbio radnju.

Za drugu granicu pokreni test rezultata koji ima pravilan oblik, ali tuđe brojače:

```powershell
npm.cmd test -- tests/server/w08-agent.test.ts -t "T08 rejects otherwise valid evidence with another run's counts before model reuse"
if ($LASTEXITCODE -ne 0) { throw 'Provera porekla evidence nije prošla.' }
```

Očekuje se **1 izabran test koji prolazi**: `stopReason=invalid_tool_result`, **1 izvršen dozvoljen alat**, **1 provider poziv ukupno**; nevalidan rezultat ne odlazi u drugi model korak. Ovde je alat već izvršen, pa tvrdnja „nula svih alata” nije tačna.

Nemanja treba da objasni: zašto je dozvoljen samo `evaluate_drill`; gde se zaustavlja `read_file`; zašto dozvoljeno ime ne preskače proveru argumenata; zašto pravilan tip nije dokaz da je evidence iz iste partije; zašto ovaj fake test dokazuje kontrolu izvršavanja, a ne otpornost pravog modela na svaki prompt injection. W05 trenutno nema slobodan nepouzdan tekst u model kontekstu.

## 4. Lični doprinos i zamena uloga

Zadatak traži da **svaki član doprinese najmanje jednoj zaštiti i jednom negativnom testu**. Navedite tačan doprinos: fajl, pravilo ili promena i test. Ako je član usmeravao AI, izabrao pravilo, pregledao promenu i proverio je, to opišite tim rečima i navedite da je AI pisao kod. Samo izvršavanje postojećeg testa ne predstavlja pisanje zaštite i negativnog testa. Ne traži se da prepravljate ispravnu kontrolu samo radi potpisa.

Ako neki član još nema konkretan doprinos, neka lično predloži i sprovede smisleno poboljšanje zaštite i odgovarajućeg negativnog testa u svojoj oblasti, uz pregled drugog člana. Izbor mora da proistekne iz stvarnog pravila ili praznine koju član ume da objasni; promena komentara ili naziva nije bezbednosno poboljšanje. AI može pomoći u pisanju uz iskren zapis usmeravanja i provere. Posle promene ponovite ciljani test i integrisanu W08 proveru.

Uradite oba kruga tokom zajedničke probe:

- **Krug A:** Milica vodi HTTP/browser objašnjenje i komande. Nemanja pregleda mesto kontrole i osporava tvrdnju jednom novom varijantom: npr. dodatno polje `maxSteps: 99`. Milica navodi očekivani 400 i nula provider poziva, pa pokazuje postojeću tvrdnju testa.
- **Krug B:** Nemanja vodi agent/tool objašnjenje i komande. Milica pregleda kontrolu i predlaže varijantu: `constructor` umesto `read_file`, ili validno oblikovan rezultat sa drugim brojačima. Nemanja locira odbijanje i predviđa brojače pre pokretanja.
- Oboje proveravaju jedan uspešan i oba odbijena traga; u zapis ulaze stvarni datum, uloge, varijante, komande i ishod. Individualno objašnjenje se radi bez čitanja tuđeg odgovora.

## 5. Produkciona igra i demo od osam minuta

Pre početka štoperice pripremite produkcioni build kroz `test:security:w08` i dva PowerShell prozora u korenu klona.

**Prozor A — fake API:**

```powershell
$env:AI_COACH_PROVIDER = 'fake'
npm.cmd run dev:api
```

**Prozor B — produkcioni frontend:**

```powershell
$env:AI_COACH_PROVIDER = 'fake'
npm.cmd run preview
```

Otvorite `http://127.0.0.1:4173`. API na portu 3001 dobija zahteve kroz isti origin preko preview proxy-ja. Ako je port zauzet, prvo utvrdite koji vaš proces ga koristi; ne gasite nepoznate procese. Posle probe zaustavite svoja dva procesa sa `Ctrl+C`.

Za uspešan trag koristite postojeći izdvojen HTTP test u trećem terminalu iz korena klona:

```powershell
$env:AI_COACH_PROVIDER = 'fake'
npm.cmd test -- tests/server/w08-http.test.ts -t 'T00 accepts a normal run and preserves two decisions with one useful tool'
if ($LASTEXITCODE -ne 0) { throw 'Normalan W05 trag nije prošao.' }
```

Očekuje se **1 izabran test koji prolazi**: HTTP 200, `release_earlier`, **2 model koraka / 2 provider pokušaja / 1 stvaran `evaluate_drill`**, nepromenjen ulaz. Testovi pokreću sopstvene lokalne servere i ne troše globalni demo prozor preview API-ja.

| Vreme | Ko vodi i šta pokazujete | Proverljiv ishod |
|---|---|---|
| 0:00–1:00 | Milica: pokrenuta produkciona igra, Space/klik kontrole, Game Over; pokaže arhitekturu u evidence i najvažniji rizik. | Igra radi; browser šalje nepotvrđene podatke, server odlučuje o ovlašćenjima. |
| 1:00–2:30 | Nemanja: u UI-ju pokrene Next Drill, zatim pokaže/pokrene gore navedeni T00 i njegove assert-e. | Korisna preporuka, dva model koraka, jedan stvaran read-only alat, HTTP 200. |
| 2:30–3:45 | Milica: pokrene svoj negativan HTTP test i pokaže `role`/`maxSteps` primer. | 400/`INVALID_REQUEST`, provider 0; browser ne bira server politiku. |
| 3:45–5:00 | Nemanja: pokrene izdvojeni `read_file` test i pokaže mesto odbijanja. | `unknown_tool`, provider 1, tool 0, nepromenjeno stanje. |
| 5:00–6:30 | Zamena uloga: Nemanja pokazuje HTTP assert-e, Milica agent assert-e i po potrebi T08. | Razlikujete status od efekta; oboje umete da objasnite normalan i odbijene tragove. |
| 6:30–8:00 | Oboje: tri pre/posle merenja u evidence, browser JSON/CSP i sentinel provera iz pripreme, lokalni limiti i sledeći test. | Stvarni izlazi i početni/finalni checkpoint; kvota važi za jedan proces, udaljena obrada/naplata i Vercel više instanci nisu dokazani. |

Izlaze iz pripreme možete držati otvorene da osam minuta ne trošite na kompletan build i regresiju. Jasno kažite koji izlaz je iz pripreme, a koji upravo pokrenut. Posle osam minuta oba člana daju kratko individualno objašnjenje nove varijante prema odeljku 4.

## 6. Poruka za tačno zatvaranje otvorenih stavki

Svaki član zasebno popunjava svoj deo **tek po obavljenom radu**. Sledeći tekst je nepopunjen obrazac, nije saglasnost niti rezultat:

```text
W08 LIČNA POTVRDA — NEPOPUNJEN OBRAZAC
Ime i prezime:
Stvarni datum i vreme:
Proveren commit (git rev-parse HEAD):

Pročitao/la sam spec.md, plan.md i tasks.md za 005-secure-the-arcade.
Moja izričita odluka: [odobravam sva tri dokumenta / tražim navedene izmene].
Primedbe ili dogovorene izmene:

Moj konkretan doprinos zaštiti (fajl, pravilo/promena, šta sam lično odlučio/la ili uradio/la):
Moj konkretan doprinos negativnom testu (fajl, naziv, scenario i assert-i):
AI pomoć (šta je AI napisao/predložio, kako sam pregledao/la i proverio/la):
Lično pokrenuta komanda, izlazni kod i broj izabranih/prošlih testova:
Posmatrani status/stopReason, provider/tool brojači i stanje pre/posle:

Zajednička proba sa (ime drugog člana), datum/vreme:
Krug A: driver __; reviewer __; osporena varijanta __; ishod __.
Krug B: driver __; reviewer __; osporena varijanta __; ishod __.
Demo: trajanje __; uspešan trag __; HTTP/browser odbijanje __; agent odbijanje __.
Moje individualno objašnjenje nove varijante:
Preostala primedba ili prepreka (ako postoji):
```

Par je 2026-10-28 potvrdio [zapis o tri ishoda, zamenjenim ulogama i individualnim objašnjenjima](../../docs/EVIDENCE_W08.md#pair-confirmation-and-demo-record--t032); zato je T032 zatvoren. T001 i T030 su takođe zatvoreni. Ovaj šablon ostaje za eventualnu odbranu; ne menja poreklo već zabeleženih činjenica. T033 je opcion.

## 7. Predaja posle ličnih potvrda

Po upisu stvarnih potvrda i commit-u završne evidencije, predaja ide na `marko.pavkovic@endava.com` i `SlavicaMastilovic.Sulica@endava.com`, prema korisnikovom obaveštenju o kursu. Naslov može biti `W08 — Secure the Arcade — Skyline Stack — Milica i Nemanja`. U poruku stavite oba puna imena, link repozitorijuma `https://github.com/mileusnicmilica/skyline_stack`, tačan završni commit, putanju `docs/EVIDENCE_W08.md` i komandu `npm.cmd run test:security:w08`. Ne predstavljajte trenutni tehnički checkpoint kao završenu ljudsku probu.

Slanje mail-a je radnja članova para nakon dovršetka evidencije. Ovaj vodič nije poslata predaja. Ako Nemanja ima svoj lokalni, neposlati vodič ili izmene dokumentacije, neka ih njegov agent prvo sačuva, zatim povuče aktuelni `main` i uporedi sadržaj; ne treba prepisivati tuđi lokalni rad niti slati staru kopiju dokaza.
