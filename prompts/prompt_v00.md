Želim da u potpuno praznom projektnom folderu, uz pomoć Spec Kit-a i Spec-Driven Development pristupa, napravimo malu retro-inspired browser igru i sprovedemo kompletan proces za Sesiju 003: od ideje do proverljivog dokaza.

Naziv projekta je **Skyline Stack**.

## Početno stanje

Ovo je prvi projektni korak. Trenutno ne postoji:

* Git repozitorijum;
* Git remote;
* starter projekat;
* `package.json`;
* izvorni kod;
* testovi;
* postojeća tehnička dokumentacija;
* baseline verzija;
* utvrđene komande za instalaciju, pokretanje ili testiranje.

Nemoj tvrditi da bilo šta od navedenog postoji. Nemoj izmišljati fajlove, komande, rezultate, testove, screenshot-ove, baseline probleme ili tehničke odluke koje još nisu napravljene.

Pre drugih aktivnosti sačuvaj kompletan sadržaj ovog početnog prompta, bez prepravljanja, u:

```text
prompts/prompt_v00.md
```

Ovaj prompt predstavlja prvi dokumentovani AI poziv. Ne menjaj ga retroaktivno nakon što dobiješ rezultate.

## Obavezno ponašanje pre rada

Pre nego što kreiraš ili menjaš bilo šta:

1. Sažmi svoje razumevanje zadatka.
2. Navedi plan u nekoliko jasnih koraka.
3. Navedi važne nejasnoće i pretpostavke.
4. Objasni kako će Spec Kit biti inicijalizovan u praznom folderu.
5. Ako inicijalizacija zahteva izbor integracije, instalaciju alata ili kreiranje lokalnog Git repozitorijuma, objasni to pre izvršavanja.
6. Ne kreiraj Git remote.
7. Ne objavljuj projekat.
8. Ne radi deployment.
9. Ne proširuj scope bez mog eksplicitnog odobrenja.
10. Ne predstavljaj `TBD`, `NOT RUN` ili nepotvrđenu pretpostavku kao stvarni rezultat.
11. Ne pokreći paralelne agente za Core zadatak.
12. Pre svakog većeg AI koraka navedi šta očekuješ da se promeni i kojim signalom će rezultat biti proveren.

## Glavni cilj Sesije 003

Do kraja Sesije 003 moraju postojati:

1. `GAME_SPEC.md` sa jasnim scope-om i Definition of Done;
2. `BUILD_PROMPT_V1.md`, sačuvan pre prve veće implementacije;
3. `CONTEXT_MANIFEST.md`;
4. sačuvana baseline verzija ili precizno dokumentovan bloker;
5. strukturisan deo igre sa stvarnom runtime validacijom;
6. najmanje četiri eval slučaja;
7. najmanje jedan eval koji pokazuje stvaran problem baseline verzije;
8. jedna hipoteza i tačno jedna kontrolisana promena;
9. isti eval skup izvršen pre i posle promene;
10. `EVIDENCE_003.md` sa stvarnim komandama i rezultatima;
11. početni `AI_USAGE_LOG.md`;
12. dokumentovan doprinos oba člana para i tačke zamene uloga.

## Obavezni redosled rada

Prati sledeću narativnu liniju:

```text
IDEJA
-> SPECIFIKACIJA
-> PROMPT + KONTEKST
-> BASELINE
-> EVAL + DOKAZ
-> HIPOTEZA
-> JEDNA KONTROLISANA IZMENA
-> ISTI EVAL
-> EVIDENCE
```

Rad je podeljen u dve faze sa obaveznom kontrolnom tačkom.

### Faza A — Specifikacija i planiranje

Koristi Spec Kit korake sledećim redosledom:

1. constitution;
2. specify;
3. clarify, ako postoje važne nejasnoće;
4. plan;
5. tasks.

U ovoj fazi:

* definiši projekat;
* napravi Spec Kit artefact-e;
* napravi obavezne projektne dokumente;
* definiši očekivanja eval slučajeva;
* napravi `BUILD_PROMPT_V1.md`;
* nemoj implementirati igru;
* nemoj pokretati `implement`;
* nemoj upisivati izmišljene baseline rezultate.

