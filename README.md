# Il Ritrovo della Compagnia — sito

Ricostruzione del sito di [Il Ritrovo della Compagnia](https://www.ilritrovodellacompagnia.it/),
circolo ludico analogico a Valle Scuropasso (PV).

Sito statico: nessun server da mantenere, nessun database, tempi di caricamento
sotto il secondo anche da mobile in 3G.

## Stack

| Cosa            | Perché                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| **Astro 7**     | Genera HTML statico. Zero JavaScript tranne dove serve davvero (carosello, filtri). |
| **Tailwind 4**  | Design system nei token CSS di `src/styles/global.css`, non sparso nei componenti.  |
| **Embla**       | Carosello: ~4 kB, supporto tastiera e swipe, nessuna dipendenza.                    |
| **Fontsource**  | Font self-hosted (Fraunces + Inter). Nessuna chiamata a Google Fonts, GDPR-safe.    |

## Comandi

```bash
npm install
npm run dev          # sviluppo su http://localhost:4321
npm run build        # build di produzione in dist/
npm run preview      # anteprima della build
npm run check        # type-check
npm run placeholders # rigenera le immagini segnaposto
```

Si pubblica caricando `dist/` su qualsiasi hosting statico (Netlify, Cloudflare
Pages, Vercel) oppure via FTP sull'hosting Aruba attuale.

---

## Cosa manca prima di andare online

Sono le uniche cose che bloccano la pubblicazione. Tutto il resto è pronto.

1. **Le foto.** Ora ci sono segnaposto generati. Vedi "Sostituire le foto".
2. **Numero di telefono** — non è pubblicato sul sito attuale. Se il circolo ne
   ha uno, va in `src/data/site.ts`.
3. **Coordinate GPS esatte** — in `src/data/site.ts` c'è un valore approssimato,
   usato per i dati strutturati e per la mappa.
4. **Quote associative** — la sezione tessera descrive il funzionamento ma non
   espone importi, perché non erano pubblicati.
5. **Codice fiscale / P.IVA dell'associazione** e pagina privacy, per il footer.
6. **Modulo contatti**: vedi "Attivare il modulo contatti".

Ogni punto è segnato con `TODO` nel codice.

---

## Dove si modificano le cose

### Dati del circolo

`src/data/site.ts` — indirizzo, email, orari, Instagram, numeri della hero.
Nessun componente ha questi valori scritti dentro: si cambiano solo qui.

### Eventi

Un file Markdown per evento in `src/content/eventi/`. Si può fare dall'editor
web di GitHub, senza toccare il codice.

```markdown
---
titolo: Torneo di Commander
data: 2026-10-17
oraInizio: '21:00'
categoria: Magic
ricorrenza: Ogni terzo venerdì # opzionale: se c'è, al posto della data si mostra questa
posti: 16 # oppure: illimitati
prenotazioneRichiesta: true
inEvidenza: true
---

Descrizione dell'evento, due o tre righe.
```

Gli eventi con data passata spariscono da soli. Quelli con `ricorrenza`
restano sempre, nel blocco "Ogni settimana".

### Catalogo giochi

`src/data/giochi.json` — 80 titoli, importati dal sito attuale. Per aggiungerne
uno basta una riga:

```json
{
  "titolo": "Nome del gioco",
  "giocatoriMin": 2,
  "giocatoriMax": 4,
  "giocatori": "2–4",
  "durata": "45 min",
  "difficolta": "media",
  "disponibilita": "subito"
}
```

`difficolta` accetta `facile`, `media`, `alta`. I filtri della pagina si
aggiornano da soli.

### Sostituire le foto

Le immagini in `src/images/` sono segnaposto generati da
`scripts/generate-placeholders.mjs`. Per usare le foto vere:

1. Sostituire i file in `src/images/galleria/` mantenendo i nomi
   (`galleria-01.jpg` … `galleria-08.jpg`). Formato 16:9, almeno 1600×900.
   Se ne servono di più o di meno, basta aggiungere/togliere file: il carosello
   li legge dalla cartella.
2. Aggiornare le didascalie in `src/data/galleria.ts`.
3. Sostituire `hero.jpg` (verticale abbondante, almeno 2400×1600),
   `circolo.jpg`, `ludoteca.jpg`, `tessera.jpg` (4:3) e `og.jpg` (1200×630,
   è l'anteprima quando si condivide il link su WhatsApp e Facebook).

Astro converte tutto in WebP/AVIF e genera le dimensioni responsive da solo.

### Il logo

I file in `public/logo/` sono quelli originali del cliente, presi dal sito
attuale — non ridisegnati:

- `logo-ritrovo-light.png` — logo completo, crema, per fondi scuri.
- `logo-semplificato.png` — solo il simbolo (luna e spada), nero, per fondi chiari.
- `logo-semplificato-crema.png` — lo stesso simbolo ricolorato in crema, generato
  per le superfici scure e per la favicon.

⚠️ Il logo completo esiste **solo** in versione crema. Il sito lo usa sempre su
fondo scuro, quindi va bene così; se in futuro servisse su fondo chiaro, occorre
chiedere al cliente la versione scura del file originale.

---

## Il confine con il backend attuale

Il sito attuale non è solo un sito: contiene un'applicazione in PHP + MySQL con
registrazione soci, credito interno, ricariche PayPal, barcode Code 39 della
tessera, pannello amministratore, import da Instagram e newsletter.

**Un sito statico non può fare niente di tutto questo.** Questa ricostruzione
copre la parte pubblica — presentare il circolo, la ludoteca, gli eventi, e
portare la persona a iscriversi o a prenotare. Le sezioni "Tessera" e
"Prenotazioni" spiegano come funziona e poi rimandano all'applicazione.

Due costanti da collegare quando si decide dove vive l'applicazione:

- `urlIscrizione` in `src/components/Tessera.astro`
- `urlPrenotaEvento` e `urlTavoloPersonalizzato` in `src/components/Prenotazioni.astro`

Puntarle alle pagine PHP esistenti è sufficiente per andare online.

### Attivare il modulo contatti

Il form di contatto compare solo se `site.formEndpoint` in `src/data/site.ts` ha
un valore. Finché è vuoto, la sezione mostra un invito a scrivere via email —
scelta voluta: un modulo che non recapita niente è peggio di nessun modulo,
perché chi scrive crede di aver mandato il messaggio.

Per attivarlo basta l'URL di un servizio come Formspree, Netlify Forms o
Web3Forms, oppure dello script PHP già esistente.

---

## Scelte progettuali

**Perché scuro.** Il logo del cliente è un disegno a linee color crema (#fff1d6,
campionato dal file originale) con luna e spada: è nato per stare su fondo
scuro. La palette parte da lì.

**Perché non tutto scuro.** Il rischio del tema notturno in questo settore è
sembrare un covo per soli appassionati. Mox Boarding House ha rifatto il proprio
sito proprio per questo: il fondo nero risultava _"forbidding or exclusive for
casual gamers"_. Qui il fondo è un verde-nero caldo, mai nero puro, e le sezioni
più dense da leggere — ludoteca, prenotazioni, contatti — stanno su pergamena
chiara.

**Struttura.** L'ordine delle sezioni segue quello del sito attuale, con la
galleria spostata subito dopo la presentazione: è la cosa che fa capire più in
fretta a uno sconosciuto com'è il posto.

**Niente mappa incorporata.** Un iframe di Google Maps installa cookie di terze
parti e su un sito italiano si porta dietro il banner di consenso per un
riquadro decorativo. C'è una scheda con l'indirizzo e il link diretto alle
indicazioni stradali: stesso risultato, nessun banner.

**Accessibilità e prestazioni.** Carosello navigabile da tastiera e senza
autoplay, `prefers-reduced-motion` rispettato, skip link, focus visibile,
immagini responsive, font self-hosted. La ludoteca funziona anche senza
JavaScript.

**SEO locale.** Dati strutturati `EntertainmentBusiness` con indirizzo,
coordinate e orari di apertura: è quello che alimenta il pannello Google e le
ricerche "ludoteca vicino a me", da dove arriva davvero il traffico di un locale.
