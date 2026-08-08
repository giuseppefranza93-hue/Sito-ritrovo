import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Events are the only thing on the site that changes weekly, so they live as
 * Markdown files: one file per event, addable from GitHub's web editor without
 * touching any code. Past events drop off the page automatically.
 *
 * The game catalogue is not a collection — it is tabular data and lives in
 * src/data/giochi.json instead.
 */
const eventi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eventi' }),
  schema: z.object({
    titolo: z.string(),
    data: z.date(),
    oraInizio: z.string().describe('HH:MM'),
    /**
     * Free text, matching the categories the client already uses in their
     * admin panel: Boardgame, Pokémon, Magic, GDR, Tornei, Family, Warhammer,
     * D&D, Community, Competitivo, Musica.
     */
    categoria: z.string(),
    /** Shown instead of a single date for recurring nights. */
    ricorrenza: z.string().optional(),
    /** Timetable within the event, as on the Inaugurazione poster. */
    programma: z
      .array(z.object({ orario: z.string(), cosa: z.string() }))
      .optional(),
    posti: z.union([z.number(), z.literal('illimitati')]).default('illimitati'),
    prenotazioneRichiesta: z.boolean().default(false),
    inEvidenza: z.boolean().default(false),
  }),
});

export const collections = { eventi };