Posle Faze A obavezno se zaustavi i zatraži moj pregled i odobrenje.

### Faza B — Implementacija i dokaz

Fazu B započni samo nakon eksplicitnog odobrenja.

U Fazi B:

1. koristi zaključani `BUILD_PROMPT_V1.md`;
2. implementiraj samo minimalnu baseline verziju;
3. pokreni stvarne provere;
4. sačuvaj baseline pre bilo kakve ciljane popravke;
5. izvrši unapred definisane eval slučajeve;
6. pronađi i dokumentuj stvaran baseline problem;
7. formuliši jednu hipotezu;
8. napravi tačno jednu najmanju izmenu;
9. ponovi isti eval skup;
10. zabeleži stvarne rezultate i ograničenja.

Ne prelazi sa baseline-a na popravku dok baseline nije sačuvan i dokumentovan.

# Ideja igre

Skyline Stack je mala single-player retro-inspired browser igra u kojoj igrač gradi toranj preciznim spuštanjem blokova.

Aktivni blok se automatski kreće horizontalno iznad poslednjeg postavljenog bloka. Igrač bira trenutak spuštanja. Deo aktivnog bloka koji nema horizontalno preklapanje sa prethodnim blokom se odseca, pa naredni blok postaje uži.

Cilj je postaviti što više blokova i ostvariti što veći score. Potpuni promašaj završava partiju.

Ne kopiraj naziv, logo, muziku, asset-e, likove ili kompletan vizuelni identitet postojeće igre. Inspiracija je ograničena na osnovnu gameplay mehaniku slaganja blokova.

## Kontrole

* `Space`: spusti aktivni blok;
* levi klik ili tap: spusti aktivni blok;
* `R` ili dugme `Restart`: pokreni novu partiju nakon game over-a.

Držanje tastera ne sme proizvesti više drop akcija za isti blok. Jedan pritisak predstavlja najviše jednu prihvaćenu akciju.

## Osnovni game loop

1. Igra prikazuje početnu bazu tornja i jedan aktivni blok.
2. Aktivni blok se automatski kreće horizontalno.
3. Blok se odbija od leve i desne granice canvas-a.
4. Igrač pritisne `Space` ili klikne da započne pad.
5. Tokom pada blok se kreće samo vertikalno.
6. Na kontaktu se računa horizontalno preklapanje sa poslednjim postavljenim blokom.
7. Ako je preklapanje dovoljno, postavlja se samo preklopljeni deo.
8. Score raste za tačno 1.
9. Sledeći aktivni blok dobija širinu uspešno postavljenog dela.
10. Ako nema minimalnog preklapanja, partija se završava.
11. Restart vraća igru u potpuno početno stanje.

## Win i lose uslov

Igra nema konačan win ekran. Uspeh se meri najvećim dostignutim score-om.

Igrač gubi kada:

```text
overlap < minOverlap
```

Nakon game over-a:

* aktivni gameplay prestaje;
* dodatni input ne menja score;
* rezultat ostaje vidljiv;
* igrač može da pokrene novu partiju.

## Ključna gameplay pravila

Specifikacija mora precizno definisati najmanje sledeća pravila:

1. U jednom trenutku postoji tačno jedan aktivan blok.
2. Aktivni blok se u stanju `moving` kreće samo horizontalno.
3. Aktivni blok ostaje unutar horizontalnih granica canvas-a.
4. Drop input se prihvata samo kada je stanje igre `playing`, a stanje bloka `moving`.
5. Tokom pada nema horizontalnog pomeranja.
6. Preklapanje se računa kao presek horizontalnih intervala aktivnog i prethodnog bloka.
7. Ako je `overlap >= minOverlap`, postavlja se samo preklopljeni deo.
8. Score raste tačno za 1 samo nakon uspešnog postavljanja.
9. Ako je `overlap < minOverlap`, igra prelazi u `gameOver`.
10. Restart potpuno resetuje score, blokove, input stanje i game state.

