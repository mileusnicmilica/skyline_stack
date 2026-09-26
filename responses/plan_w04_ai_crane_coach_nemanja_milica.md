# W04 plan rada u paru: AI Crane Coach

**Status (2026-09-26):** Nemanjin prvi blok je završen i verifikovan; Milicin
drugi blok još čeka pregled ugovora i implementaciju. Merodavni Spec Kit
artefakti i stvarni rezultati su u `specs/003-ai-crane-coach/`, posebno u
`tasks.md` i `handoff-nemanja.md`. **Redosled:** Milica pregleda prvi diff,
a Nemanja zatim pregleda njen. Oboje objašnjavaju ceo tok. Stvarne uloge,
datume i doprinose upisati tek kada se dese.

## Početno stanje pre W04 i šta W04 dodaje

Pre W04, Skyline Stack je bio statička TypeScript/Canvas igra. `src/game/engine.ts`
kontroliše njihanje, puštanje, presek, rezultat, Game Over i restart;
`src/game/model.ts` definiše stanje partije; `src/main.ts` upravlja DOM-om;
`index.html` je imao Restart, ali nije imao AI kontrolu. Nije bilo backend-a,
API ključa, AI poziva, loga spuštanja ni W04 endpoint-a. Postoje Vite, Vitest, browser
smoke i komanda `npm.cmd run verify`. Na početku planiranja typecheck i svih
55 testova u 9 fajlova prolaze. Istorijski Session 003 baseline i W03/V2
dokazi ostaju istorijski zapisi.

W04 zadatak traži jedan korisniku vidljiv AI tok, TypeScript backend između
browser-a i providera, key samo na serveru, lokalnu i izlaznu runtime
validaciju, timeout, ograničeno postupanje sa greškama, bezbedan fallback,
fake provider testove, jednu ograničenu live proveru i stvarni evidence.
AI Crane Coach posle Game Over ispunjava traženi tok: partija → strukturisan
log → backend → AI analiza → prikaz saveta. AI se ne poziva u animation loop-u.

## Obavezan redosled: GitHub Spec Kit, zatim arhitektura, zatim AI

Ovaj repo već sadrži **GitHub Spec Kit** scaffold u `.specify/` i njegove
Codex veštine u `.agents/skills/speckit-*`; `.specify/init-options.json`
beleži verziju 1.0.8. Za W04 koristiti taj stvarni Spec Kit workflow, a ne
samo ručno nazvati običan dokument „spec“. Slediti W04 tok:

`ideja → početna razjašnjenja → spec → plan → tasks → implementation → validation → evidence`.

Najpre razjasniti pitanja o granicama feature-a sa parom, pa proveriti
scaffold i pokrenuti `speckit-constitution` za W04 izuzetak od ranijeg „bez
backend-a“. Potom `speckit-specify` pravi inicijalni `spec.md`;
`speckit-clarify` se koristi za preostale nejasnoće i upisuje odgovore u taj
spec (zato se konkretna Spec Kit komanda izvršava posle prve verzije spec-a).
Slede `speckit-plan`, `speckit-tasks` i `speckit-analyze`, pa pregled i
usvajanje pre koda. Implementaciju voditi kroz `speckit-implement` prema
`tasks.md`, potom izvršiti testove i live validaciju, a na kraju zapisati
stvarne rezultate u evidence. Rezultat treba da bude verzionisani feature
003 u `specs/`, sa stvarnim spec/plan/tasks fajlovima.

**Prvi implementacioni milestone je isključivo frontend–backend split.**
`server/` mora biti TypeScript backend koji se samostalno pokreće; browser
ostaje Vite frontend, a `/api` ide kroz Vite proxy do našeg servera. Proveriti
da frontend i dalje radi, da je backend dostupan preko proxy-ja, da backend
može da vrati lokalni odgovor bez providera i da frontend bundle nema secret.
Tek kada ta granica radi i testovi prolaze, dodavati `DropRecord`, AI endpoint,
fake provider i stvarni provider. Tako zadatakovo „prvo stabilizujte
arhitekturu“ postaje zaseban proverljiv gate u `tasks.md`.

