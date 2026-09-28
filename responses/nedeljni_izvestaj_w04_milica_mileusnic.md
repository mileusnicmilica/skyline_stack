# Nedeljni izveštaj

## 1. Osnovne informacije

| Polje | Odgovor |
| --- | --- |
| Ime i prezime | Milica Mileusnic |
| Adresa e-pošte | mileusnicmilica13@gmail.com |
| Discord korisničko ime | mileusnicmilica_63043 |
| Nedelja | W04 — Reliable AI Integration |
| Par / tim | tim-treca-smena; rad u paru sa Nemanjom Manicem |
| Moj konkretan doprinos / uloga | Kao drugi driver implementirala sam Gemini adapter, pouzdanost AI toka, korisnički interfejs, testove i evidence dokumentaciju; kompletno prilagođavanje i objavljivanje Vercel verzije bilo je moj deo rada |
| Datum predaje | 2026-09-27 |
| Reference na rad i dokaze | Javni repozitorijum `mileusnicmilica/skyline_stack`; javna aplikacija: https://skyline-stack.vercel.app; commitovi `4142072`, `0fa53fa`, `a5bb2e4` i `29c132a`; `specs/003-ai-crane-coach/handoff-milica.md`; `docs/EVIDENCE_W04.md`; `docs/AI_PROVIDER_USAGE_LOG.md`; 17 test fajlova i 121 uspešan test; javni frontend i Gemini API provereni sa HTTP 200 |

## 2. Moj status

**Status:** Završeno

Završila sam zadatke za koje sam bila zadužena, uključujući kompletnu Vercel verziju projekta, a Nemanja je pregledao moj rad i potvrdio da je sve u redu. Implementacija i dokumentacija su poslate na `main` granu, a završnu aplikaciju sam prilagodila i objavila na Vercelu. Završna provera obuhvatila je TypeScript provere, 121 test, production build, proveru granice za tajne podatke, lokalni API/proxy tok, browser smoke testove i proveru javnog frontend-a i Gemini API-ja sa HTTP 200 odgovorima.

## 3. Rad ove nedelje

Ove nedelje sam nastavila razvoj funkcionalnosti „AI Crane Coach“ kao drugi driver, dok je Nemanja pregledao moj rad. Radila sam u postojećem Spec Kit feature-u `003-ai-crane-coach`. Bila sam zadužena za taskove T016–T019 i T023–T025: pouzdano ponašanje AI integracije, pravi Gemini adapter, korisnički tok posle završetka partije, browser provere i evidence dokumentaciju.

Najpre sam radila sa fake providerom, kako bi većina ponašanja mogla da se proveri bez trošenja live API poziva. Pokriveni su uspešan zahtev, nevalidan input bez poziva provideru, provider greška, timeout, neispravan JSON ili šema, semantički neispravan odgovor i ograničenje retry pokušaja. `biggestMistakeFloor` je obavezan broj i odgovor sa vrednošću `null` nije prihvaćen. Dodati su timeout i abort, ograničen retry i bezbedan fallback kada AI analiza nije dostupna.

Nakon fake validacije povezala sam eksplicitno izabrani Gemini model u TypeScript backend-u. API ključ nije dodat u repozitorijum, frontend kod ili dokumentaciju. Prva ograničena live provera završena je uspešno lokalnim pozivom koji je trajao 1.459 sekundi i koristio ukupno 230 tokena. Nakon objave izvršen je još jedan kontrolisani produkcijski poziv preko Vercela: trajao je 0.980 sekundi i koristio 227 tokena. Provider evidencija beleži model, vreme, ishod, broj pokušaja, latenciju i tokene, bez ključa i sirovih privatnih payload-a.

U korisničkom toku dodala sam dugme „Analiziraj partiju“, dostupno tek posle Game Over stanja. Implementirana su loading, uspešno i bezbedno neuspešno stanje. Sprečeni su dupli zahtevi i prikaz zastarelog odgovora ako korisnik u međuvremenu restartuje igru. Proverila sam i da osnovna igra nastavlja da radi kada AI server nije dostupan.

Dodatno sam popravila vizuelno ponašanje tornja: tokom gradnje prvih pet spratova ostaje vidljivo, a kamera tek nakon toga počinje da prati rast tornja. Ova izmena je pokrivena testovima i usklađena sa dokumentacijom. To mi je bilo posebno korisno iskustvo jer sam povezala vizuelni zahtev sa preciznim pravilom kamere koje može automatski da se proveri.

Koristila sam Claude, Gemini, Codex/ChatGPT i Gemini API kao podršku tokom razvoja. AI predloge nisam uzimala kao dovoljan dokaz da rešenje radi: proveravala sam ih kroz kod, fake scenarije, testove, browser tok i završni `npm run verify`. Važna lekcija mi je bila da API ključ mora ostati na serveru i da se live integracija ne proverava samo kroz browser. Browser testovi koriste kontrolisani fake tok, dok je pravi Gemini poziv izveden odvojeno i ograničeno. Pomoć tutora mi trenutno nije potrebna.

Kompletna Vercel verzija bila je moj deo rada. Prilagodila sam postojeći Node backend Vercel serverless okruženju, dodala Vercel konfiguraciju i povezala javni frontend sa validiranim `/api/ai/coach` endpointom. Rešila sam i problem sa ESM importima koji se pojavio tek u Vercel runtime-u, ponovila production deploy i proverila da javni frontend i API rade. Gemini režim sam podesila preko `AI_COACH_PROVIDER` i `GEMINI_API_KEY` Production secret promenljivih, bez unošenja ključa u kod, Git ili dokumentaciju. Produkcijski Gemini odgovor zatim sam proverila kontrolisanim HTTP 200 pozivom i redaktovanim usage logom.

U okviru Vercel dela dodala sam i serverski limit od pet zahteva na deset minuta po klijentskoj IP adresi. Zahtev preko kvote dobija bezbedan `429` odgovor i ne poziva Gemini, a IP adresa se ne upisuje u provider usage log. Testirala sam limit fake providerom kako ne bih trošila live pozive, dok sam produkciju proverila samo jednim dodatnim kontrolisanim Gemini zahtevom. Ugrađeni limit je best-effort po aktivnoj serverless instanci; za strogo globalno ograničenje između svih instanci bio bi potreban zajednički Redis/KV storage.

## 4. Sledeći korak

Na sledećoj prezentaciji ću sa Nemanjom preko javne Vercel aplikacije, u ograničenom šestominutnom toku, demonstrirati i objasniti sledeće: naša W03 igra sada ima jednu malu AI funkcionalnost koju korisnik može da koristi; frontend ne zna provider secret i komunicira samo sa našim backend-om; backend validira input, poziva eksplicitno izabrani AI model, validira strukturisani response i bezbedno obrađuje timeout ili provider failure; većinu ponašanja proveravamo preko fake providera, a live API koristimo samo kao završnu potvrdu integracije; znamo šta feature radi, koliko košta i šta još nije pokriveno. Korak je završen kada demonstriramo uspešan tok, safe failure i objasnimo evidence bez prikazivanja API ključa.

## 5. Poverljiva napomena za tutora

Nema dodatne napomene.