# Minimalni vizuelni zahtev

Planiraj browser aplikaciju sa:

* jednim HTML Canvas prikazom;
* jasnom pozadinom;
* bazom tornja;
* postavljenim blokovima;
* jednim aktivnim blokom;
* čitljivim score prikazom;
* statusom `Ready`, `Playing` ili `Game Over`;
* kratkim prikazom kontrola;
* dugmetom `Restart`;
* jednostavnom originalnom retro paletom;
* geometrijskim oblicima bez eksternih asset-a.

Vizuelni dizajn nije primarni cilj. Ne dodaj kompleksne animacije samo radi izgleda.

# Strukturisani ugovor i runtime validacija

Najmanje jedan deo sistema mora imati strukturisan ugovor.

Koristi sledeći oblik:

```ts
type GameConfig = {
  canvasWidth: number;
  canvasHeight: number;
  startingBlockWidth: number;
  blockHeight: number;
  moveSpeed: number;
  fallSpeed: number;
  minOverlap: number;
};
```

Dokumentacija, implementacija i testovi moraju pokazati:

* očekivani oblik;
* validan primer;
* najmanje jedan nevalidan primer;
* stvarnu runtime validaciju;
* ponašanje kada ulaz nije validan.

Validator mora proveravati:

* da su sva obavezna polja prisutna;
* da su vrednosti brojevi;
* da vrednosti nisu `NaN`;
* da vrednosti nisu `Infinity`;
* da dimenzije i brzine imaju pozitivne vrednosti;
* da `startingBlockWidth <= canvasWidth`;
* da `blockHeight < canvasHeight`;
* da je `minOverlap > 0`;
* da je `minOverlap <= startingBlockWidth`.

TypeScript tip sam po sebi nije runtime validacija.

Za nevalidnu konfiguraciju koristi jasno dokumentovanu politiku:

1. nevalidne vrednosti se ne koriste;
2. primenjuje se poznata podrazumevana konfiguracija;
3. prikazuje se jedno bezbedno upozorenje;
4. aplikacija se ne ruši;
5. upozorenje ne sadrži tajne ili privatne podatke.

# Tehnička granica

Pošto ne postoji dostavljeni starter, to mora biti transparentno navedeno u dokumentaciji.

Predloži najmanju dovoljnu početnu postavku:

* TypeScript;
* browser aplikacija;
* HTML/CSS/Canvas;
* minimalni build alat samo ako je potreban;
* mali test runner kompatibilan sa izabranom postavkom;
* bez backend-a;
* bez baze;
* bez mrežnih poziva;
* bez deployment infrastrukture;
* bez nepotrebnog framework-a.

Nemoj automatski birati React, game engine ili physics biblioteku ako se projekat može jasno realizovati pomoću TypeScript-a i Canvas API-ja.

Tehnički plan mora objasniti zašto je svaki alat potreban.

Ako se naknadno utvrdi da postoji obavezni starter koji nije dostavljen, zaustavi tehničku implementaciju i prijavi precizan bloker umesto da nagađaš njegovu strukturu.

# OUT OF SCOPE

Core verzija ne uključuje:

* lokalni ili online multiplayer;
* login i korisničke naloge;
* online leaderboard;
* backend;
* bazu;
* WebSocket;
* matchmaking;
* deployment;
* procedural generation;
* nivoe ili mapu grada;
* izbor zgrada;
* protivnike;
* AI-controlled enemy;
* živote;
* power-up elemente;
* custom muziku ili audio;
* preuzete ili kopirane asset-e;
* kompleksnu physics biblioteku;
* trajno čuvanje rezultata;
* dodatne game mode-ove;
* AI Hint;
* tool calling;
* funkcionalnosti Sesije 004;
* novu infrastrukturu koja nije neophodna za Core.

# Obavezna struktura dokumentacije

Pored standardnih Spec Kit artefact-a, napravi:

```text
/
├── prompts/
│   └── prompt_v00.md
├── docs/
│   ├── GAME_SPEC.md
│   ├── BUILD_PROMPT_V1.md
│   ├── CONTEXT_MANIFEST.md
│   ├── EVALS.md
│   ├── EVIDENCE_003.md
│   └── AI_USAGE_LOG.md
├── src/
├── tests/
├── README.md
└── package.json
```

`src/`, `tests/`, `README.md` i `package.json` nastaju tek u odgovarajućoj fazi. Ne prikazuj ih kao postojeće pre nego što budu stvarno kreirani.

# Zahtevi za GAME_SPEC.md

Pre prve velike implementacije zaključaj scope u `docs/GAME_SPEC.md`.

Dokument mora da sadrži:

* naziv projekta;
* opis igre u 3–5 rečenica;
* cilj igrača;
* kontrole;
* osnovni game loop;
* win/lose uslov;
* 5–8 ključnih pravila;
* strukturisanu konfiguraciju;
* minimalni vizuelni zahtev;
* eksplicitan `OUT OF SCOPE`;
* proverljiv Definition of Done.

Definition of Done mora sadržati proverljive stavke, uključujući:

* pokretanje browser aplikacije;
* prikaz canvas-a, score-a i statusa;
* horizontalno kretanje aktivnog bloka;
* validno spuštanje;
* odsecanje dela bez preklapanja;
* povećanje score-a za tačno 1;
* game over pri promašaju;
* potpun restart;
* runtime validaciju konfiguracije;
* najmanje četiri eval slučaja;
* sačuvan baseline;
* isti eval pre i posle jedne izmene;
* evidence bez izmišljenih rezultata.

# Zahtevi za BUILD_PROMPT_V1.md

`docs/BUILD_PROMPT_V1.md` mora postojati pre prve veće implementacije.

Mora početi ovako ili veoma slično:

```text
Pre implementacije:
1. Sažmi razumevanje zadatka.
2. Navedi plan u nekoliko koraka.
3. Navedi nejasnoće ili pretpostavke.
4. Ne proširuj scope bez eksplicitnog razloga i odobrenja.
```

Prompt mora sadržati:

1. ulogu coding agenta;
2. cilj i očekivani rezultat;
3. granice i funkcionalnosti koje agent ne sme da doda;
4. tehnički kontekst;
5. listu relevantnih Spec Kit i projektnih fajlova;
6. gameplay pravila;
7. strukturisani `GameConfig`;
8. zahtev za runtime validaciju;
9. Definition of Done;
10. dozvoljene fajlove ili oblasti izmene;
11. zabranjene oblasti izmene;
12. stvarne provere koje agent mora da izvrši;
13. zahtev za listu promenjenih fajlova;
14. zahtev za stvarne komande i rezultate;
15. zahtev da prijavi prvi vidljivi problem ili rizik baseline-a;
16. zabranu proširivanja scope-a bez odobrenja.

Dozvoljene oblasti baseline izmene treba da budu ograničene na:

* `src/`;
* `tests/`;
* minimalne HTML/CSS entry fajlove;
* `package.json` i tehničke konfiguracije samo kada su neophodne za dogovoreni minimalni setup;
* `README.md` za stvarne komande;
* evidence dokumente samo za stvarne rezultate.

Prompt ne sme dozvoliti agentu da promeni:

* `GAME_SPEC.md`;
* `BUILD_PROMPT_V1.md`;
* očekivanja eval slučajeva nakon što vidi rezultate;
* `prompt_v00.md`.

# Zahtevi za CONTEXT_MANIFEST.md

U `docs/CONTEXT_MANIFEST.md` za svaki važan izvor navedi:

| Izvor | Uključen? | Zašto? | Prioritet | Rizik |
| ----- | --------- | ------ | --------- | ----- |

Manifest mora obuhvatiti najmanje:

* `GAME_SPEC.md`;
* `BUILD_PROMPT_V1.md`;
* Spec Kit specification;
* Spec Kit technical plan;
* Spec Kit tasks;
* projektni zadatak;
* `README.md`, sa tačnim statusom da li postoji;
* `package.json`, sa tačnim statusom da li postoji;
* relevantni `src/` fajlovi, sa tačnim statusom;
* relevantni testovi, sa tačnim statusom;
* stari chat transcript;
* slučajne web primere;
* kod i asset-e postojeće igre;
* tajne i `.env` vrednosti.