## Odluke koje treba zaključati u Spec Kit-u pre koda

1. **Novi feature:** otvoriti `specs/003-ai-crane-coach/`, bez prepisivanja
   feature 001/002 specifikacija. W04 je novo eksplicitno odobrenje za backend
   i jedan AI poziv. Ustav v1.0.0 i V2 dokumenti trenutno zabranjuju backend
   i mrežne pozive; pre implementacije zabeležiti i usvojiti usko W04
   pojašnjenje/amandman sa razlogom, procenom uticaja i novom verzijom
   ustava, uz očuvanje starih V2 zapisa kao istorijskog konteksta.
2. **Podaci o spuštanju:** `DropRecord` sadrži redni broj sprata, pomeraj
   centara, smer pri puštanju (`-1 | 1`), `early | late | centered` i širinu
   pre i posle kontakta. Smer je potreban backend-u da ponovo izračuna timing;
   samo prosleđeno polje `timing` nije dovoljan dokaz da je oznaka tačna. U
   `resolveLanding` se upisuje tačno jedan zapis i za uspeh i za promašaj;
   `widthAfter = 0` za promašaj. Smer iz `session.direction` ostaje sačuvan
   tokom vertikalnog pada. `offset * direction > 0` je `late`, `< 0` je
   `early`; toleranciju za `centered` i granične slučajeve definisati u spec-u.
   Restart prazni istoriju. Engine testovi dokazuju i da nema duplog zapisa.
3. **Obim loga i validnost score-a:** ne koristiti „poslednjih 60“ uz proveru
   `finalScore === broj uspešnih zapisa`, jer odsečeni log to ne može dokazati.
   Za prvi W04 ugovor slati ceo log do dogovorenog limita: `finalScore` je
   ceo broj `0..500`, a `drops` ima `1..501` zapisa (do 500 uspeha + završni
   promašaj). Za dužu partiju prikazati bezbedno objašnjenje da analiza nije
   dostupna, bez slanja nepotpunog loga.
   Backend proverava uzastopne brojeve spratova, konačan pozitivan
   `widthBefore` i `widthAfter >= 0` (nula samo na završnom promašaju),
   konačan pomeraj (negativan `offsetPx` je validan), dozvoljen smer i
   usklađenost `timing` sa pomerajem i smerom, dozvoljen odnos
   `widthAfter <= widthBefore`, jedan završni promašaj,
   `startingWidth = prvi widthBefore`, kontinuitet širina između spuštanja,
   `finalScore = broj uspeha`, ograničen JSON body i odsustvo dodatnog
   privatnog teksta. Ovo dokazuje konzistentnost zahteva, ne autentičnost
   browser partije. Ceo ograničeni log ide samo frontend → naš backend;
   provider dobija izračunate agregate i kratak opis pravila, bez celog
   `GameSession` objekta i nepotrebnih korisničkih podataka.
4. **Statistika i odgovor:** backend deterministički računa udeo `early` i
   `late`, prosečnu apsolutnu grešku u pikselima i sprat sa najvećim gubitkom
   širine (`widthBefore - widthAfter`; uključiti i završni promašaj; tie-break
   je najraniji sprat). Za `timingBias` unapred zaključati pragove; predlog:
   `consistent` ako je najmanje 70% spuštanja `centered`, inače `early` ili
   `late` ako taj tip čini najmanje 60% necentriranih, inače `mixed`.
   `biggestMistakeFloor` je izračunata vrednost iz loga, a ne slobodna odluka
   modela. Pošto svaka završena partija ima poslednji promašaj sa pozitivnim
   gubitkom širine, vrednost je uvek broj sprata, a `null` je nevažeći. Providerov
   `timingBias` i `biggestMistakeFloor` moraju tačno odgovarati backend
   rezultatu; suprotan odgovor je malformed i ne ide u UI.
