# Plan popravki po feedbacku tutora

## Cilj

Učiniti browser smoke pouzdanim i ponovljivim iz jedne komande, a zatim
uskladiti README i projektne evidencije sa stvarnim stanjem repozitorijuma.
Gameplay se ovim izmenama ne menja.

## Predloženi koraci

1. **Izolovati Chromium profil od Vite watcher-a**
   - U `tests/browser-smoke.mjs` kreirati privremeni browser profil u sistemskom
     temp direktorijumu, ne unutar `artifacts/`.
   - Zadržati samo screenshot i rezultate smoke testa u `artifacts/` i osigurati
     gašenje browser procesa i brisanje privremenog profila i kada test padne.

2. **Dodati automatizovanu production proveru**
   - U `package.json` dodati `preview` skriptu za lokalni Vite preview.
   - Dodati `verify` skriptu i mali Node orchestrator koji redom izvršava
     typecheck, testove i build, pokreće preview server, čeka da bude spreman,
     pokreće smoke i na kraju uvek gasi server.
   - Time standardna puna provera postaje jedna komanda: `npm.cmd run verify`.

3. **Uskladiti branch kontekst**
   - U `docs/CONTEXT_MANIFEST.md` navesti da je trenutni pregledani checkout
     `main`.
   - `phase-b/crane-tower-v2` zadržati samo tamo gde opisuje istorijsku feature
     granu ili kontekst u kome je V2 razvijen, da se istorija ne pomeša sa
     trenutnim stanjem.

4. **Razjasniti T030**
   - U `specs/002-crane-tower-gameplay/tasks.md` ukloniti neodređeno
     `(contradicts)` i zameniti ga jasnom napomenom da je kontradikcija razrešena
     ograničavanjem centra aktivnog sprata i usklađivanjem ugovora/testova.
   - T030 ostaje označen kao završen jer je korekcija implementirana i
     verifikovana.

5. **Preurediti README verifikacioni tok**
   - Odvojeno dokumentovati smoke uz već pokrenut dev server, ručni production
     preview smoke i preporučeni automatski `verify` tok.
   - Objasniti da Chromium profil ne sme biti u `artifacts/`, jer Vite watcher na
     Windows-u može dobiti `EBUSY` nad zaključanim `Cookies` fajlom; screenshot
     i dalje bezbedno ostaje u `artifacts/crane-tower/`.

## Provera završetka

- `npm.cmd run verify` prolazi bez ručnog pokretanja ili gašenja servera.
- Smoke prolazi i uz zasebno pokrenut Vite dev server bez `EBUSY` greške.
- Posle provere nema zaostalog preview/browser procesa ni Chromium profila u
  repozitorijumu.
- README komande odgovaraju `package.json`, manifest jasno razlikuje `main` od
  istorijske feature grane, a T030 više nema dvosmislen status.