Dokument mora eksplicitno odgovoriti:

* Šta je model stvarno dobio?
* Šta je namerno izostavljeno?
* Koji izvor ima prioritet kada se informacije razlikuju?

Pravila prioriteta:

1. `GAME_SPEC.md` ima prioritet za gameplay i scope.
2. `BUILD_PROMPT_V1.md` ima prioritet za dozvoljeni implementacioni rad.
3. Spec Kit plan ima prioritet za dogovorenu tehničku strukturu.
4. Stvarni `package.json` i konfiguracija imaju prioritet za postojeće komande.
5. Ako postoji konflikt koji menja scope, zaustavi se i traži odluku.
6. Stari chat i slučajni web primeri nisu autoritativni izvori.

# Zahtevi za EVALS.md

U `docs/EVALS.md` pre izvršavanja zapiši očekivanje za najmanje četiri slučaja.

Koristi tabelu:

| ID | Ulaz ili scenario | Očekivanje | Baseline | Posle izmene | Status | Dokaz |
| -- | ----------------- | ---------- | -------- | ------------ | ------ | ----- |

## E1 — tipičan scenario

Scenario:

* pokretanje sa validnom konfiguracijom;
* aktivni blok se pomera;
* igrač uspešno postavlja blok sa jasnim preklapanjem.

Očekivanje:

* igra se pokreće;
* nema runtime greške;
* blok se postavlja;
* score raste sa 0 na 1;
* kreira se novi aktivni blok.

## E2 — boundary scenario

Scenario:

```text
overlap === minOverlap
```

Očekivanje:

* postavljanje je prihvaćeno;
* postavljeni blok ima širinu `minOverlap`;
* score raste za 1;
* igra ne prelazi u `gameOver`.

Ovo očekivanje mora biti zapisano pre pokretanja testa.

## E3 — nevalidan scenario

Scenario:

* nedostaje obavezno polje konfiguracije; ili
* `minOverlap` je 0, negativan, `NaN` ili veći od `startingBlockWidth`.

Očekivanje:

* nevalidna konfiguracija se ne koristi;
* aktivira se dokumentovani safe fallback;
* prikazuje se bezbedno upozorenje;
* aplikacija se ne ruši.

## E4 — stvarni baseline propust

E4 se ne izmišlja unapred.

Pre baseline-a upiši:

```text
TBD — biće definisan na osnovu prvog stvarnog i ponovljivog baseline problema.
```

Nakon što se problem uoči:

1. opiši precizan scenario;
2. zapiši očekivano ponašanje;
3. definiši način reprodukcije;
4. ponovo pokreni scenario na sačuvanom baseline-u;
5. upiši stvarni rezultat;
6. označi baseline kao `FAIL`;
7. ne menjaj scenario tokom popravke.

Najmanje jedan eval mora imati stvaran `FAIL` na baseline-u.

Dok test nije stvarno pokrenut, koristi `NOT RUN`, a ne `PASS`.

# Čuvanje baseline-a

Pre prve ciljane izmene obavezno sačuvaj:

* zaključani `BUILD_PROMPT_V1.md`;
* korišćeni kontekst;
* Spec Kit artefact-e;
* kompletnu baseline verziju;
* screenshot ili drugi odgovarajući vizuelni dokaz;
* komandu za pokretanje;
* stvarni terminal output;
* status početnih testova;
* prvi vidljivi problem;
* baseline rezultate za E1–E4.

Pre početka implementacije predloži proverljiv način čuvanja baseline-a.

Dozvoljene opcije su:

* lokalni Git commit ili tag, ako je lokalni Git prethodno odobren; ili
* jasno označen read-only baseline snapshot/arhiva, ako Git nije korišćen.

Ne kreiraj Git remote.

Baseline ne sme biti obrisan, prepisan ili zamenjen finalnom verzijom.

# Jedna hipoteza i jedna kontrolisana promena