5. **Pouzdanost:** usaglasiti mali strukturisani `CoachAdvice` odgovor
   (`headline`, `timingBias`, `biggestMistakeFloor`, `tip`), sa predlogom
   `headline` do 80, `tip` do 200 znakova i nepraznim trimovanim tekstom;
   tačne granice zaključati u spec-u. Proveriti i šemu i značenje odgovora
   prema server statistici. Provider piše objašnjenje i savet, a ne prebrojava
   podatke. Predlog: Gemini Flash-Lite; tačan
   podržani model ID, cena i format structured output-a proveravaju se u
   zvaničnoj dokumentaciji pri implementaciji i zatim upisuju u ugovor,
   zajedno sa razlogom zašto je najjeftiniji pouzdan model dovoljan.
   Predlog je ukupni budžet od oko 10 s za provider pozive, jedan retry za
   privremene network/429/5xx greške samo dok budžet traje (429 samo ako
   provider dozvoljava ponavljanje, uz poštovanje `Retry-After`) i bez retry-a
   za lokalni input, 400/403, programski bug ili malformed output. Korisnik
   vidi samo stabilnu poruku:
   `AI analiza trenutno nije dostupna.` Predloženi API odgovor je
   `{ success: true, advice: CoachAdvice }` ili
   `{ success: false, message: "AI analiza trenutno nije dostupna." }`.
   Backend ne vraća stack trace, sirov provider odgovor ili ključ.
   Restart uvek ostaje upotrebljiv.

## Blok 1 — Nemanja (prvi driver; Milica pregleda pri predaji)

1. **Zvanični Spec Kit tok.** Proveriti postojeći GitHub scaffold i kroz
   njegove veštine napraviti W04 amandman ustava, feature 003 specifikaciju,
   razjašnjenja, tehnički plan i zavisno poređane taskove. Početna pitanja
   razrešiti pre prve verzije spec-a, a `speckit-clarify` primeniti na
   preostale praznine. U `tasks.md` postaviti arhitektonski gate ispred svih
   AI taskova. Pre koda pribaviti ljudski pregled i eksplicitno usvajanje
   Faze A prema ustavu; Miličin pregled se može obaviti pri kasnijoj predaji
   prvog bloka, pre nego što ona počne svoj kod.
2. **Prvo razdvajanje.** Kroz `speckit-implement` napraviti TypeScript
   `server/`, Vite `/api` proxy, lokalne start skripte i proveru da frontend
   radi dok backend služi jednostavan ne-AI odgovor. Proveriti da nijedan
   secret nije potreban za ovu proveru. Tek posle uspešnog split gate-a
   nastaviti AI taskove.
3. **AI kodni temelj.** Dodati istoriju spuštanja u model/engine, zajednički
   request/response ugovor i determinističku statistiku. U `.gitignore`
   obezbediti da stvarni `.env` ostane ignorisan, a prazni `.env.example`
   može u commit. Secrets ne ulaze u frontend, log ni fixture.
4. **Fake-first vertikalni presek.** Napraviti fake provider pre endpoint-a,
   pa endpoint koji validira input *pre* provider poziva, vraća strukturisani
   uspeh i safe grešku. Testirati normalan zahtev, prazan/neispravan log i eksplicitno
   `providerCallCount === 0` za nevalidan ulaz. Dodati fixture sa uspehom i
   promašajem, bez potrebe za ručnim igranjem.
5. **Predaja Milici.** Predati čitljiv spec/plan/tasks, ugovor, test fixture,
   komande, prolazne testove, opis preostalih taskova i otvorena pitanja.
   Milica pregleda architecture boundary, diff, validation i secrets; nalaze
   zabeležiti pre drugog bloka. Ne proglašavati W04 završenim u ovoj tački.

## Blok 2 — Milica (drugi driver; Nemanja reviewer)

