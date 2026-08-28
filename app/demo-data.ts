export type ProductKind = 'phone' | 'laptop' | 'tv' | 'appliance';

export type PricePoint = { date: string; price: number };

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
  history: PricePoint[];
};

const dates = ['05 jun', '12 jun', '19 jun', '26 jun', '03 jul', '10 jul', '17 jul', '24 jul', '31 jul', '07 ago', '14 ago', '21 ago', 'Hoje'];
const history = (prices: number[]): PricePoint[] => prices.map((price, index) => ({ date: dates[index], price }));

export const demoProducts: DemoProduct[] = [
  {
    id: 'MLB-DEMO-001', backendId: 1, kind: 'phone', title: 'Samsung Galaxy S24 5G 256 GB', category: 'Celulares e smartphones',
    currentPrice: 3299, originalPrice: 3999, lowestPrice: 3199, marketAverage: 3618, percentile: 14, confidence: 88, trend: 'falling',
    history: history([3899, 3849, 3899, 3799, 3749, 3799, 3699, 3599, 3649, 3499, 3399, 3349, 3299]),
  },
  {
    id: 'MLB-DEMO-002', backendId: 2, kind: 'laptop', title: 'Notebook Lenovo IdeaPad Slim 3 Ryzen 7, 16 GB, SSD 512 GB', category: 'Notebooks',
    currentPrice: 3699, originalPrice: 4299, lowestPrice: 3549, marketAverage: 3980, percentile: 22, confidence: 79, trend: 'stable',
    history: history([4199, 4099, 3999, 3899, 3949, 3849, 3799, 3749, 3799, 3699, 3749, 3699, 3699]),
  },
  {
    id: 'MLB-DEMO-003', backendId: 3, kind: 'tv', title: 'Smart TV LG UHD 4K 50 polegadas ThinQ AI', category: 'TVs',
    currentPrice: 2399, originalPrice: 2999, lowestPrice: 2299, marketAverage: 2675, percentile: 18, confidence: 84, trend: 'falling',
    history: history([2899, 2799, 2849, 2749, 2699, 2749, 2599, 2649, 2549, 2499, 2449, 2399, 2399]),
  },
  {
    id: 'MLB-DEMO-004', backendId: 4, kind: 'appliance', title: 'Geladeira Brastemp Frost Free Duplex 375 L', category: 'Eletrodomésticos',
    currentPrice: 3399, originalPrice: 3599, lowestPrice: 2999, marketAverage: 3290, percentile: 61, confidence: 72, trend: 'rising',
    history: history([3099, 3049, 2999, 3049, 3099, 3199, 3149, 3249, 3199, 3299, 3299, 3349, 3399]),
  },
];
