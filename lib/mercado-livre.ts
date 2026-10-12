import { readMarketplaceToken, saveMarketplaceToken, saveOfferSnapshot } from './db';
import { decryptToken, encryptToken } from './token-crypto';
import { runtimeEnv, siteOrigin } from './runtime-env';

const API_BASE_URL = 'https://api.mercadolibre.com';
const AUTHORIZATION_URL = 'https://auth.mercadolivre.com.br/authorization';
const PROVIDER = 'mercado_livre';

type MercadoLivreTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type MercadoLivreReviewResponse = {
  paging?: { total?: number };
  rating_average?: number;
};

type MercadoLivreSearchItem = {
  id: string;
  title: string;
  category_id: string;
  permalink: string;
  secure_thumbnail?: string;
  thumbnail?: string;
  price: number;
  currency_id?: string;
  condition?: string;
  catalog_product_id?: string;
  official_store_id?: number;
  sold_quantity?: number;
  seller: {
    id: number;
    nickname?: string;
    seller_reputation?: {
      level_id?: string;
      power_seller_status?: string;
    };
  };
  reviews?: {
    rating_average?: number;
    total?: number;
  };
};

type MercadoLivreSearchResponse = {
  results?: MercadoLivreSearchItem[];
};

export type TrustedOffer = {
  id: string;
  externalId: string;
  catalogProductId: string | null;
  title: string;
  category: string;
  imageUrl: string | null;
  itemUrl: string;
  price: number;
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
};

function requiredCredentials() {
  const config = runtimeEnv();
  if (!config.MERCADO_LIVRE_CLIENT_ID || !config.MERCADO_LIVRE_CLIENT_SECRET) {
    throw new Error('Credenciais do Mercado Livre ainda não foram cadastradas.');
  }
  return {
    clientId: config.MERCADO_LIVRE_CLIENT_ID,
    clientSecret: config.MERCADO_LIVRE_CLIENT_SECRET,
  };
}

export function mercadoLivreCallbackUrl(request?: Request): string {
  return `${siteOrigin(request)}/api/integrations/mercado-livre/callback`;
}

export function mercadoLivreAuthorizationUrl(state: string, request?: Request): string {
  const { clientId } = requiredCredentials();
  const url = new URL(AUTHORIZATION_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', mercadoLivreCallbackUrl(request));
  url.searchParams.set('state', state);
  return url.toString();
}

async function tokenRequest(parameters: URLSearchParams): Promise<MercadoLivreTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: parameters,
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`O Mercado Livre recusou a autorização (${response.status}).`);
  }
  return response.json() as Promise<MercadoLivreTokenResponse>;
}

async function persistToken(token: MercadoLivreTokenResponse, existingRefreshToken?: string | null): Promise<void> {
  const refreshToken = token.refresh_token ?? existingRefreshToken ?? null;
  await saveMarketplaceToken({
    provider: PROVIDER,
    encryptedAccessToken: await encryptToken(token.access_token),
    encryptedRefreshToken: refreshToken ? await encryptToken(refreshToken) : null,
    expiresAt: Math.floor(Date.now() / 1000) + Math.max(60, token.expires_in),
  });
}

export async function exchangeMercadoLivreCode(code: string, request?: Request): Promise<void> {
  const { clientId, clientSecret } = requiredCredentials();
  const token = await tokenRequest(new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: mercadoLivreCallbackUrl(request),
  }));
  await persistToken(token);
}

async function refreshAccessToken(encryptedRefreshToken: string): Promise<string> {
  const { clientId, clientSecret } = requiredCredentials();
  const refreshToken = await decryptToken(encryptedRefreshToken);
  const token = await tokenRequest(new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  }));
  await persistToken(token, refreshToken);
  return token.access_token;
}

export async function mercadoLivreAccessToken(): Promise<string> {
  const config = runtimeEnv();
  if (config.MERCADO_LIVRE_ACCESS_TOKEN) return config.MERCADO_LIVRE_ACCESS_TOKEN;

  const stored = await readMarketplaceToken(PROVIDER);
  if (!stored) throw new Error('A conta do Mercado Livre ainda não foi conectada.');
  if (stored.expires_at > Math.floor(Date.now() / 1000) + 300) {
    return decryptToken(stored.encrypted_access_token);
  }
  if (!stored.encrypted_refresh_token) {
    throw new Error('A autorização do Mercado Livre expirou e precisa ser renovada.');
  }
  return refreshAccessToken(stored.encrypted_refresh_token);
}

export async function mercadoLivreConnectionStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  expiresAt: number | null;
}> {
  const config = runtimeEnv();
  const configured = Boolean(
    config.MERCADO_LIVRE_CLIENT_ID &&
    config.MERCADO_LIVRE_CLIENT_SECRET &&
    config.MERCADO_LIVRE_TOKEN_ENCRYPTION_KEY,
  );
  if (config.MERCADO_LIVRE_ACCESS_TOKEN) {
    return { configured: true, connected: true, expiresAt: null };
  }
  try {
    const stored = await readMarketplaceToken(PROVIDER);
    return { configured, connected: Boolean(stored), expiresAt: stored?.expires_at ?? null };
  } catch {
    return { configured, connected: false, expiresAt: null };
  }
}