Nakon baseline eval-a izaberi samo jedan problem.

U `EVIDENCE_003.md` zapiši:

```text
Tvrdnja:
Signal:
Hipoteza:
Najmanja promena:
Provera:
Rezultat:
Ograničenje:
```

Pravila:

* tvrdnja mora opisati konkretan problem;
* signal mora biti test, reprodukcija ili vidljiv rezultat;
* hipoteza mora objasniti verovatan uzrok;
* najmanja promena mora biti usko ograničena;
* provera mora koristiti isti eval scenario;
* rezultat mora biti stvaran;
* ograničenje mora navesti šta promena još ne dokazuje.

Tokom ove izmene nemoj istovremeno menjati:

* početni prompt;
* `BUILD_PROMPT_V1.md`;
* kontekst;
* `GameConfig` šemu;
* gameplay pravila;
* eval očekivanja;
* više nepovezanih delova koda.

Pre izmene prikaži planirani mali diff. Posle izmene prikaži stvarni diff.

# Zahtevi za EVIDENCE_003.md

`docs/EVIDENCE_003.md` u Fazi A napravi kao template, a u Fazi B popuni samo stvarnim rezultatima.

Dokument mora sadržati:

* početnu nameru i tvrdnju;
* scope projekta;
* identifikator ili lokaciju sačuvanog baseline-a;
* korišćeni `BUILD_PROMPT_V1.md`;
* korišćeni kontekst;
* komande za instalaciju, build, test i pokretanje;
* stvarni output relevantnih komandi;
* screenshot ili lokaciju dokaza;
* početni status testova;
* eval tabelu pre izmene;
* izabrani problem;
* hipotezu;
* jednu kontrolisanu promenu;
* diff summary;
* isti eval posle izmene;
* konačan rezultat;
* poznato ograničenje;
* doprinos oba člana para;
* instrukcije pomoću kojih druga osoba može ponoviti proveru.

Ne izmišljaj:

* komande;
* terminal output;
* screenshot;
* PASS status;
* baseline problem;
* test rezultat;
* diff;
* doprinos člana para.

Ako nešto nije izvršeno, označi ga kao `NOT RUN`. Ako informacija još nije poznata, koristi `TBD`.

# AI_USAGE_LOG.md

U `docs/AI_USAGE_LOG.md` vodi tabelu:

|  # | Faza | Zašto je AI pozvan | Šta se očekivalo | Rezultat | Sledeća odluka |
| -: | ---- | ------------------ | ---------------- | -------- | -------------- |

Zabeleži najmanje:

1. ovaj početni prompt i Spec Kit planiranje;
2. poziv za baseline implementaciju;
3. poziv za ciljanu izmenu, ako je AI korišćen;
4. AI pregled diff-a, ako je urađen.

Za svaki veći poziv zabeleži:

* konkretan cilj;
* očekivani signal uspeha;
* stvarni rezultat;
* sledeću odluku.

Ne čuvaj privatni chain-of-thought.

Ako okruženje prikazuje broj tokena ili trošak, zabeleži dostupnu vrednost. Ako ne prikazuje, napiši:

```text
Usage podatak nije dostupan u korišćenom okruženju.
```

Ne izmišljaj potrošnju.

# Rad u paru

Za svaki veći blok zabeleži:

* ko je bio vozač;
* ko je bio posmatrač;
* šta je vozač izvršio ili poslao agentu;
* šta je posmatrač proveravao;
* tačku zamene uloga;
* rezultat bloka.

Kod AI-assisted rada:

* vozač upravlja Spec Kit ili coding-agent tokom, bira sledeći odobreni zadatak i pokreće provere;
* posmatrač proverava očekivanje pre poziva, a zatim diff i rezultat;
* agent generiše izmene, ali ljudi ostaju odgovorni za odobravanje i proveru.

Planiraj sledeće tačke zamene:

1. posle prve verzije specifikacije, pre korekcija;
2. posle prve verzije tehničkog plana, pre task liste;
3. posle prvog uspešnog baseline pokretanja ili preciznog blokera;
4. nakon zapisivanja eval očekivanja, pre beleženja stvarnih rezultata;
5. nakon ciljane izmene, pre ponavljanja eval-a.

