export type ProductKind = 'phone' | 'laptop' | 'tv' | 'appliance' | 'airfryer' | 'washer';

export type PricePoint = { date: string; price: number };

export type RetailOffer = {
  store: 'Mercado Livre' | 'Amazon' | 'Magazine Luiza' | 'Casas Bahia' | 'Ponto' | 'Fast Shop';
  price: number;
  available: boolean;
  trustScore: number;
  note: string;
  url: string;
  affiliateUrl?: string;
};

export type DemoProduct = {
  id: string;
  backendId?: number;
  kind: ProductKind;
  title: string;
  category: string;
  currentPrice: number;
  originalPrice: number;
  lowestPrice: number;
  marketAverage: number;
  percentile: number;
  confidence: number;
  trend: 'falling' | 'stable' | 'rising';
  rating: number;
  reviewCount: number;
  soldCount: string;
  sellerName: string;
  sellerLevel: 'MercadoLíder' | 'MercadoLíder Gold' | 'MercadoLíder Platinum';
  officialStore: boolean;
  trustScore: number;
  listingUrl: string;
  affiliateUrl?: string;
  offers: RetailOffer[];
  history: PricePoint[];
};

const dates = ['05 jun', '12 jun', '19 jun', '26 jun', '03 jul', '10 jul', '17 jul', '24 jul', '31 jul', '07 ago', '14 ago', '21 ago', 'Hoje'];
const history = (prices: number[]): PricePoint[] => prices.map((price, index) => ({ date: dates[index], price }));