async function apiRequest<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'PrecoVista/1.0',
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Mercado Livre indisponível (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

async function reviewSummary(item: MercadoLivreSearchItem, accessToken: string): Promise<{ rating: number; total: number }> {
  const embeddedRating = Number(item.reviews?.rating_average ?? 0);
  const embeddedTotal = Number(item.reviews?.total ?? 0);
  if (embeddedRating > 0 && embeddedTotal > 0) {
    return { rating: embeddedRating, total: embeddedTotal };
  }
  try {
    const reviews = await apiRequest<MercadoLivreReviewResponse>(`/reviews/item/${encodeURIComponent(item.id)}?limit=1`, accessToken);
    return {
      rating: Number(reviews.rating_average ?? 0),
      total: Number(reviews.paging?.total ?? 0),
    };
  } catch {
    return { rating: 0, total: 0 };
  }
}

function calculateTrust(input: {
  officialStore: boolean;
  reputation: string;
  sellerLevel: string;
  rating: number;
  reviewCount: number;
  soldQuantity: number;
  condition: string;
}): number {
  let score = input.condition === 'new' ? 15 : 0;
  if (input.officialStore) score += 20;
  if (input.reputation === '5_green') score += 25;
  else if (input.reputation.includes('green')) score += 15;
  if (input.sellerLevel === 'platinum') score += 20;
  else if (input.sellerLevel === 'gold') score += 16;
  else if (input.sellerLevel === 'silver') score += 12;
  if (input.rating >= 4.8) score += 15;
  else if (input.rating >= 4.5) score += 12;
  else if (input.rating >= 4) score += 8;
  if (input.reviewCount >= 1000) score += 15;
  else if (input.reviewCount >= 200) score += 12;
  else if (input.reviewCount >= 50) score += 8;
  else if (input.reviewCount >= 20) score += 5;
  if (input.soldQuantity >= 500) score += 5;
  else if (input.soldQuantity >= 100) score += 3;
  return Math.min(score, 100);
}

async function normalizeItem(item: MercadoLivreSearchItem, accessToken: string): Promise<TrustedOffer | null> {
  const reviews = await reviewSummary(item, accessToken);
  const reputation = item.seller.seller_reputation?.level_id ?? '';
  const sellerLevel = item.seller.seller_reputation?.power_seller_status ?? '';
  const officialStore = Boolean(item.official_store_id);
  const soldQuantity = Number(item.sold_quantity ?? 0);
  const trustScore = calculateTrust({
    officialStore,
    reputation,
    sellerLevel,
    rating: reviews.rating,
    reviewCount: reviews.total,
    soldQuantity,
    condition: item.condition ?? '',
  });

  const trustedSeller = officialStore || reputation === '5_green' || ['silver', 'gold', 'platinum'].includes(sellerLevel);
  if (item.condition !== 'new' || reviews.rating < 4 || reviews.total < 20 || !trustedSeller || trustScore < 65) {
    return null;
  }

  const price = Number(item.price);
  return {
    id: `mercado_livre:${item.id}`,
    externalId: item.id,
    catalogProductId: item.catalog_product_id ?? null,
    title: item.title,
    category: item.category_id,
    imageUrl: item.secure_thumbnail ?? item.thumbnail ?? null,
    itemUrl: item.permalink,
    price,
    priceCents: Math.round(price * 100),
    currency: item.currency_id ?? 'BRL',
    sellerId: String(item.seller.id),
    sellerName: item.seller.nickname ?? 'Vendedor verificado',
    sellerLevel,
    officialStore,
    rating: reviews.rating,
    reviewCount: reviews.total,
    soldQuantity,
    trustScore,
  };
}

export async function searchTrustedMercadoLivreOffers(query: string, limit = 8): Promise<TrustedOffer[]> {
  const accessToken = await mercadoLivreAccessToken();
  const siteId = runtimeEnv().MERCADO_LIVRE_SITE_ID ?? 'MLB';
  const response = await apiRequest<MercadoLivreSearchResponse>(
    `/sites/${encodeURIComponent(siteId)}/search?q=${encodeURIComponent(query)}&limit=${Math.min(Math.max(limit * 3, 12), 30)}`,
    accessToken,
  );
  const enriched = await Promise.all((response.results ?? []).map((item) => normalizeItem(item, accessToken)));
  const offers = enriched
    .filter((offer): offer is TrustedOffer => Boolean(offer))
    .sort((left, right) => right.trustScore - left.trustScore || left.price - right.price)
    .slice(0, limit);

  await Promise.allSettled(offers.map((offer) => saveOfferSnapshot({
    ...offer,
    source: 'mercado_livre',
  })));
  return offers;
}