# Bezbednost

Nikada ne stavljaj u prompt, kod, screenshot ili evidence:

* API ključ;
* credential;
* `.env` vrednosti;
* privatni token;
* privatni URL;
* nepotreban privatni payload;
* raw stack trace koji sadrži osetljive podatke.

Ako komanda prikaže osetljivu vrednost, rediguj je pre čuvanja dokaza i jasno označi da je redigovana.

# Definition of Done za Sesiju 003

Sesija 003 je završena tek kada se može proveriti da:

* [ ] `prompts/prompt_v00.md` sadrži originalni početni prompt;
* [ ] Spec Kit je inicijalizovan ili postoji precizan dokumentovan bloker;
* [ ] `GAME_SPEC.md` ima mali scope i proverljiv Definition of Done;
* [ ] `BUILD_PROMPT_V1.md` postoji od pre prve velike implementacije;
* [ ] `CONTEXT_MANIFEST.md` navodi uključene i izostavljene izvore;
* [ ] baseline postoji i nije zamenjen finalnom verzijom;
* [ ] postoji komanda za pokretanje i njen stvarni output;
* [ ] postoji početni status testova;
* [ ] postoji strukturisani `GameConfig`;
* [ ] postoji validan primer konfiguracije;
* [ ] postoji nevalidan primer konfiguracije;
* [ ] postoji stvarna runtime validacija;
* [ ] dokumentovano je ponašanje pri nevalidnom ulazu;
* [ ] postoje najmanje četiri eval slučaja;
* [ ] očekivanja su zapisana pre izvršavanja;
* [ ] najmanje jedan eval pokazuje stvaran baseline problem;
* [ ] isti eval skup je izvršen pre i posle promene;
* [ ] postoji samo jedna dokumentovana hipoteza;
* [ ] napravljena je samo jedna kontrolisana izmena;
* [ ] promena ima tvrdnju, signal, proveru, rezultat i ograničenje;
* [ ] `EVIDENCE_003.md` sadrži stvarne rezultate i komande;
* [ ] druga osoba može da ponovi proveru;
* [ ] doprinos oba člana para je dokumentovan;
* [ ] zamene uloga su dokumentovane;
* [ ] `AI_USAGE_LOG.md` beleži važne AI pozive;
* [ ] nema tajni u kodu ili dokumentaciji;
* [ ] nisu dodati multiplayer, backend, baza ili deployment;
* [ ] funkcionalnosti Sesije 004 nisu prerano implementirane.

# Završni izveštaj za Fazu A

Pre prve implementacije prikaži:

1. koje Spec Kit korake si izvršio;
2. koje Spec Kit artefact-e si napravio;
3. koje dokumente si napravio u `docs/`;
4. koje tehničke odluke predlažeš i zašto;
5. koje pretpostavke si napravio;
6. koje nejasnoće ostaju;
7. šta još nije testirano;
8. da li je `BUILD_PROMPT_V1.md` spreman za zaključavanje;
9. da li je dokumentacija spremna za ljudski review;
10. koji je sledeći korak, ali ga nemoj izvršiti bez odobrenja.

# Završni izveštaj za Fazu B

Nakon implementacije i dokaza prikaži:

1. lokaciju sačuvanog baseline-a;
2. listu promenjenih fajlova;
3. stvarne izvršene komande;
4. stvarne rezultate komandi;
5. baseline rezultate E1–E4;
6. koji eval je pokazao stvaran problem;
7. zapisanu hipotezu;
8. tačno jednu napravljenu izmenu;
9. diff summary te izmene;
10. rezultate istog eval skupa posle izmene;
11. poznato ograničenje;
12. doprinos oba člana para;
13. status svake stavke Definition of Done liste.

Ne proglašavaj Sesiju 003 završenom ako bilo koja obavezna stavka nema dokaz. Umesto toga navedi precizan bloker, očekivani rezultat, stvarni rezultat, izvršene provere i sledeće usko pitanje.
