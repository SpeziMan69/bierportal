// seed.ts
// Seeds the beer database from TWO sources, unioned together:
//   - Open Food Facts (https://world.openfoodfacts.net): a real product photo for
//     almost every beer, plus brand + alcohol. This is what the live BeersService uses.
//   - Open Beer Database dump (https://github.com/brewdega/open-beer-database-dumps):
//     rich stats (ABV/IBU/SRM, descriptions) and detailed breweries (city/state/website).
//
// Breweries are fuzzy-merged across both sources (see breweryKey) so brand/name
// variants collapse into a single row. Beers from the two sources are kept side by
// side (OFF upserts on barcode, OBDB on its source id); the small overlap between the
// datasets may appear twice, which is acceptable for a seed.
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

const OFF_SEARCH_URL = 'https://world.openfoodfacts.net/api/v2/search';
const OFF_PAGE_SIZE = 100;
const OFF_PAGES = 10; // the search API caps pagination at offset 1000 (page 11 -> 401)

// Each query has its own ~1000-result window, so several beer sub-categories are
// queried and unioned to surface many more distinct beers than "beers" alone.
const OFF_CATEGORIES = [
  'beers',
  'lagers',
  'ales',
  'pale-ales',
  'india-pale-ales',
  'pilsner',
  'stouts',
  'porters',
  'wheat-beers',
  'brown-ales',
  'blonde-beers',
  'amber-beers',
  'dark-beers',
  'craft-beers',
  'alcohol-free-beers',
];

const CHUNK = 500; // batch size for inserts
const PLACEHOLDER_IMAGE_URL = '/public/beer-placeholder.png';

const BREWERIES_URL =
  'https://raw.githubusercontent.com/brewdega/open-beer-database-dumps/master/dumps/breweries.csv';
const BEERS_URL =
  'https://raw.githubusercontent.com/brewdega/open-beer-database-dumps/master/dumps/beers.csv';

// The .net staging host is used deliberately: the public .org search API throttles
// hard (503 after ~2 requests). Each category query is limited to OFF_PAGES pages
// because the search endpoint 401s beyond offset 1000.
const OFF_HEADERS = {
  'User-Agent': 'Bierportal-Seed/1.0 (https://github.com/SpeziMan69/bierportal)',
};

// Small courtesy delay between OFF requests (ms).
const OFF_PAGE_DELAY = 300;

const OFF_FIELDS = [
  'code',
  'product_name',
  'brands',
  'countries',
  'countries_tags',
  'categories_tags',
  'alcohol_100g',
  'image_front_url',
].join(',');

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  countries?: string;
  countries_tags?: string[];
  categories_tags?: string[];
  alcohol_100g?: number;
  image_front_url?: string;
}

interface OpenFoodFactsSearchResponse {
  products?: OpenFoodFactsProduct[];
}

// A single OFF product reduced to the fields we persist.
interface SeedBeer {
  code: string;
  name: string;
  brand?: string;
  country?: string;
  style?: string;
  alcohol?: number;
  imageUrl?: string;
}

// A brewery accumulated across both sources, keyed by breweryKey. Later sources
// fill any field an earlier one left empty (OBDB tends to be richer).
interface BreweryAgg {
  key: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  description?: string;
}

// --- helpers ----------------------------------------------------------------

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Downloads and parses an OBDB CSV dump into row objects keyed by header name.
async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true, // the dump has some messy quoting
    relax_column_count: true,
  }) as Record<string, string>[];
}

// Empty / "-1" / non-numeric -> undefined (column left unset, DB NULL/default applies).
function num(value: string | undefined): number | undefined {
  if (value == null || value.trim() === '' || value.trim() === '-1') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v || undefined;
}

// First non-empty entry of a comma-separated OFF field (e.g. "brands", "countries").
function firstValue(value?: string): string | undefined {
  return value
    ?.split(',')
    .map((part) => part.trim())
    .find(Boolean);
}

// Turns an OFF tag like "en:germany" into a display string ("Germany").
function formatTag(tag?: string): string | undefined {
  if (!tag) return undefined;
  const withoutLanguage = tag.includes(':') ? tag.split(':')[1] : tag;
  return withoutLanguage
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Picks the most specific meaningful beer style from OFF category tags,
// skipping generic ancestors like "beverages" or "beers".
const GENERIC_CATEGORY_TAGS = new Set([
  'en:beverages',
  'en:alcoholic-beverages',
  'en:beers',
  'en:beers-and-beers-mixed-drinks',
]);
function deriveStyle(categoriesTags?: string[]): string | undefined {
  if (!categoriesTags?.length) return undefined;
  const specific = [...categoriesTags]
    .reverse()
    .find((tag) => tag.startsWith('en:') && !GENERIC_CATEGORY_TAGS.has(tag));
  return formatTag(specific);
}

// Stable key for de-duplicating brands that differ only in case/whitespace/punctuation.
function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');
}

