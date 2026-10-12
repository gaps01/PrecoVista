import { NextResponse } from 'next/server';
import { getDb, readOfferHistory } from '@/lib/db';

export const dynamic = 'force-dynamic';

type OfferRow = {
  id: string;
  source: string;
  title: string;
  category: string;
  image_url: string | null;
  item_url: string;
  price_cents: number;
  seller_name: string;
  seller_level: string;
  official_store: number;
  rating: number;
  review_count: number;
  sold_quantity: number;
  trust_score: number;
  last_seen_at: string;
};

function prediction(history: Array<{ price: string }>, currentPrice: number) {
  const prices = history.map((point) => Number(point.price)).filter(Number.isFinite);
  if (prices.length < 2) {
    return { predicted_trend: 'stable', confidence_score: 45, current_percentile: 50 };
  }
  const lowerPrices = prices.filter((price) => price < currentPrice).length;
  const previous = prices.at(-2) ?? currentPrice;
  const variation = previous ? (currentPrice - previous) / previous : 0;
  return {
    predicted_trend: variation < -0.02 ? 'falling' : variation > 0.02 ? 'rising' : 'stable',
    confidence_score: Math.min(92, 45 + prices.length * 3),
    current_percentile: Math.round((lowerPrices / prices.length) * 100),
  };
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const offer = await getDb()
    .prepare(`
      SELECT id, source, title, category, image_url, item_url, price_cents, seller_name,
             seller_level, official_store, rating, review_count, sold_quantity, trust_score, last_seen_at
      FROM offers WHERE id = ? AND available = 1
    `)
    .bind(id)
    .first<OfferRow>();
  if (!offer) return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 });

  const history = await readOfferHistory(offer.id);
  const currentPrice = offer.price_cents / 100;
  return NextResponse.json({
    id: offer.id,
    marketplace_id: offer.source,
    external_id: offer.id,
    title: offer.title,
    category: offer.category,
    image_url: offer.image_url,
    current_price: currentPrice.toFixed(2),
    rating: offer.rating,
    review_count: offer.review_count,
    sold_count: offer.sold_quantity > 0 ? `${offer.sold_quantity.toLocaleString('pt-BR')} vendidos` : 'Vendas não informadas',
    seller_name: offer.seller_name,
    seller_level: offer.seller_level === 'platinum' ? 'MercadoLíder Platinum' : offer.seller_level === 'gold' ? 'MercadoLíder Gold' : 'MercadoLíder',
    official_store: Boolean(offer.official_store),
    trust_score: offer.trust_score,
    listing_url: offer.item_url,
    source_updated_at: offer.last_seen_at,
    history: history.length ? history : [{ price: currentPrice.toFixed(2), collected_at: offer.last_seen_at }],
    prediction: prediction(history, currentPrice),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
