<!--
Sync Impact Report
- Version change: template without version -> 1.0.0
- Added principles:
  - I. Specifikacija pre implementacije
  - II. Minimalan Core scope
  - III. Proverljivi dokazi bez izmišljanja
  - IV. Strukturisani ugovor i bezbedan fallback
  - V. Jedna kontrolisana promena
- Added sections:
  - Tehnička i bezbednosna ograničenja
  - Razvojni tok i kontrolne tačke
- Removed sections: none; template placeholders were resolved.
- Follow-up TODOs: none.
-->
# Skyline Stack Constitution

## Core Principles

### I. Specifikacija pre implementacije
Svaka funkcionalnost MORA prvo biti opisana u odobrenoj specifikaciji, sa jasnim
scope-om, očekivanim ponašanjem i proverljivim Definition of Done. Spec Kit tok se
izvršava redom constitution, specify, clarify kada je potrebno, plan i tasks.
Implementacija NE SME početi pre ljudskog pregleda i eksplicitnog odobrenja Faze A.
Ovo sprečava da kod postane neformalna specifikacija.

### II. Minimalan Core scope
Core MORA ostati mala single-player TypeScript browser igra zasnovana na HTML Canvas
API-ju, bez backend-a, baze, mrežnih poziva, deployment-a, framework-a, game engine-a
ili physics biblioteke. Svaka nova zavisnost MORA imati dokumentovanu neposrednu
potrebu. Funkcionalnosti izvan zaključanog GAME_SPEC dokumenta NE SMEJU se dodavati
bez eksplicitnog ljudskog odobrenja.

### III. Proverljivi dokazi bez izmišljanja
Komande, terminalski izlazi, screenshot-ovi, test rezultati, baseline problemi i
doprinosi članova para SMEJU se evidentirati samo ako su stvarno nastali. Nepokrenuta
provera MORA biti označena kao `NOT RUN`, a nepoznata informacija kao `TBD`. Najmanje
jedan unapred neizmišljeni eval MORA pokazati ponovljiv baseline problem pre ciljane
izmene. Dokaz MORA omogućiti drugoj osobi da ponovi proveru.

### IV. Strukturisani ugovor i bezbedan fallback
`GameConfig` MORA imati eksplicitan TypeScript oblik i stvarnu runtime validaciju svih
obaveznih polja, brojčanih i konačnih vrednosti, pozitivnih dimenzija i brzina, kao i
međuodnosa dimenzija i `minOverlap` vrednosti. Nevalidan ulaz NE SME biti korišćen:
aplikacija MORA primeniti poznatu podrazumevanu konfiguraciju, prikazati jedno bezbedno
upozorenje bez privatnih podataka i nastaviti bez rušenja. Tip sam po sebi nije dokaz
runtime validacije.

### V. Jedna kontrolisana promena
Nakon čuvanja kompletnog baseline-a bira se tačno jedan stvarni problem, formuliše
jedna proverljiva hipoteza i pravi jedna najmanja ciljana izmena. Isti zaključani eval
skup MORA biti izvršen pre i posle izmene. Tokom izmene NE SMEJU se menjati početni
prompt, zaključani build prompt, kontekst, `GameConfig` šema, gameplay pravila ili eval
očekivanja. Planirani i stvarni diff MORAJU biti dokumentovani.

## Tehnička i bezbednosna ograničenja

- Dozvoljeni temelj je TypeScript, browser API, HTML, CSS i jedan Canvas prikaz.
- Minimalni build alat i mali test runner dozvoljeni su samo uz obrazloženje u planu.
- Eksterni asset-i, kopirani identitet postojeće igre i nepotrebne animacije nisu
  dozvoljeni.
- Git remote, objavljivanje i deployment nisu dozvoljeni u Sesiji 003.
- Tajne, credential-i, `.env` vrednosti, privatni tokeni i privatni URL-ovi NE SMEJU
  ući u prompt, kod, screenshot ili evidence. Osetljiv izlaz MORA biti redigovan.
- Obavezni starter koji se naknadno otkrije, a nije dostavljen, predstavlja bloker;
  njegova struktura NE SME biti nagađana.

## Razvojni tok i kontrolne tačke

Rad MORA slediti tok: ideja, specifikacija, prompt i kontekst, baseline, eval i dokaz,
hipoteza, jedna kontrolisana izmena, isti eval i evidence. `BUILD_PROMPT_V1.md` i eval
očekivanja MORAJU biti sačuvani pre implementacije. Baseline MORA ostati dostupan kao
lokalni Git identifikator ako je Git prethodno odobren ili kao jasno označen read-only
snapshot. Faza A se završava ljudskim review-om; Faza B ne počinje bez eksplicitnog
odobrenja. Za svaki veći blok beleže se stvarne uloge para i planirana tačka zamene,
bez izmišljanja imena ili aktivnosti.

## Governance

Ovaj ustav ima prednost nad tehničkim planom i taskovima kada je reč o procesu,
dokazima, scope-u i bezbednosti. Izmena ustava zahteva dokumentovan razlog, ljudsko
odobrenje, procenu uticaja na postojeće artefakte i semantičko verzionisanje: MAJOR za
nekompatibilnu promenu načela, MINOR za novo ili materijalno prošireno pravilo, PATCH
za pojašnjenje bez promene značenja. Svaki pregled specifikacije, plana, taskova i
evidence dokumenta MORA proveriti usklađenost sa ovim načelima. Konflikt koji menja
scope zaustavlja rad dok čovek ne donese odluku.

**Version**: 1.0.0 | **Ratified**: 2026-09-20 | **Last Amended**: 2026-09-20