// Generic words found in brand strings that don't identify the brewery itself.
// Stripped before matching so "Beck's", "Beck's Brewery" and "Brauerei Beck" merge.
const BREWERY_STOPWORDS = new Set([
  'brewery',
  'breweries',
  'brewing',
  'brauerei',
  'brasserie',
  'brouwerij',
  'browar',
  'birrificio',
  'birra',
  'cerveza',
  'cerveceria',
  'pivovar',
  'company',
  'co',
  'gmbh',
  'inc',
  'ltd',
  'the',
  'and',
  'of',
  'craft',
  'beer',
  'beers',
  'bier',
]);

// Fuzzy dedupe key for a brand: strips diacritics and generic brewery words, then
// sorts the remaining tokens so word-order and suffix variants collapse together.
// Falls back to a plain slug when the brand is only generic words.
function breweryKey(brand: string): string {
  const tokens = brand
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !BREWERY_STOPWORDS.has(token));

  return tokens.length ? [...tokens].sort((a, b) => a.localeCompare(b)).join('') : slug(brand);
}

// Fetches one search page, retrying transient failures (incl. rate-limit 401/429)
// with growing backoff so a single blip doesn't abandon the remaining pages.
async function fetchOffPage(url: URL): Promise<Response> {
  let lastResponse = await fetch(url, { headers: OFF_HEADERS });
  for (let attempt = 2; attempt <= 5 && !lastResponse.ok; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, (attempt - 1) * 2000));
    lastResponse = await fetch(url, { headers: OFF_HEADERS });
  }
  return lastResponse;
}

// Adds one OFF product to the accumulator, keyed by barcode (first one wins).
function addProduct(product: OpenFoodFactsProduct, byCode: Map<string, SeedBeer>): void {
  const code = product.code?.trim();
  const name = product.product_name?.trim();
  if (!code || !name || byCode.has(code)) return;

  byCode.set(code, {
    code,
    name,
    brand: firstValue(product.brands),
    country: firstValue(product.countries) ?? formatTag(product.countries_tags?.[0]),
    style: deriveStyle(product.categories_tags),
    alcohol: typeof product.alcohol_100g === 'number' ? product.alcohol_100g : undefined,
    imageUrl: product.image_front_url?.trim() || undefined,
  });
}

// Pages through a single OFF category (until empty, an error, or the offset cap),
// adding every product into the shared accumulator.
async function fetchCategoryInto(category: string, byCode: Map<string, SeedBeer>): Promise<void> {
  for (let page = 1; page <= OFF_PAGES; page++) {
    const url = new URL(OFF_SEARCH_URL);
    url.searchParams.set('categories_tags_en', category);
    url.searchParams.set('page', String(page));
    url.searchParams.set('page_size', String(OFF_PAGE_SIZE));
    url.searchParams.set('fields', OFF_FIELDS);
    url.searchParams.set('sort_by', 'unique_scans_n');

    await new Promise((resolve) => setTimeout(resolve, OFF_PAGE_DELAY));

    const res = await fetchOffPage(url);
    if (!res.ok) {
      console.warn(`OFF "${category}" page ${page} failed with status ${res.status}, moving on.`);
      return;
    }

    const data = (await res.json()) as OpenFoodFactsSearchResponse;
    const products = data.products ?? [];
    if (products.length === 0) return; // no more results in this category

    for (const product of products) addProduct(product, byCode);
  }
}

// Pulls beer products (name, brand, country, alcohol, photo) from Open Food Facts
// across several sub-categories, de-duplicated by barcode. OFF has a real photo for
// almost every product, so nearly every OFF beer ends up with a picture.
async function fetchBeers(): Promise<SeedBeer[]> {
  const byCode = new Map<string, SeedBeer>();
  for (const category of OFF_CATEGORIES) {
    await fetchCategoryInto(category, byCode);
  }
  return [...byCode.values()];
}

// Ensures the externalId upsert columns/indexes exist. The seed's own data source
// has synchronize disabled, so we can't rely on the app having created them yet.
async function ensureSchema(): Promise<void> {
  await AppDataSource.query(
    'ALTER TABLE "beer" ADD COLUMN IF NOT EXISTS "externalId" character varying',
  );
  await AppDataSource.query(
    'ALTER TABLE "brewery" ADD COLUMN IF NOT EXISTS "externalId" character varying',
  );
  await AppDataSource.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_beer_externalId" ON "beer" ("externalId")',
  );
  await AppDataSource.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS "UQ_brewery_externalId" ON "brewery" ("externalId")',
  );
}

