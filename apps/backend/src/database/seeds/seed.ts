// seed.ts
// Seeds the beer database from the Open Beer Database dump
// (https://github.com/brewdega/open-beer-database-dumps).
//
// Strategy:
//   1. Import all breweries, keeping their original OBDB id in `sourceId`.
//   2. Build an in-memory map  sourceId -> Brewery  (one query, no N+1).
//   3. Import beers, resolving each beer's `brewery_id` against that map.
//      Beers whose brewery_id is missing / -1 / unknown are inserted with
//      brewery = null and logged, instead of being silently dropped.
//
// Assumes the schema already exists (run the app once in dev, where
// synchronize is on, or apply migrations) before seeding.
//
// Run:  npm run backend:seed

import 'reflect-metadata';
import AppDataSource from '../data-source';
import { parse } from 'csv-parse/sync';
import { Brewery } from '../../common/entities/brewery.entity';
import { Beer } from '../../common/entities/beer.entity';

const BREWERIES_URL =
  'https://raw.githubusercontent.com/brewdega/open-beer-database-dumps/master/dumps/breweries.csv';
const BEERS_URL =
  'https://raw.githubusercontent.com/brewdega/open-beer-database-dumps/master/dumps/beers.csv';

const CHUNK = 500; // batch size for inserts

// --- helpers ----------------------------------------------------------------

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  return parse(text, {
    columns: true, // use the header row as keys
    skip_empty_lines: true,
    relax_quotes: true, // the dump has some messy quoting
    relax_column_count: true,
  }) as Record<string, string>[];
}

// Empty string / "-1" / non-numeric -> undefined (column left unset, DB default/NULL applies).
function num(value: string | undefined): number | undefined {
  if (value == null || value.trim() === '' || value.trim() === '-1') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// --- seed -------------------------------------------------------------------

export async function seed() {
  await AppDataSource.initialize();
  const breweryRepo = AppDataSource.getRepository(Brewery);
  const beerRepo = AppDataSource.getRepository(Beer);

  console.log('Downloading CSVs…');
  const [breweryRows, beerRows] = await Promise.all([fetchCsv(BREWERIES_URL), fetchCsv(BEERS_URL)]);
  console.log(`Fetched ${breweryRows.length} breweries, ${beerRows.length} beers.`);

  // 1. Breweries -------------------------------------------------------------
  const breweryEntities = breweryRows
    .filter((r) => r.id && r.name)
    .map((r) =>
      breweryRepo.create({
        sourceId: Number(r.id),
        name: r.name,
        city: str(r.city),
        state: str(r.state),
        country: str(r.country),
        website: str(r.website),
        description: str(r.descript),
      }),
    );

  console.log('Inserting breweries…');
  for (const batch of chunked(breweryEntities, CHUNK)) {
    // upsert on source_id -> re-running the seed won't create duplicates
    await breweryRepo.upsert(batch, ['sourceId']);
  }

  // 2. Lookup map: OBDB source_id -> our Brewery row -------------------------
  const savedBreweries = await breweryRepo.find();
  const bySourceId = new Map<number, Brewery>(
    savedBreweries.filter((b) => b.sourceId != null).map((b) => [b.sourceId, b]),
  );
  console.log(`Built lookup map with ${bySourceId.size} breweries.`);

  // 3. Beers -----------------------------------------------------------------
  let linked = 0;
  let orphaned = 0;

  const beerEntities = beerRows
    .filter((r) => r.id && r.name) // skip malformed lines
    .map((r) => {
      const brewery = bySourceId.get(Number(r.brewery_id));
      if (brewery) linked++;
      else orphaned++;

      return beerRepo.create({
        sourceId: Number(r.id),
        name: r.name,
        abv: num(r.abv),
        ibu: num(r.ibu),
        srm: num(r.srm),
        description: str(r.descript),
        brewery, // left unset (-> NULL) when brewery_id was -1 / unknown
      });
    });

  console.log('Inserting beers…');
  for (const batch of chunked(beerEntities, CHUNK)) {
    await beerRepo.upsert(batch, ['sourceId']);
  }

  console.log('--- Done ---');
  console.log(`Beers linked to a brewery: ${linked}`);
  console.log(`Beers with no brewery (kept, brewery=null): ${orphaned}`);

  await AppDataSource.destroy();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
