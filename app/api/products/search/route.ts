import { NextRequest, NextResponse } from 'next/server';
import { searchTrustedMercadoLivreOffers } from '@/lib/mercado-livre';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit') ?? 8);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.round(requestedLimit), 1), 12) : 8;
  if (query.length < 2 || query.length > 120) {
    return NextResponse.json({ error: 'Digite entre 2 e 120 caracteres.' }, { status: 400 });
  }

  try {
    const offers = await searchTrustedMercadoLivreOffers(query, limit);
    return NextResponse.json(offers.map((offer) => ({
      id: offer.id,
      marketplace_id: 'mercado_livre',
      external_id: offer.id,
      title: offer.title,
      category: offer.category,
      current_price: offer.price.toFixed(2),
      image_url: offer.imageUrl,
      rating: offer.rating,
      review_count: offer.reviewCount,
      sold_count: offer.soldQuantity > 0 ? `${offer.soldQuantity.toLocaleString('pt-BR')} vendidos` : 'Vendas não informadas',
      seller_name: offer.sellerName,
      seller_level: offer.sellerLevel === 'platinum' ? 'MercadoLíder Platinum' : offer.sellerLevel === 'gold' ? 'MercadoLíder Gold' : 'MercadoLíder',
      official_store: offer.officialStore,
      trust_score: offer.trustScore,
      listing_url: offer.itemUrl,
      source_updated_at: new Date().toISOString(),
    })), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Integração indisponível.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
