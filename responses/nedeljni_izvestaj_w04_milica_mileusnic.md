# Nedeljni izveštaj

## 1. Osnovne informacije

| Polje | Odgovor |
| --- | --- |
| Ime i prezime | Milica Mileusnic |
| Adresa e-pošte | mileusnicmilica13@gmail.com |
| Discord korisničko ime | mileusnicmilica_63043 |
| Nedelja | W04 — Reliable AI Integration |
| Par / tim | tim-treca-smena; rad u paru sa Nemanjom Manicem |
| Moj konkretan doprinos / uloga | Kao drugi driver implementirala sam Gemini adapter, pouzdanost AI toka, korisnički interfejs, testove i evidence dokumentaciju |
| Datum predaje | 2026-09-27 |
| Reference na rad i dokaze | Javni repozitorijum `mileusnicmilica/skyline_stack`; javna aplikacija: https://skyline-stack.vercel.app; commit `4142072`; `specs/003-ai-crane-coach/handoff-milica.md`; `docs/EVIDENCE_W04.md`; `docs/AI_PROVIDER_USAGE_LOG.md`; 16 test fajlova i 117 uspešnih testova; javni frontend i API provereni sa HTTP 200 |

## 2. Moj status

**Status:** Završeno

Završila sam zadatke za koje sam bila zadužena, a Nemanja je pregledao moj rad i potvrdio da je sve u redu. Implementacija i dokumentacija su poslate na `main` granu, a završna verzija aplikacije objavljena je na Vercelu. Završna provera obuhvatila je TypeScript provere, 117 testova, production build, proveru granice za tajne podatke, lokalni API/proxy tok, browser smoke testove i proveru javnog frontend-a i API-ja sa HTTP 200 odgovorima.

## 3. Rad ove nedelje

Ove nedelje sam nastavila razvoj funkcionalnosti „AI Crane Coach“ kao drugi driver, dok je Nemanja pregledao moj rad. Radila sam u postojećem Spec Kit feature-u `003-ai-crane-coach`. Bila sam zadužena za taskove T016–T019 i T023–T025: pouzdano ponašanje AI integracije, pravi Gemini adapter, korisnički tok posle završetka partije, browser provere i evidence dokumentaciju.

Najpre sam radila sa fake providerom, kako bi većina ponašanja mogla da se proveri bez trošenja live API poziva. Pokriveni su uspešan zahtev, nevalidan input bez poziva provideru, provider greška, timeout, neispravan JSON ili šema, semantički neispravan odgovor i ograničenje retry pokušaja. `biggestMistakeFloor` je obavezan broj i odgovor sa vrednošću `null` nije prihvaćen. Dodati su timeout i abort, ograničen retry i bezbedan fallback kada AI analiza nije dostupna.

Nakon fake validacije povezala sam eksplicitno izabrani Gemini model u TypeScript backend-u. API ključ je korišćen samo kroz lokalni serverski `.env` i nije dodat u repozitorijum, frontend kod ili dokumentaciju. Ograničena live provera završena je uspešno jednim pozivom. Poziv je trajao 1.459 sekundi i vratio usage od 156 ulaznih i 74 izlazna tokena, ukupno 230. Provider evidencija beleži model, vreme, ishod, broj pokušaja, latenciju i tokene, bez ključa i sirovih privatnih payload-a.

U korisničkom toku dodala sam dugme „Analiziraj partiju“, dostupno tek posle Game Over stanja. Implementirana su loading, uspešno i bezbedno neuspešno stanje. Sprečeni su dupli zahtevi i prikaz zastarelog odgovora ako korisnik u međuvremenu restartuje igru. Proverila sam i da osnovna igra nastavlja da radi kada AI server nije dostupan.

Dodatno sam popravila vizuelno ponašanje tornja: tokom gradnje prvih pet spratova ostaje vidljivo, a kamera tek nakon toga počinje da prati rast tornja. Ova izmena je pokrivena testovima i usklađena sa dokumentacijom. To mi je bilo posebno korisno iskustvo jer sam povezala vizuelni zahtev sa preciznim pravilom kamere koje može automatski da se proveri.

Koristila sam Claude, Gemini, Codex/ChatGPT i Gemini API kao podršku tokom razvoja. AI predloge nisam uzimala kao dovoljan dokaz da rešenje radi: proveravala sam ih kroz kod, fake scenarije, testove, browser tok i završni `npm run verify`. Važna lekcija mi je bila da API ključ mora ostati na serveru i da se live integracija ne proverava samo kroz browser. Browser testovi koriste kontrolisani fake tok, dok je pravi Gemini poziv izveden odvojeno i ograničeno. Pomoć tutora mi trenutno nije potrebna.

Završna aplikacija dostupna je na `https://skyline-stack.vercel.app`. Vercel verzija koristi serverless endpoint za isti validirani `/api/ai/coach` ugovor. Javni frontend i validan fake-provider zahtev provereni su nakon deploy-a i oba su vratila HTTP 200. Gemini ključ nije dodat u repozitorijum niti u deploy; produkcija trenutno koristi bezbedni fake režim, dok je pravi Gemini adapter prethodno proveravan odvojenim ograničenim live pozivom.

## 4. Sledeći korak

Na sledećoj prezentaciji ću sa Nemanjom preko javne Vercel aplikacije, u ograničenom šestominutnom toku, demonstrirati i objasniti sledeće: naša W03 igra sada ima jednu malu AI funkcionalnost koju korisnik može da koristi; frontend ne zna provider secret i komunicira samo sa našim backend-om; backend validira input, poziva eksplicitno izabrani AI model, validira strukturisani response i bezbedno obrađuje timeout ili provider failure; većinu ponašanja proveravamo preko fake providera, a live API koristimo samo kao završnu potvrdu integracije; znamo šta feature radi, koliko košta i šta još nije pokriveno. Korak je završen kada demonstriramo uspešan tok, safe failure i objasnimo evidence bez prikazivanja API ključa.

## 5. Poverljiva napomena za tutora

Nema dodatne napomene.