// --- seed -------------------------------------------------------------------

export async function seed() {
  await AppDataSource.initialize();
  await ensureSchema();
  const breweryRepo = AppDataSource.getRepository(Brewery);
  const beerRepo = AppDataSource.getRepository(Beer);

  console.log('Fetching Open Food Facts beers + Open Beer Database dump…');
  const [offBeers, breweryRows, beerRows] = await Promise.all([
    fetchBeers(),
    fetchCsv(BREWERIES_URL),
    fetchCsv(BEERS_URL),
  ]);
  const withPhoto = offBeers.filter((b) => b.imageUrl).length;
  console.log(
    `Fetched ${offBeers.length} OFF beers (${withPhoto} with a photo), ` +
      `${breweryRows.length} OBDB breweries, ${beerRows.length} OBDB beers.`,
  );

  // OBDB brewery id -> row, so each OBDB beer can resolve its brewery's name.
  const obdbBreweryById = new Map<number, Record<string, string>>();
  for (const r of breweryRows) {
    if (r.id && r.name) obdbBreweryById.set(Number(r.id), r);
  }

  // 1. Breweries: fuzzy-merged across BOTH sources by breweryKey. OBDB rows carry
  //    richer details (city/state/website/description); OFF supplies brand + country.
  const breweryByKey = new Map<string, BreweryAgg>();
  const addBrewery = (name: string, details: Partial<BreweryAgg>): void => {
    const key = breweryKey(name);
    if (!key) return;
    const agg = breweryByKey.get(key) ?? { key, name: name.trim() };
    agg.city ??= details.city;
    agg.state ??= details.state;
    agg.country ??= details.country;
    agg.website ??= details.website;
    agg.description ??= details.description;
    breweryByKey.set(key, agg);
  };

  for (const r of breweryRows) {
    if (!r.name?.trim()) continue;
    addBrewery(r.name, {
      city: str(r.city),
      state: str(r.state),
      country: str(r.country),
      website: str(r.website),
      description: str(r.descript),
    });
  }
  for (const beer of offBeers) {
    if (beer.brand) addBrewery(beer.brand, { country: beer.country });
  }

  const breweryEntities = [...breweryByKey.values()].map((b) =>
    breweryRepo.create({
      externalId: b.key,
      name: b.name,
      city: b.city,
      state: b.state,
      country: b.country,
      website: b.website,
      description: b.description,
    }),
  );

  console.log(`Inserting ${breweryEntities.length} breweries…`);
  for (const batch of chunked(breweryEntities, CHUNK)) {
    await breweryRepo.upsert(batch, ['externalId']);
  }

  // 2. Lookup: breweryKey -> saved Brewery row.
  const savedBreweries = await breweryRepo.find();
  const byKey = new Map<string, Brewery>(
    savedBreweries.filter((b) => b.externalId).map((b) => [b.externalId, b]),
  );
  const findBrewery = (name?: string): Brewery | undefined =>
    name ? byKey.get(breweryKey(name)) : undefined;

  // 3a. OFF beers: upsert on the barcode; real photos.
  const offEntities = offBeers.map((beer) =>
    beerRepo.create({
      externalId: beer.code,
      name: beer.name,
      abv: beer.alcohol,
      style: beer.style,
      description: beer.brand ? `${beer.name} von ${beer.brand}.` : beer.name,
      imageUrl: beer.imageUrl ?? PLACEHOLDER_IMAGE_URL,
      brewery: findBrewery(beer.brand),
    }),
  );

  // 3b. OBDB beers: upsert on the source id; rich stats, placeholder image.
  const obdbEntities = beerRows
    .filter((r) => r.id && r.name)
    .map((r) =>
      beerRepo.create({
        sourceId: Number(r.id),
        name: r.name,
        abv: num(r.abv),
        description: str(r.descript),
        imageUrl: PLACEHOLDER_IMAGE_URL,
        brewery: findBrewery(obdbBreweryById.get(Number(r.brewery_id))?.name),
      }),
    );

  console.log(`Inserting ${offEntities.length} OFF beers + ${obdbEntities.length} OBDB beers…`);
  for (const batch of chunked(offEntities, CHUNK)) {
    await beerRepo.upsert(batch, ['externalId']);
  }
  for (const batch of chunked(obdbEntities, CHUNK)) {
    await beerRepo.upsert(batch, ['sourceId']);
  }

  console.log('--- Done ---');
  console.log(`Breweries: ${breweryEntities.length}`);
  console.log(
    `Beers: ${offEntities.length + obdbEntities.length} ` +
      `(OFF ${offEntities.length}, OBDB ${obdbEntities.length})`,
  );
  console.log(`Beers with a real photo: ${withPhoto}`);

  await AppDataSource.destroy();
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