export const demoProducts: DemoProduct[] = [
  {
    id: 'MLB-DEMO-001', backendId: 1, kind: 'phone', title: 'Samsung Galaxy S25 5G 256 GB, 12 GB RAM', category: 'Celulares e smartphones',
    currentPrice: 3849, originalPrice: 5999, lowestPrice: 3849, marketAverage: 4654, percentile: 9, confidence: 91, trend: 'falling',
    rating: 4.9, reviewCount: 5770, soldCount: '+1 mil vendidos', sellerName: 'Samsung Brasil', sellerLevel: 'MercadoLíder Platinum',
    officialStore: true, trustScore: 96,
    listingUrl: 'https://www.mercadolivre.com.br/samsung-galaxy-s25-5g-256gb-12gb-cmera-tripla-azul-claro/p/MLB45513356',
    offers: [
      { store: 'Amazon', price: 3849, available: true, trustScore: 96, note: 'Vendido pela loja oficial', url: 'https://www.amazon.com.br/s?k=Samsung+Galaxy+S25+256GB' },
      { store: 'Mercado Livre', price: 3899, available: true, trustScore: 96, note: 'Loja oficial · vendedor verde', url: 'https://www.mercadolivre.com.br/samsung-galaxy-s25-5g-256gb-12gb-cmera-tripla-azul-claro/p/MLB45513356' },
      { store: 'Magazine Luiza', price: 3999, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/galaxy%20s25%20256gb/' },
      { store: 'Casas Bahia', price: 4099, available: true, trustScore: 93, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/galaxy-s25-256gb/b' },
      { store: 'Ponto', price: 0, available: false, trustScore: 92, note: 'Produto não encontrado agora', url: 'https://www.ponto.com.br/galaxy-s25-256gb/b' },
    ],
    history: history([5299, 5199, 4999, 4899, 4799, 4849, 4699, 4599, 4499, 4399, 4199, 3999, 3849]),
  },
  {
    id: 'MLB-DEMO-002', backendId: 2, kind: 'laptop', title: 'Notebook Lenovo IdeaPad Slim 3 Ryzen 7, 16 GB, SSD 512 GB', category: 'Notebooks',
    currentPrice: 3599, originalPrice: 4299, lowestPrice: 3549, marketAverage: 3972, percentile: 22, confidence: 79, trend: 'stable',
    rating: 5, reviewCount: 161, soldCount: '+1 mil vendidos', sellerName: 'Lenovo', sellerLevel: 'MercadoLíder Platinum',
    officialStore: true, trustScore: 95,
    listingUrl: 'https://www.mercadolivre.com.br/notebook-lenovo-ideapad-slim-3-amd-ryzen-7-16gb-512gb-w11-luna-grey/p/MLB58703437',
    offers: [
      { store: 'Magazine Luiza', price: 3599, available: true, trustScore: 95, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/lenovo%20ideapad%20slim%203%20ryzen%207/' },
      { store: 'Mercado Livre', price: 3699, available: true, trustScore: 95, note: 'Loja oficial · vendedor verde', url: 'https://www.mercadolivre.com.br/notebook-lenovo-ideapad-slim-3-amd-ryzen-7-16gb-512gb-w11-luna-grey/p/MLB58703437' },
      { store: 'Amazon', price: 3749, available: true, trustScore: 94, note: 'Oferta verificada', url: 'https://www.amazon.com.br/s?k=Lenovo+IdeaPad+Slim+3+Ryzen+7+16GB+512GB' },
      { store: 'Casas Bahia', price: 3899, available: true, trustScore: 92, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/lenovo-ideapad-slim-3/b' },
      { store: 'Ponto', price: 0, available: false, trustScore: 92, note: 'Produto não encontrado agora', url: 'https://www.ponto.com.br/lenovo-ideapad-slim-3/b' },
    ],
    history: history([4199, 4099, 3999, 3899, 3949, 3849, 3799, 3749, 3799, 3699, 3749, 3699, 3599]),
  },
  {
    id: 'MLB-DEMO-003', backendId: 3, kind: 'tv', title: 'Smart TV LG UHD 4K 50 polegadas ThinQ AI', category: 'TVs',
    currentPrice: 2299, originalPrice: 2999, lowestPrice: 2299, marketAverage: 2667, percentile: 18, confidence: 84, trend: 'falling',
    rating: 4.9, reviewCount: 8249, soldCount: '+10 mil vendidos', sellerName: 'LG Brasil', sellerLevel: 'MercadoLíder Platinum',
    officialStore: true, trustScore: 98,
    listingUrl: 'https://www.mercadolivre.com.br/smart-tv-lg-50-4k-uhd-led-alexa-thinq-ai-hdr10-webos-24-controle-smart-magic-50ut8050/p/MLB39457123',
    offers: [
      { store: 'Casas Bahia', price: 2299, available: true, trustScore: 95, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/smart-tv-lg-50-4k/b' },
      { store: 'Amazon', price: 2349, available: true, trustScore: 95, note: 'Oferta verificada', url: 'https://www.amazon.com.br/s?k=Smart+TV+LG+50+4K+ThinQ' },
      { store: 'Mercado Livre', price: 2399, available: true, trustScore: 98, note: 'MercadoLíder Platinum', url: 'https://www.mercadolivre.com.br/smart-tv-lg-50-4k-uhd-led-alexa-thinq-ai-hdr10-webos-24-controle-smart-magic-50ut8050/p/MLB39457123' },
      { store: 'Magazine Luiza', price: 2449, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/smart%20tv%20lg%2050%204k/' },
      { store: 'Fast Shop', price: 2499, available: true, trustScore: 96, note: 'Loja verificada', url: 'https://www.fastshop.com.br/web/q/smart-tv-lg-50' },
    ],
    history: history([2899, 2799, 2849, 2749, 2699, 2749, 2599, 2649, 2549, 2499, 2449, 2399, 2299]),
  },
  {
    id: 'MLB-DEMO-004', backendId: 4, kind: 'appliance', title: 'Geladeira Brastemp Frost Free Duplex 375 L', category: 'Eletrodomésticos',
    currentPrice: 3299, originalPrice: 3599, lowestPrice: 2999, marketAverage: 3282, percentile: 61, confidence: 72, trend: 'rising',
    rating: 4.8, reviewCount: 4315, soldCount: '+1 mil vendidos', sellerName: 'Brastemp', sellerLevel: 'MercadoLíder Platinum',
    officialStore: true, trustScore: 97,
    listingUrl: 'https://www.mercadolivre.com.br/geladeira-frost-free-duplex-375-l-brm45jk-inox-brastemp-110v/p/MLB19954804',
    offers: [
      { store: 'Ponto', price: 3299, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.ponto.com.br/geladeira-brastemp-375l/b' },
      { store: 'Casas Bahia', price: 3349, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/geladeira-brastemp-375l/b' },
      { store: 'Mercado Livre', price: 3399, available: true, trustScore: 97, note: 'Loja oficial · vendedor verde', url: 'https://www.mercadolivre.com.br/geladeira-frost-free-duplex-375-l-brm45jk-inox-brastemp-110v/p/MLB19954804' },
      { store: 'Magazine Luiza', price: 3449, available: true, trustScore: 95, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/geladeira%20brastemp%20375l/' },
      { store: 'Amazon', price: 0, available: false, trustScore: 94, note: 'Produto não encontrado agora', url: 'https://www.amazon.com.br/s?k=Geladeira+Brastemp+375L' },
    ],
    history: history([3099, 3049, 2999, 3049, 3099, 3199, 3149, 3249, 3199, 3299, 3299, 3349, 3299]),
  },
  {
    id: 'DEMO-AIRFRYER-001', kind: 'airfryer', title: 'Air Fryer Mondial Family 5 L', category: 'Fritadeiras elétricas',
    currentPrice: 379, originalPrice: 549, lowestPrice: 379, marketAverage: 446, percentile: 16, confidence: 86, trend: 'falling',
    rating: 4.8, reviewCount: 9630, soldCount: '+10 mil vendidos', sellerName: 'Mondial', sellerLevel: 'MercadoLíder Platinum',
    officialStore: true, trustScore: 97, listingUrl: 'https://lista.mercadolivre.com.br/air-fryer-mondial-family-5l',
    offers: [
      { store: 'Amazon', price: 379, available: true, trustScore: 96, note: 'Oferta verificada', url: 'https://www.amazon.com.br/s?k=Air+Fryer+Mondial+Family+5L' },
      { store: 'Magazine Luiza', price: 399, available: true, trustScore: 95, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/air%20fryer%20mondial%205l/' },
      { store: 'Casas Bahia', price: 419, available: true, trustScore: 93, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/air-fryer-mondial-5l/b' },
      { store: 'Mercado Livre', price: 429, available: true, trustScore: 96, note: 'Vendedor verde', url: 'https://lista.mercadolivre.com.br/air-fryer-mondial-family-5l' },
      { store: 'Ponto', price: 0, available: false, trustScore: 92, note: 'Produto não encontrado agora', url: 'https://www.ponto.com.br/air-fryer-mondial-5l/b' },
    ],
    history: history([529, 519, 499, 479, 489, 459, 449, 439, 429, 419, 409, 399, 379]),
  },
  {
    id: 'DEMO-WASHER-001', kind: 'washer', title: 'Lavadora Brastemp 12 kg com Ciclo Tira Manchas', category: 'Máquinas de lavar',
    currentPrice: 1849, originalPrice: 2299, lowestPrice: 1799, marketAverage: 2031, percentile: 24, confidence: 82, trend: 'stable',
    rating: 4.8, reviewCount: 1840, soldCount: '+1 mil vendidos', sellerName: 'Brastemp', sellerLevel: 'MercadoLíder Gold',
    officialStore: true, trustScore: 95, listingUrl: 'https://lista.mercadolivre.com.br/lavadora-brastemp-12kg',
    offers: [
      { store: 'Casas Bahia', price: 1849, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.casasbahia.com.br/lavadora-brastemp-12kg/b' },
      { store: 'Ponto', price: 1899, available: true, trustScore: 94, note: 'Loja verificada', url: 'https://www.ponto.com.br/lavadora-brastemp-12kg/b' },
      { store: 'Magazine Luiza', price: 1949, available: true, trustScore: 95, note: 'Loja verificada', url: 'https://www.magazineluiza.com.br/busca/lavadora%20brastemp%2012kg/' },
      { store: 'Mercado Livre', price: 1999, available: true, trustScore: 95, note: 'Vendedor verde', url: 'https://lista.mercadolivre.com.br/lavadora-brastemp-12kg' },
      { store: 'Amazon', price: 0, available: false, trustScore: 94, note: 'Produto não encontrado agora', url: 'https://www.amazon.com.br/s?k=Lavadora+Brastemp+12kg' },
    ],
    history: history([2199, 2149, 2099, 2049, 1999, 1949, 1899, 1849, 1799, 1849, 1899, 1899, 1849]),
  },
];
