# Il Ritrovo della Compagnia — sito

Ricostruzione del sito di [Il Ritrovo della Compagnia](https://www.ilritrovodellacompagnia.it/),
boardgame inclusive club a Vallescuropasso, Cigognola (PV).

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

1. **Coordinate GPS esatte** — in `src/data/site.ts` c'è un valore approssimato,
   usato per i dati strutturati e per la mappa.
2. **Quota del tesseramento CSEN** e link alla pagina di tesseramento online
   scontato (`site.tesseramento.quota` e `site.tesseramento.urlOnline`).
3. **URL della pagina Facebook** — sulla locandina c'è l'icona ma non l'indirizzo
   (`site.social.facebook`).
4. **Codice fiscale / P.IVA dell'associazione** e pagina privacy, per il footer.
5. **Modulo contatti**: vedi "Attivare il modulo contatti".

Ogni punto è segnato con `TODO` nel codice.

---

## Dove si modificano le cose

### Dati del circolo

`src/data/site.ts` — indirizzo, telefono, email, orari, social, tesseramento
CSEN e numeri della hero. Nessun componente ha questi valori scritti dentro: si
cambiano solo qui.

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

### Le foto

In `src/images/` ci sono le fotografie del circolo, tutte 4:3 a 1448×1086.
`scripts/importa-foto.mjs` documenta quale scatto finisce dove.

Assegnazione:

| File                     | Foto                                  |
| ------------------------ | ------------------------------------- |
| `hero.jpg`               | primo piano serale: carte, dadi, birra |
| `circolo.jpg`            | i due soci davanti al cancello         |
| `ludoteca.jpg`           | la pila di giochi davanti agli scaffali |
| `tessera.jpg`            | la sala grande durante una partita     |
| `galleria/galleria-0*.jpg` | ingresso, sala, ludoteca, serata, soci |

Per cambiarle basta sostituire i file mantenendo i nomi, e aggiornare le
didascalie in `src/data/galleria.ts`. Il carosello legge la cartella, quindi
aggiungere o togliere foto dalla galleria funziona da solo.

Il carosello è impostato su 4:3 apposta, per non tagliare le insegne e le teste
delle persone: se un domani arrivano foto 16:9, si cambia `aspect-[4/3]` in
`aspect-video` in `Carosello.astro`.

⚠️ Gli originali sono larghi 1448 px, quindi su schermi molto grandi la hero
può risultare un po' morbida. Se servissero versioni più grandi, vanno chieste
al fotografo — ingrandirle via software peggiorerebbe soltanto.

`npm run placeholders` non sovrascrive più niente: salta i file che esistono
già. Serve `--force` per riportare i segnaposto.

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

**La palette è quella del cliente, campionata dai suoi materiali** — non scelta
a occhio. Dalla locandina ufficiale: fondo nero, rosso `#841418`–`#b81830` per
la fascia e la luna, crema per il lettering. Il crema `#fff1d6` viene invece
campionato direttamente dal PNG del logo, che è più pulito della resa stampata.

**Come si usa il rosso.** Come sulla locandina: sul fondo nero è un riempimento
— titoli grandi, pulsanti, filetti, la luna — mai testo piccolo, dove non
reggerebbe il contrasto (2,2:1). Sulle sezioni pergamena diventa invece colore
del testo, esattamente come il "12 SETTEMBRE" sulla sua toppa di carta strappata.
Il crema sul rosso arriva a 7,6:1, ampiamente sopra la soglia AA.

**Perché non tutto scuro.** Il rischio del tema notturno in questo settore è
sembrare un covo per soli appassionati. Mox Boarding House ha rifatto il proprio
sito proprio per questo: il fondo nero risultava _"forbidding or exclusive for
casual gamers"_. Qui il nero è appena scaldato (`#0e0c0c`, non `#000`: su
schermo retroilluminato il nero puro contro il crema vibra, sulla carta no) e le
sezioni più dense da leggere — ludoteca, prenotazioni, contatti — stanno su
pergamena, che è anche il secondo materiale della locandina.

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