1. **Prvo potpuna fake validacija, zatim live adapter.** Kroz fake provider
   dovršiti runtime proveru šeme i semantike, timeout/abort, ograničen retry,
   safe fallback i sve neuspešne scenarije iz W04 test matrice. Tek kada
   su fake testovi zeleni, povezati izabrani Gemini model u TypeScript
   backend-u i proveriti njegov structured output. Milica pravi/koristi
   sopstveni Gemini API key u lokalnom server env-u; stvarna vrednost se
   nikada ne deli kroz repo ili dokumentaciju. Interna
   evidencija provider poziva beleži provider, model, timestamp, latenciju,
   ishod, broj pokušaja i token usage ako ga provider vrati, bez secreta i
   sirovih privatnih payload-a. Zabeležiti stvarni broj poziva i tokena;
   izračunati cenu iz tada važećeg cenovnika ako su usage podaci dostupni,
   inače označiti kao nepoznato. `docs/AI_USAGE_LOG.md` već beleži razvojnu
   upotrebu AI; u W04 evidence-u jasno odvojiti taj zapis od provider usage
   loga. Većinu provera raditi fake-om.
2. **Korisnički tok.** Dodati dugme „Analiziraj partiju“ pored Restart-a,
   dostupno samo posle Game Over; prikazati loading, rezultat i safe grešku.
   Sprečiti duple zahteve i zastareo odgovor posle Restart-a. Proveriti
   keyboard/pointer tok i da osnovna igra nastavlja da radi bez AI servera.
3. **Testovi i evidence.** Pre live poziva pokriti najmanje: validan
   zahtev/uspeh, invalid input sa 0 provider poziva, provider grešku,
   timeout, malformed JSON/šemu, semantički netačan odgovor i granicu retry
   pokušaja. Proširiti browser
   smoke za fake success/failure i `verify` tako da pokriva W04 backend.
   Zatim izvršiti ograničenu live proveru sa stvarnim key-em iz lokalnog env-a
   i bez snimanja ključa; evidentirati stvaran rezultat ili `NOT RUN`.
   Predloženi W04 budžet je do 20 live poziva tokom razvoja i do 5 tokom
   finalnog demo-a; realan broj upisati, ne procenjivati.
4. **Predaja i zajednički review.** Nemanja pregleda Milicin diff, ponavlja
   komande i security checklist; zajedno prolaze šestominutni demo i
   objašnjavaju ceo flow. U evidence upisati stvarne doprinose i stvarnu
   zamenu driver/reviewer uloga.

## Artefakti i završni uslovi

- `specs/003-ai-crane-coach/`: `spec.md`, `plan.md`, `tasks.md`, relevantni
  contracts/quickstart i checklist; po potrebi `research.md` za model i retry.
  `spec.md` mora navesti problem koji feature rešava i odgovoriti na osam
  pitanja iz W04 zadatka: ko i kada pokreće analizu, koji su input i output,
  kako savet pomaže, koliko se čeka, šta se
  dešava pri grešci i kako se proverava validnost. U njemu ili direktno
  povezanom provider contract-u mora biti tačan provider/model i razlog
  izbora. Obavezne rubrike su:
  **user scenario, input, output, acceptance criteria, out of scope, error
  behavior i security boundary**; navesti i proverljiv success.
- `docs/AI_FEATURE_PROMPT.md`: tačan system/user prompt bez ključa;
  `docs/AI_PROVIDER_CONTRACT.md`: provider/model, input/output, timeout, retry,
  fallback, čuvanje secreta, validation i user-facing failure. Ne duplirati
  ceo feature spec ako je Spec Kit spec potpun.
- `docs/AI_EVALS.md` i `docs/EVIDENCE_W04.md`: unapred zadati evali, stvarni
  PASS/FAIL/NOT RUN rezultati (najmanje četiri slučaja: success, invalid
  input, provider failure/timeout i malformed output), dijagram arhitekture,
  frontend/backend granica, lokacija secreta, provider/model,
  request/response ugovori, success/failure
  tokovi, test komande, poznata ograničenja, live provera i doprinos oba člana.
  Nastaviti `docs/AI_USAGE_LOG.md` samo stvarnim razvojnim AI upotrebama; za
  provider pozive sačuvati odvojeni sanitizovani usage zapis u W04 evidence-u
  ili posebnom `docs/AI_PROVIDER_USAGE_LOG.md`.
