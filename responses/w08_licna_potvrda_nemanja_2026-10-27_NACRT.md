# W08 lična potvrda — Nemanja (nacrt za lični pregled)

**Datum:** 27.10.2026.

**Proveren commit:** `f10e7dcde5865e5a94f8267017259c8ae25520d0` (`main`, posle `git pull --ff-only origin main`).
**Puno prezime:** nije navedeno u ovom razgovoru; dopuniti pre potpisivanja.

Pročitao sam W08 `spec.md`, `plan.md` i `tasks.md` za `005-secure-the-arcade`. **Izričito odobravam sva tri dokumenta bez primedbi.** Nemanja je ovu odluku potvrdio u razgovoru 27.10.2026. Codexov tehnički pregled istih dokumenata takođe nije našao primedbu koja blokira proveru.

## Doprinos zaštiti i negativnom testu

Prema [W08 handoff-u](../specs/005-secure-the-arcade/handoff-milica-nemanja.md) i [evidenciji](../docs/EVIDENCE_W08.md), Nemanja je usmerio završetak agent/tool/provider bloka. Nemanja je u razgovoru 27.10.2026. lično potvrdio da je tražio/odobrio pravilo „samo `evaluate_drill`“ i negativan T07/T09 test, a zatim pregledao Codexov kod i test. Konkretna zaštita je zatvorena provera modelskog predloga u `server/agent/run.ts`: samo tačno ime `evaluate_drill` prolazi, zatim se zasebno proveravaju argumenti i poreklo rezultata iz iste partije. `read_file`, `set_score`, `constructor` i `toString` završavaju sa `unknown_tool` pre izvršavanja alata. Nemanja nije tvrdio da je lično kucao kod.

Negativan test bloka je `T07/T09 rejects forbidden tool read_file after one provider decision` u `tests/server/w08-agent.test.ts`. Fake provider predlaže `read_file`; test proverava `ok=false`, `stopReason=unknown_tool`, jedan provider pokušaj, nula izvršenih alata i nepromenjenu serijalizaciju ulazne partije. Codex je napisao W08 kod i testove prema Nemanjinom potvrđenom usmeravanju i pregledu. Samo današnje pokretanje testa nije dokaz autorstva.

## AI pomoć i moja lokalna provera

Codex je pomogao pisanjem implementacije, testova i dokumentacije. U ovoj sesiji Codex je pročitao aktuelni W08 spec/plan/tasks i relevantne izvore, izvršio komande na lokalnom računaru sa `AI_COACH_PROVIDER=fake` i pregledao asertacije. Ove komande su **pokrenute preko agenta**, ne predstavljaju tvrdnju da ih je Nemanja lično otkucao u terminalu.

| Komanda / provera | Stvarni ishod 27.10.2026. |
|---|---|
| `npm.cmd ci` | Izlaz 0; instalirana 42 paketa iz lockfile-a. |
| `npm.cmd run test:security:w08` | Izlaz 0; 9 fajlova / **46 od 46** testova; typecheck, build od 17 modula, 4 artefakta uključujući jednu source mapu bez sintetičke tajne; Edge T04/T05/T15/T16 prošli. CSP je blokirao dostupan strani skript; `dangerousNodeCount=0`, `xssExecuted=false`. |
| `npm.cmd run verify` | Prvi sandbox pokušaj: 207/207 i build prošli, lokalni API nije startovao zbog `uv_os_get_passwd returned ENOMEM`, izlaz 1. Ponovljena ista komanda van sandbox-a: izlaz 0; **34 fajla / 207 od 207** testova, build, secret scan, fake API/proxy, Edge uspešan i odbijen tok, restart i bez browser grešaka. |
| `npm.cmd test -- tests/server/w08-agent.test.ts -t 'T07/T09 rejects forbidden tool read_file after one provider decision'` | Izlaz 0; **1 izabran test prošao**, 9 preskočenih. Asertacije: `unknown_tool`, provider 1, tool 0, ulaz nepromenjen. |
| `npm.cmd test -- tests/server/w08-http.test.ts -t 'T00 accepts a normal run and preserves two decisions with one useful tool'` | Izlaz 0; 1 izabran test prošao; HTTP 200, 2 provider odluke, 1 `evaluate_drill`, ulaz nepromenjen. |
| `npm.cmd test -- tests/server/w08-http.test.ts -t 'T01/T02 rejects malformed, missing, null, type, domain and policy fields before provider work'` | Izlaz 0; 1 izabran test prošao; neispravni zahtevi daju HTTP 400/`INVALID_REQUEST`, provider 0, tool 0. |

`read_file` se odbija u `parseDecision()` u `server/agent/run.ts` jer `value.tool !== "evaluate_drill"`. Glavna petlja odmah završava na `unknown_tool`, pre `runTool()`. Provider brojač se uvećava pre dobijanja tog prvog modelskog odgovora. Test posebno prati `generate` i `tool`, a poređenjem `JSON.stringify(w08Run)` pre i posle potvrđuje nepromenjeno ulazno stanje. Ovo dokazuje kontrolu izvršavanja za sintetički predlog, ne uspeh protiv svakog stvarnog prompt injection pokušaja.

## Zajednička proba i zamena uloga

Nemanja je u razgovoru potvrdio da su on i Milica **27.10.2026. održali zamenu uloga i osmominutni demo**, i da je Milica vodila HTTP/browser deo, Nemanja agent/tool deo, pa su zamenili uloge prema [demo vodiču](../specs/005-secure-the-arcade/demo-guide.md). Precizno vreme, pojedinačno izgovorene osporene varijante i izlazi prikazani tokom samog demoa nisu dostavljeni u razgovoru. Gornja tabela beleži današnje stvarne lokalne testove istog commita, ne tvrdi da su njihovi izlazi nastali tokom zajedničkog demoa.

- **Krug A:** prema Nemanjinoj potvrdi, Milica driver za HTTP/browser, Nemanja reviewer; konkretna osporena varijanta tokom probe nije zabeležena. T01/T02 lokalno potvrđuje 400 i provider/tool 0 za dodatno `maxSteps: 99` i druga nevalidna polja.
- **Krug B:** prema Nemanjinoj potvrdi, Nemanja driver za agent/tool, Milica reviewer; konkretna osporena varijanta tokom probe nije zabeležena. T07/T09 lokalno potvrđuje `read_file`/`constructor` odbijanje sa provider 1 i tool 0.
- **Tri demonstraciona traga:** korisnik je potvrdio održan osmominutni demo prema vodiču; nezavisne provere ovog commita potvrdile su T00 uspeh, T01/T02 HTTP odbijanje i T07/T09 agent odbijanje. Tačan zajednički prikaz tih tragova nije zasebno dokumentovan.

**Preostalo pre zatvaranja T001/T030/T032:** Milicina zasebna izričita saglasnost i lična potvrda; Nemanjino puno ime, kao i dopuna tačnih osporenih varijanti i posmatranih tragova sa zajedničkog demoa. Ovaj nacrt nije završna evidencija ni osnova za slanje mejla.
