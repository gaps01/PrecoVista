import { runtimeEnv } from './runtime-env';

export function getDb(): D1Database {
  const db = runtimeEnv().DB;
  if (!db) throw new Error('Banco de dados do PreçoVista ainda não está disponível.');
  return db;
}

export type StoredMarketplaceToken = {
  provider: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string | null;
  expires_at: number;
  updated_at: string;
};

export async function readMarketplaceToken(provider: string): Promise<StoredMarketplaceToken | null> {
  return getDb()
    .prepare('SELECT provider, encrypted_access_token, encrypted_refresh_token, expires_at, updated_at FROM marketplace_tokens WHERE provider = ?')
    .bind(provider)
    .first<StoredMarketplaceToken>();
}

export async function saveMarketplaceToken(input: {
  provider: string;
  encryptedAccessToken: string;
  encryptedRefreshToken: string | null;
  expiresAt: number;
}): Promise<void> {
  await getDb()
    .prepare(`
      INSERT INTO marketplace_tokens (provider, encrypted_access_token, encrypted_refresh_token, expires_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(provider) DO UPDATE SET
        encrypted_access_token = excluded.encrypted_access_token,
        encrypted_refresh_token = excluded.encrypted_refresh_token,
        expires_at = excluded.expires_at,
        updated_at = datetime('now')
    `)
    .bind(input.provider, input.encryptedAccessToken, input.encryptedRefreshToken, input.expiresAt)
    .run();
}

export async function saveOfferSnapshot(offer: {
  id: string;
  source: string;
  externalId: string;
  catalogProductId: string | null;
  title: string;
  category: string;
  imageUrl: string | null;
  itemUrl: string;
  priceCents: number;
  currency: string;
  sellerId: string;
  sellerName: string;
  sellerLevel: string;
  officialStore: boolean;
  rating: number;
  reviewCount: number;
  soldQuantity: number;
  trustScore: number;
}): Promise<void> {
  const db = getDb();
  await db.batch([
    db.prepare(`
      INSERT INTO offers (
        id, source, external_id, catalog_product_id, title, category, image_url, item_url,
        price_cents, currency, seller_id, seller_name, seller_level, official_store,
        rating, review_count, sold_quantity, trust_score, available, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        catalog_product_id = excluded.catalog_product_id,
        title = excluded.title,
        category = excluded.category,
        image_url = excluded.image_url,
        item_url = excluded.item_url,
        price_cents = excluded.price_cents,
        currency = excluded.currency,
        seller_id = excluded.seller_id,
        seller_name = excluded.seller_name,
        seller_level = excluded.seller_level,
        official_store = excluded.official_store,
        rating = excluded.rating,
        review_count = excluded.review_count,
        sold_quantity = excluded.sold_quantity,
        trust_score = excluded.trust_score,
        available = 1,
        last_seen_at = datetime('now')
    `).bind(
      offer.id, offer.source, offer.externalId, offer.catalogProductId, offer.title,
      offer.category, offer.imageUrl, offer.itemUrl, offer.priceCents, offer.currency,
      offer.sellerId, offer.sellerName, offer.sellerLevel, Number(offer.officialStore),
      offer.rating, offer.reviewCount, offer.soldQuantity, offer.trustScore,
    ),
    db.prepare(`
      INSERT INTO price_snapshots (offer_id, price_cents, collected_at)
      SELECT ?, ?, datetime('now')
      WHERE NOT EXISTS (
        SELECT 1 FROM price_snapshots
        WHERE offer_id = ? AND price_cents = ? AND collected_at >= datetime('now', '-3 hours')
      )
    `).bind(offer.id, offer.priceCents, offer.id, offer.priceCents),
  ]);
}

export async function readOfferHistory(offerId: string): Promise<Array<{ price: string; collected_at: string }>> {
  const rows = await getDb()
    .prepare(`
      SELECT price_cents, collected_at
      FROM price_snapshots
      WHERE offer_id = ?
      ORDER BY collected_at ASC
      LIMIT 180
    `)
    .bind(offerId)
    .all<{ price_cents: number; collected_at: string }>();
  return rows.results.map((row) => ({
    price: (row.price_cents / 100).toFixed(2),
    collected_at: row.collected_at,
  }));
}