- Završni gate: W03 igra/regresioni testovi prolaze; backend TS i frontend
  rade zajedno; nijedan key nije u bundle-u, Git istoriji, izlazu ili
  screenshot-u; fake matrica prolazi; provereni su timeout i safe failure;
  odrađena je jedna stvarna live demonstracija; oba člana mogu objasniti
  tok. Autonomni agent loop, RAG/vector baza, generički agent framework,
  više providera, login, multiplayer, deployment, write-access AI alati i
  kompletan observability sistem nisu deo W04 Core. Dashboard, dodatni
  provider fallback, holdout eval i eksterni play-test ostaju opcioni stretch
  tek posle stabilnog Core-a.

## Završni audit prema W04 zadatku

| Oblast iz zadatka | Dokaz koji mora postojati pre predaje |
| --- | --- |
| W03 kontinuitet i arhitektura | Stara igra radi; TypeScript backend se pokreće odvojeno; browser komunicira samo sa `/api`; split gate je zatvoren pre AI koda. |
| Spec Kit disciplina | GitHub Spec Kit feature 003 sadrži pregledane `spec.md`, `plan.md`, `tasks.md` i eksplicitne acceptance/error/security granice. |
| Jedan koristan AI scenario | Dugme posle Game Over šalje najmanji dovoljan log; korisnik dobija kratak savet; nema poziva u animation loop-u. |
| Provider i secret | Tačan provider/model i razlog izbora su zapisani; stvarni key je samo u server env-u, nema `VITE_` prefiks i nije u bundle-u. |
| Ugovor i runtime validacija | Request, response, finite vrednosti i semantika su validirani; invalid input daje 0 provider poziva; malformed output ne postaje uspeh. |
| Reliability i UI | Dokumentovan/testiran timeout; najviše jedan dozvoljeni retry; stabilna korisnička greška; Restart ostaje funkcionalan. |
| Fake i live dokazi | Fake pokriva success, input rejection, provider failure, timeout, malformed output i attempt limit; zatim ograničena live demonstracija. |
| Evidence i rad u paru | Evali imaju stvarne rezultate, dijagram toka i poznata ograničenja; zabeleženi su stvarni doprinosi, pregled diff-a i zamena uloga. |

Bezbednosni checklist proveriti stavku po stavku i rezultat uneti u
`docs/EVIDENCE_W04.md`: ključ nije u frontend bundle-u; ključ nije u Git
istoriji; pravi `.env` nije commit-ovan; postoji prazan `.env.example`;
backend ne vraća ključ; provider usage log ne sadrži ključ; error response
ne sadrži stack trace ili secret; input se validira pre poziva; output se
validira pre prikaza. Stvarni key ne sme biti ni u README-u, promptu, Spec Kit
dokumentima, fixture-u, screenshot-u, evidence-u, Discord poruci ili
prezentaciji. Proveriti i staged diff pre commita. Ako key ipak bude
commit-ovan, odmah ga tretirati kao kompromitovan, opozvati/zameniti i
zabeležiti incident bez ponovnog objavljivanja vrednosti.

Za radnu verziju ciljati feedback pre završne predaje (u zadatku je predložen
utorak, a finalni review za sredu), a za finalni pregled pripremiti
šestominutni demo po redosledu:
scenario → arhitektura → uspeh → ugovor → greška → testovi → evidence.

Ako isti problem traje oko 20 minuta, zaustaviti širenje scope-a i zapisati:
šta pokušavamo, šta očekujemo, šta se desilo, provider/model, poslednji
uspešan korak, test/evidence i precizno pitanje. Pre promene arhitekture ili
modela proveriti env, endpoint, payload, SDK konfiguraciju, model ID,
timeout, parsiranje i validaciju šeme.

**Važna praktična napomena:** `responses/` je trenutno u `.gitignore`, pa ovaj
interni plan nije automatski deo GitHub predaje. Zvanični Spec Kit i W04
evidence artefakti treba da budu u verzionisanim `specs/` i `docs/` folderima.
