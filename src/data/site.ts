/**
 * Single source of truth for everything that appears in more than one place.
 *
 * All values below are taken from the client's existing site
 * (ilritrovodellacompagnia.it). Fields still marked TODO are ones that site
 * did not publish either — they need to come from the client directly.
 */

export interface OpeningHours {
  /** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
  day: number;
  label: string;
  /** null = closed that day. */
  opens: string | null;
  closes: string | null;
  /** What that evening is dedicated to, per the client's "Orari indicativi". */
  nota?: string;
}

export const site = {
  name: 'Il Ritrovo della Compagnia',
  shortName: 'Il Ritrovo',
  tagline: 'Circolo ludico analogico',

  /** The client's own positioning line. */
  claim: 'Il punto di ritrovo per chi ama il gioco non digitale',
  motto: 'Tutto si fa con il gioco, nulla si fa per gioco.',
  promessa: 'Circolo inclusivo e non esclusivo.',

  description:
    'Circolo ludico analogico a Valle Scuropasso: giochi da tavolo, Pokémon, Magic e giochi di ruolo. Atmosfera da gilda, energia da torneo, accoglienza da compagnia.',

  address: {
    street: 'SP198, 117',
    postalCode: '27040',
    city: 'Valle Scuropasso',
    province: 'PV',
    region: 'Lombardia',
    country: 'IT',
  },

  email: 'info@ilritrovodellacompagnia.it',
  /** TODO: il sito attuale non pubblica un numero di telefono. Chiederlo al cliente. */
  phone: '',
  phoneHref: '',

  /** Short link taken from the client's existing "Dove siamo" section. */
  mapsUrl: 'https://maps.app.goo.gl/JvZLMrkzNYQFjNqd8',
  /** TODO: coordinate esatte, per la mappa e per i dati strutturati. */
  geo: { lat: 45.0563, lng: 9.2861 },

  social: {
    instagram: 'https://www.instagram.com/ilritrovodellacompagnia/',
    instagramHandle: '@ilritrovodellacompagnia',
  },

  /**
   * Endpoint for the contact form. A static site cannot send email by itself,
   * so this needs a form service (Formspree, Netlify Forms, Web3Forms) or the
   * existing PHP handler. Left empty the site shows a plain email card instead
   * of a form that would silently fail — never ship a form that goes nowhere.
   */
  formEndpoint: '',

  /** Numbers the client already advertises in their hero. */
  numeri: [
    { valore: '80+', etichetta: 'giochi in ludoteca' },
    { valore: '3', etichetta: 'serate fisse a settimana' },
    { valore: 'TCG', etichetta: 'Pokémon, Magic e Commander' },
  ],

  hours: [
    { day: 1, label: 'Lunedì', opens: null, closes: null },
    { day: 2, label: 'Martedì', opens: null, closes: null },
    { day: 3, label: 'Mercoledì', opens: '20:30', closes: '24:00', nota: 'Serata giochi da tavolo' },
    { day: 4, label: 'Giovedì', opens: null, closes: null },
    { day: 5, label: 'Venerdì', opens: '21:00', closes: '01:00', nota: 'TCG e Commander' },
    { day: 6, label: 'Sabato', opens: null, closes: null },
    { day: 0, label: 'Domenica', opens: '15:00', closes: '20:00', nota: 'Famiglie e nuovi giocatori' },
  ] satisfies OpeningHours[],
} as const;

export const navigation = [
  { href: '#circolo', label: 'Il circolo' },
  { href: '#ludoteca', label: 'Ludoteca' },
  { href: '#eventi', label: 'Eventi' },
  { href: '#tessera', label: 'Tessera' },
  { href: '#prenotazioni', label: 'Prenotazioni' },
  { href: '#dove-siamo', label: 'Dove siamo' },
] as const;

export const indirizzoCompleto = `${site.address.street} · ${site.address.postalCode} ${site.address.city} ${site.address.province}`;

/** Monday-first display order, independent of the Date#getDay() numbering. */
export function hoursInWeekOrder(): OpeningHours[] {
  return [...site.hours].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7));
}

/** Only the days the circolo is actually open. */
export function serateFisse(): OpeningHours[] {
  return hoursInWeekOrder().filter((h) => h.opens !== null);
}

/**
 * schema.org opening hours. "24:00" is normalised to "23:59" because the spec
 * expects a valid wall-clock time.
 */
export function openingHoursSpecification() {
  const codes = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return serateFisse().map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: codes[h.day],
    opens: h.opens,
    closes: h.closes === '24:00' ? '23:59' : h.closes,
  }));
}
