# BRRRR Lab

Aplicație educativă în română pentru înțelegerea strategiei Buy, Rehab, Rent, Refinance, Repeat.

- Cinci lecții interactive și întrebări cu explicații.
- Simulator pentru cumpărare, renovare, refinanțare și chirie.
- Scenarii de risc, glosar și salvarea progresului în browser.

## Deschide aplicația

[BRRRR Lab pe GitHub Pages](https://danielluntras.github.io/brrrr-lab/)

## Pornește local

Cu Node.js instalat, din dosarul proiectului rulează:

```sh
npm start
```

Deschide http://127.0.0.1:4317. Nu există pachete de instalat. Pentru teste: `npm test`.

## Publicare

Fișierele sursă ale aplicației sunt în `docs/`. GitHub Pages publică folderul `/docs` din branch-ul `main`. Modificările trimise pe acest branch actualizează aplicația.

## Ipoteze

Valorile de început sunt fictive, iar calculul este înainte de impozitul pe venit. Dobânda este fixă, cu rate lunare egale și rambursare completă. Procentele de finanțare sunt ipoteze, nu oferte de credit. Moneda schimbă doar unitatea afișată, fără conversie valutară.

Datele de învățare și scenariile rămân în browser, fără sincronizare între dispozitive.

Surse conceptuale: [Chase — strategia BRRRR](https://www.chase.com/personal/mortgage/education/buying-a-home/brrrr-method), [CFPB — refinanțarea cu retragere de bani](https://www.consumerfinance.gov/ask-cfpb/what-other-types-of-loans-are-similar-to-a-heloc-en-253/).
