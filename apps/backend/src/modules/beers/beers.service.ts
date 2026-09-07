import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';

interface OpenFoodFactsProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  countries?: string;
  countries_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  alcohol_100g?: number;
  image_front_url?: string;
}

interface OpenFoodFactsSearchResponse {
  count?: number;
  page?: number;
  page_size?: number;
  products?: OpenFoodFactsProduct[];
}

interface OpenFoodFactsProductResponse {
  status?: number;
  status_verbose?: string;
  product?: OpenFoodFactsProduct;
}

export interface BeerResponse {
  id: string;
  name: string;
  brewery: string;
  country: string;
  type: string;
  alcohol: number | null;
  rating: number | null;
  imageUrl: string;
  description: string;
}

@Injectable()
export class BeersService {
  private readonly externalApiUrl = 'https://world.openfoodfacts.net/api/v2/search';
  private readonly externalProductApiUrl = 'https://world.openfoodfacts.net/api/v2/product';

  async findAll(page = 1, limit = 100) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const url = new URL(this.externalApiUrl);

    url.searchParams.set('categories_tags_en', 'beers');
    url.searchParams.set('page', String(safePage));
    url.searchParams.set('page_size', String(safeLimit));
    url.searchParams.set(
      'fields',
      [
        'code',
        'product_name',
        'brands',
        'countries',
        'countries_tags',
        'categories',
        'categories_tags',
        'alcohol_100g',
        'image_front_url',
      ].join(','),
    );

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Bierportal/1.0 (https://github.com/SpeziMan69/bierportal)',
        },
      });

      if (!response.ok) {
        throw new Error(`Open Food Facts antwortete mit Status ${response.status}`);
      }

      const data = (await response.json()) as OpenFoodFactsSearchResponse;

      const items = (data.products ?? [])
        .filter(
          (
            product,
          ): product is OpenFoodFactsProduct & {
            code: string;
            product_name: string;
          } => Boolean(product.code && product.product_name?.trim()),
        )
        .map((product) => this.mapProductToBeer(product));

      const total = data.count ?? items.length;

      return {
        items,
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Bierdaten:', error);

      throw new BadGatewayException('Die externe Bierdatenquelle ist momentan nicht erreichbar.');
    }
  }

  async findOne(id: string): Promise<BeerResponse> {
    const normalizedId = id.trim();

    const url = new URL(`${this.externalProductApiUrl}/${encodeURIComponent(normalizedId)}.json`);

    url.searchParams.set(
      'fields',
      [
        'code',
        'product_name',
        'brands',
        'countries',
        'countries_tags',
        'categories',
        'categories_tags',
        'alcohol_100g',
        'image_front_url',
      ].join(','),
    );

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Bierportal/1.0 (https://github.com/SpeziMan69/bierportal)',
        },
      });

      if (response.status === 404) {
        throw new NotFoundException(`Das Bier mit der ID ${normalizedId} wurde nicht gefunden.`);
      }

      if (!response.ok) {
        throw new Error(`Open Food Facts antwortete mit Status ${response.status}`);
      }

      const data = (await response.json()) as OpenFoodFactsProductResponse;
      const product = data.product;

      if (data.status === 0 || !product?.code || !product.product_name?.trim()) {
        throw new NotFoundException(`Das Bier mit der ID ${normalizedId} wurde nicht gefunden.`);
      }

      return this.mapProductToBeer({
        ...product,
        code: product.code,
        product_name: product.product_name,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error(`Fehler beim Abrufen des Biers ${normalizedId}:`, error);

      throw new BadGatewayException(
        'Das Bier konnte momentan nicht von der externen Datenquelle geladen werden.',
      );
    }
  }

  private mapProductToBeer(
    product: OpenFoodFactsProduct & {
      code: string;
      product_name: string;
    },
  ): BeerResponse {
    const brewery = this.firstValue(product.brands) ?? 'Unbekannte Brauerei';

    const country =
      this.firstValue(product.countries) ??
      this.formatTag(product.countries_tags?.[0]) ??
      'Unbekannt';

    const type =
      this.findBeerType(product.categories_tags) ?? this.firstValue(product.categories) ?? 'Bier';

    return {
      id: product.code,
      name: product.product_name.trim(),
      brewery,
      country,
      type,
      alcohol: typeof product.alcohol_100g === 'number' ? product.alcohol_100g : null,
      rating: null,
      imageUrl: product.image_front_url ?? '/public/beer-placeholder.png',
      description: `${product.product_name.trim()} von ${brewery}.`,
    };
  }

  private firstValue(value?: string): string | undefined {
    return value
      ?.split(',')
      .map((part) => part.trim())
      .find(Boolean);
  }

  private formatTag(tag?: string): string | undefined {
    if (!tag) {
      return undefined;
    }

    const withoutLanguage = tag.includes(':') ? tag.split(':')[1] : tag;

    return withoutLanguage
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private findBeerType(tags?: string[]): string | undefined {
    const ignoredCategories = new Set(['beers', 'beer', 'alcoholic-beverages', 'beverages']);

    const specificTag = tags?.find((tag) => {
      const normalizedTag = tag.includes(':') ? tag.split(':')[1] : tag;
      return !ignoredCategories.has(normalizedTag);
    });

    return this.formatTag(specificTag);
  }
}
