# Nedeljni izveštaj

## 1. Osnovne informacije

| Polje | Odgovor |
| --- | --- |
| Ime i prezime | Nemanja Manic |
| Adresa e-pošte | nemanjamanic9@gmail.com |
| Discord korisničko ime | manic0861 |
| Nedelja | W04 — Reliable AI Integration |
| Par / tim | tim-treca-smena; rad u paru sa Milicom Mileusnic |
| Moj konkretan doprinos / uloga | Kao prvi driver postavio sam API ugovor, backend osnovu i fake provider testove, a zatim sam pregledao nastavak implementacije |
| Datum predaje | 2026-09-27 |
| Reference na rad i dokaze | Javni repozitorijum `mileusnicmilica/skyline_stack`; javna aplikacija: https://skyline-stack.vercel.app; commit `c6fde18` za pripremu W04 handoff-a i zajednički završni commit `4142072`; `specs/003-ai-crane-coach/handoff-nemanja.md`; `specs/003-ai-crane-coach/tasks.md`; `docs/EVIDENCE_W04.md`; 16 test fajlova i 117 uspešnih testova; javni frontend i API provereni sa HTTP 200 |

## 2. Moj status

**Status:** Završeno

Završio sam zadatke za koje sam bio zadužen, a zatim sam pregledao nastavak implementacije i potvrdio da je u redu. Zajednički završni rad je poslat na `main` granu, a završna verzija aplikacije objavljena je na Vercelu. Završna provera obuhvatila je 117 uspešnih testova, TypeScript provere, production build, proveru tajni, browser smoke tokove i proveru javnog frontend-a i API-ja sa HTTP 200 odgovorima.

## 3. Rad ove nedelje

Ove nedelje sam započeo W04 „AI Crane Coach“ kao prvi driver. Postavio sam jasan API ugovor i pouzdanu osnovu backend-a pre povezivanja pravog AI providera. Radio sam taskove T001–T015, T020–T022 i T026–T028 iz postojećeg Spec Kit feature-a `003-ai-crane-coach`, a zatim sam prešao u ulogu reviewera i pregledao nastavak implementacije.

Definisao sam granicu između frontend-a, našeg backend-a i AI providera. Frontend šalje samo završeni snapshot partije našem endpoint-u, dok provider secret ostaje na serveru. Ugovor opisuje validan zahtev, strukturisani odgovor i bezbednu grešku. Postavljena je serverska validacija ulaza pre poziva provideru, tako da nevalidan zahtev rezultuje sa nula provider poziva. Pripremio sam fake provider i testnu osnovu za uspeh i neuspešne scenarije, kako bi se ponašanje proveravalo deterministički i bez nepotrebnih live poziva.

Implementirao sam backend rutu, mapiranje podataka partije, provider interfejs i početne testove za API ugovor. Dokumentovao sam handoff kako bi rad mogao da se nastavi runtime proverom šeme i semantike, timeout/retry ponašanjem, Gemini adapterom i korisničkim tokom. Važno mi je bilo da implementacija ne veže poslovnu logiku direktno za Gemini, već da pravi i fake provider koriste isti ugovor.

Takođe sam primenio popravke prema prethodnom izveštaju i feedbacku profesora i sredio zadatke za koje sam bio zadužen pre predaje. Zatim sam pregledao završni diff, uključujući AI tok, testove i dokumentaciju, i potvrdio da je sve u redu. Zajednička završna verifikacija pokazala je 16 test fajlova i 117 uspešnih testova, uz uspešan production build, secret-boundary proveru, API/proxy proveru i browser smoke za uspešan i neuspešan AI scenario.

Tokom rada koristio sam Claude, Gemini i Codex/ChatGPT kao podršku pri analizi zadatka, planiranju i proveri implementacije. AI izlaze sam proveravao poređenjem sa zahtevima zadatka, API ugovorom, kodom, fake-provider testovima i završnom verify komandom. Nisam tretirao AI predlog kao dokaz završetka bez testova i pregleda stvarnog diff-a. Korisna lekcija iz ove nedelje bila mi je da se AI integracija lakše i pouzdanije razvija kada je provider iza jasnog interfejsa, a većina grešaka može da se reprodukuje fake providerom. Pomoć tutora mi trenutno nije potrebna.

Završna aplikacija dostupna je na `https://skyline-stack.vercel.app`. Backend ugovor je prilagođen Vercel serverless endpointu bez menjanja validacije zahteva i odgovora. Produkcija koristi Gemini, dok je ključ sačuvan isključivo kao Vercel Production secret i nije deo repozitorijuma. Kontrolisani produkcijski zahtev vraća HTTP 200. Dodat je serverski limit od pet zahteva na deset minuta po klijentskoj IP adresi, uz bezbedan `429` odgovor preko kvote i bez dodatnog provider poziva; limit je best-effort po aktivnoj serverless instanci.

## 4. Sledeći korak

Na sledećoj prezentaciji ću sa Milicom preko javne Vercel aplikacije, u ograničenom šestominutnom toku, demonstrirati i objasniti sledeće: naša W03 igra sada ima jednu malu AI funkcionalnost koju korisnik može da koristi; frontend ne zna provider secret i komunicira samo sa našim backend-om; backend validira input, poziva eksplicitno izabrani AI model, validira strukturisani response i bezbedno obrađuje timeout ili provider failure; većinu ponašanja proveravamo preko fake providera, a live API koristimo samo kao završnu potvrdu integracije; znamo šta feature radi, koliko košta i šta još nije pokriveno. Korak je završen kada demonstriramo uspešan tok, safe failure i zajedno objasnimo ceo flow bez prikazivanja API ključa.

## 5. Poverljiva napomena za tutora

Nema dodatne napomene.
