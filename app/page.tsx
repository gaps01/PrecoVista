'use client';

import {
  Bell, Check, ChefHat, ChevronDown, ExternalLink, Info, Laptop, Refrigerator,
  Search, ShieldCheck, Smartphone, Tv, WashingMachine, X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

import { demoProducts, type DemoProduct, type ProductKind, type RetailOffer } from './demo-data';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type ApiProductSummary = {
  id: number; external_id: string; title: string; category: string; current_price: string;
  rating?: number; review_count?: number; sold_count?: string; seller_name?: string;
  seller_level?: DemoProduct['sellerLevel']; official_store?: boolean; trust_score?: number;
  listing_url?: string; affiliate_url?: string;
};

type ApiProductDetail = ApiProductSummary & {
  history: Array<{ price: string; collected_at: string }>;
  prediction: { predicted_trend: DemoProduct['trend']; confidence_score: number; current_percentile: number };
};

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});

const productIcons: Record<ProductKind, typeof Smartphone> = {
  phone: Smartphone, laptop: Laptop, tv: Tv, appliance: Refrigerator,
  airfryer: ChefHat, washer: WashingMachine,
};

const trendLabel: Record<DemoProduct['trend'], string> = {
  falling: 'em queda', stable: 'estável', rising: 'em alta',
};

function ProductIcon({ kind, compact = false }: { kind: ProductKind; compact?: boolean }) {
  const Icon = productIcons[kind];
  return <span className={compact ? 'product-symbol compact' : 'product-symbol'}><Icon aria-hidden="true" strokeWidth={1.4} /></span>;
}

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <span className="chart-tooltip"><small>{label}</small><strong>{money.format(payload[0].value)}</strong></span>;
}

function inferKind(title: string, category: string): ProductKind {
  const text = `${title} ${category}`.toLocaleLowerCase('pt-BR');
  if (text.includes('notebook')) return 'laptop';
  if (text.includes('tv') || text.includes('television')) return 'tv';
  if (text.includes('geladeira') || text.includes('refriger')) return 'appliance';
  return 'phone';
}

function mapApiDetail(detail: ApiProductDetail): DemoProduct {
  const prices = detail.history.map((point) => Number(point.price));
  const currentPrice = Number(detail.current_price);
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
  return {
    id: detail.external_id, backendId: detail.id, kind: inferKind(detail.title, detail.category),
    title: detail.title, category: detail.category, currentPrice,
    originalPrice: Math.max(...prices, currentPrice), lowestPrice: Math.min(...prices, currentPrice),
    marketAverage: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    percentile: detail.prediction.current_percentile, confidence: detail.prediction.confidence_score,
    trend: detail.prediction.predicted_trend, rating: detail.rating ?? 0,
    reviewCount: detail.review_count ?? 0, soldCount: detail.sold_count ?? 'Vendas não informadas',
    sellerName: detail.seller_name ?? 'Vendedor Mercado Livre', sellerLevel: detail.seller_level ?? 'MercadoLíder',
    officialStore: detail.official_store ?? false, trustScore: detail.trust_score ?? 0,
    listingUrl: detail.listing_url ?? 'https://www.mercadolivre.com.br/', affiliateUrl: detail.affiliate_url,
    offers: [{
      store: 'Mercado Livre', price: currentPrice, available: true,
      trustScore: detail.trust_score ?? 0, note: 'Oferta recebida pela integração',
      url: detail.listing_url ?? 'https://www.mercadolivre.com.br/', affiliateUrl: detail.affiliate_url,
    }],
    history: detail.history.map((point, index) => ({
      date: index === detail.history.length - 1 ? 'Hoje' : formatter.format(new Date(point.collected_at)),
      price: Number(point.price),
    })),
  };
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState(demoProducts);
  const [apiSearchResults, setApiSearchResults] = useState<DemoProduct[] | null>(null);
  const [selectedId, setSelectedId] = useState(demoProducts[0].id);
  const [targetPrice, setTargetPrice] = useState('3499');
  const [email, setEmail] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [cashbackOffer, setCashbackOffer] = useState<RetailOffer | null>(null);
  const [cashbackEmail, setCashbackEmail] = useState('');

  const product = products.find((item) => item.id === selectedId) ?? products[0];
  const isGoodTime = product.percentile < 20;
  const availableOffers = [...product.offers].filter((offer) => offer.available).sort((a, b) => a.price - b.price);
  const bestOffer = availableOffers[0];
  const orderedOffers = [...product.offers].sort((a, b) => Number(b.available) - Number(a.available) || a.price - b.price);
  const averageSaving = Math.max(0, Math.round((1 - product.currentPrice / product.marketAverage) * 100));
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return [];
    return apiSearchResults ?? products.filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [apiSearchResults, products, query]);

  useEffect(() => {
    if (!apiUrl || query.trim().length < 2) {
      setApiSearchResults(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${apiUrl}/api/products/search?q=${encodeURIComponent(query)}&limit=8`, { signal: controller.signal });
        if (!response.ok) throw new Error('search unavailable');
        const summaries = await response.json() as ApiProductSummary[];
        setApiSearchResults(summaries.map((item) => {
          const existing = products.find((entry) => entry.id === item.external_id);
          if (existing) return { ...existing, backendId: item.id, currentPrice: Number(item.current_price) };
          return {
            id: item.external_id, backendId: item.id, kind: inferKind(item.title, item.category),
            title: item.title, category: item.category, currentPrice: Number(item.current_price),
            originalPrice: Number(item.current_price), lowestPrice: Number(item.current_price),
            marketAverage: Number(item.current_price), percentile: 50, confidence: 45, trend: 'stable' as const,
            rating: item.rating ?? 0, reviewCount: item.review_count ?? 0, soldCount: item.sold_count ?? 'Vendas não informadas',
            sellerName: item.seller_name ?? 'Vendedor Mercado Livre', sellerLevel: item.seller_level ?? 'MercadoLíder',
            officialStore: item.official_store ?? false, trustScore: item.trust_score ?? 0,
            listingUrl: item.listing_url ?? 'https://www.mercadolivre.com.br/', affiliateUrl: item.affiliate_url,
            offers: [{
              store: 'Mercado Livre', price: Number(item.current_price), available: true,
              trustScore: item.trust_score ?? 0, note: 'Oferta recebida pela integração',
              url: item.listing_url ?? 'https://www.mercadolivre.com.br/', affiliateUrl: item.affiliate_url,
            }],
            history: [{ date: 'Hoje', price: Number(item.current_price) }],
          };
        }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setApiSearchResults(null);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [products, query]);

  useEffect(() => {
    setTargetPrice(String(Math.floor(product.currentPrice * 0.9)));
    setShowAlert(false);
    setAlertSaved(false);
    setCashbackOffer(null);
  }, [product]);

  async function selectProduct(item: DemoProduct) {
    setSelectedId(item.id);
    setQuery('');
    window.setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 20);
    if (!apiUrl || !item.backendId) return;
    try {
      const response = await fetch(`${apiUrl}/api/products/${item.backendId}`);
      if (!response.ok) return;
      const resolved = mapApiDetail(await response.json() as ApiProductDetail);
      setProducts((current) => [...current.filter((entry) => entry.id !== resolved.id), resolved]);
    } catch {
      // Demo data keeps the prototype usable when the local API is offline.
    }
  }

  function trackOutbound(store: string, affiliate: boolean) {
    const outboundEvent = { productId: product.id, store, affiliate, clickedAt: new Date().toISOString() };
    const stored = JSON.parse(window.localStorage.getItem('precovista-outbound-clicks') ?? '[]') as typeof outboundEvent[];
    window.localStorage.setItem('precovista-outbound-clicks', JSON.stringify([...stored.slice(-49), outboundEvent]));
  }

  function activateCashback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cashbackOffer) return;
    const shoppingTrip = {
      id: crypto.randomUUID(), productId: product.id, store: cashbackOffer.store,
      email: cashbackEmail, estimatedCashback: cashbackOffer.price * (cashbackOffer.cashbackPercent ?? 0) / 100,
      status: 'simulated-pending', createdAt: new Date().toISOString(),
    };
    window.localStorage.setItem(`precovista-trip-${shoppingTrip.id}`, JSON.stringify(shoppingTrip));
    trackOutbound(cashbackOffer.store, Boolean(cashbackOffer.affiliateUrl));
    window.open(cashbackOffer.affiliateUrl ?? cashbackOffer.url, '_blank', 'noopener,noreferrer');
    setCashbackOffer(null);
  }

  async function saveAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(`precovista-alert-${product.id}`, JSON.stringify({ productId: product.id, email, targetPrice }));
    if (apiUrl && product.backendId) {
      try {
        await fetch(`${apiUrl}/api/watchlist`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, product_id: product.backendId, target_price: targetPrice }),
        });
      } catch {
        // Local storage is the prototype fallback.
      }
    }
    setAlertSaved(true);
  }

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PreçoVista — início"><span className="brand-signal"><i /></span><b>PreçoVista</b></a>
        <span className="demo-label">PROTÓTIPO · DADOS SIMULADOS</span>
      </header>

      <section className="focus-stage" id="resultado">
        <div className="search-intro">
          <span className="hello">Compra inteligente, sem trabalho.</span>
          <h1>Tá<br />valendo?</h1>
          <p>Busque um produto. A gente diz se o preço está bom e onde comprar com segurança.</p>
          <div className="search-shell">
            <Search aria-hidden="true" />
            <input aria-label="Buscar produto" placeholder="O que você quer comprar?" value={query} onChange={(event) => setQuery(event.target.value)} />
            <button onClick={() => searchResults[0] && selectProduct(searchResults[0])}>Ver resposta</button>
            {query && <div className="search-results">
              {searchResults.length ? searchResults.map((item) => <button key={item.id} onClick={() => selectProduct(item)}>
                <ProductIcon kind={item.kind} compact /><span><strong>{item.title}</strong><small>{item.category}</small></span><b>{money.format(item.currentPrice)}</b>
              </button>) : <p>Nenhum resultado. Tente “Samsung”, “TV” ou “geladeira”.</p>}
            </div>}
          </div>
          <div className="quick-picks"><span>Tente também:</span>{products.slice(0, 4).map((item) => <button className={item.id === product.id ? 'active' : ''} key={item.id} onClick={() => selectProduct(item)}>{item.category.split(' ')[0]}</button>)}</div>
        </div>

        <article className="answer-card">
          <div className="product-line"><ProductIcon kind={product.kind} compact /><span><small>{product.category}</small><b>{product.title}</b></span><strong>{money.format(bestOffer?.price ?? product.currentPrice)}</strong></div>

          <div className="answer-core">
            <div className={isGoodTime ? 'signal-disc good' : 'signal-disc wait'}><span>{isGoodTime ? 'SIM' : 'AINDA NÃO'}</span></div>
            <div className="answer-copy">
              <small>RESPOSTA PREÇOVISTA</small>
              <h2>{isGoodTime ? 'É uma boa hora para comprar.' : 'Vale a pena esperar um pouco.'}</h2>
              <p>{isGoodTime ? `O preço está entre os ${product.percentile}% menores que encontramos no histórico.` : 'O preço ainda está acima da faixa considerada atrativa.'}</p>
            </div>
          </div>

          {bestOffer && <div className="recommended-offer">
            <div><small>MELHOR OPÇÃO AGORA</small><b>{bestOffer.store}</b><span><ShieldCheck /> Confiança {bestOffer.trustScore}/100</span></div>
            <strong>{money.format(bestOffer.price)}</strong>
            {bestOffer.cashbackPercent
              ? <button onClick={() => setCashbackOffer(bestOffer)}>Ativar cashback</button>
              : <a href={bestOffer.affiliateUrl ?? bestOffer.url} target="_blank" rel={bestOffer.affiliateUrl ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} onClick={() => trackOutbound(bestOffer.store, Boolean(bestOffer.affiliateUrl))}>Ir para a loja <ExternalLink /></a>}
          </div>}

          <button className="alert-link" onClick={() => setShowAlert((value) => !value)}><Bell /> {showAlert ? 'Fechar alerta' : 'Me avise se ficar mais barato'}</button>
        </article>
      </section>

      {showAlert && <section className="alert-box">
        {alertSaved ? <div className="alert-success"><Check /><span><b>Alerta criado.</b> Vamos acompanhar todas as lojas deste produto.</span></div> : <form onSubmit={saveAlert}>
          <div><small>ALERTA DE PREÇO</small><h2>Quanto você quer pagar?</h2></div>
          <label>Preço desejado <span className="money-input"><b>R$</b><input inputMode="numeric" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ''))} required /></span></label>
          <label>Seu e-mail <input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <button type="submit">Criar alerta</button>
        </form>}
      </section>}

      <section className="folds">
        <details>
          <summary><span><b>Comparar outras lojas</b><small>{availableOffers.length} opções disponíveis</small></span><ChevronDown /></summary>
          <div className="offer-list">
            {orderedOffers.map((offer) => {
              const affiliate = Boolean(offer.affiliateUrl);
              return <div className={offer.available ? 'offer-row' : 'offer-row unavailable'} key={offer.store}>
                <span><b>{offer.store}</b><small>{offer.note} · {offer.trustScore}/100</small></span>
                {offer.available ? <>
                  <strong>{money.format(offer.price)}{offer.cashbackPercent && <small>{offer.cashbackPercent}% de volta*</small>}</strong>
                  {offer.cashbackPercent
                    ? <button onClick={() => setCashbackOffer(offer)}>Ativar cashback</button>
                    : <a href={offer.affiliateUrl ?? offer.url} target="_blank" rel={affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} onClick={() => trackOutbound(offer.store, affiliate)}>Ver loja</a>}
                </> : <em>Indisponível</em>}
              </div>;
            })}
          </div>
          {cashbackOffer && <form className="cashback-form" onSubmit={activateCashback}>
            <div><strong>{cashbackOffer.store}: cerca de {money.format(cashbackOffer.price * (cashbackOffer.cashbackPercent ?? 0) / 100)} de volta</strong><p>Cashback demonstrativo, sujeito à confirmação da compra.</p></div>
            <input type="email" aria-label="E-mail para acompanhar cashback" placeholder="seu@email.com" value={cashbackEmail} onChange={(event) => setCashbackEmail(event.target.value)} required />
            <button type="submit">Continuar</button><button type="button" className="close-form" onClick={() => setCashbackOffer(null)} aria-label="Cancelar cashback"><X /></button>
          </form>}
        </details>

        <details>
          <summary><span><b>Entender este preço</b><small>{averageSaving}% abaixo da média · tendência {trendLabel[product.trend]}</small></span><ChevronDown /></summary>
          <div className="price-proof">
            <div className="proof-copy"><span><small>HOJE</small><b>{money.format(product.currentPrice)}</b></span><span><small>MENOR</small><b>{money.format(product.lowestPrice)}</b></span><span><small>MÉDIA</small><b>{money.format(product.marketAverage)}</b></span></div>
            <div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><AreaChart data={product.history} margin={{ top: 15, right: 8, bottom: 0, left: 0 }}><CartesianGrid vertical={false} stroke="#e4e3df" /><XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={34} tick={{ fill: '#747477', fontSize: 11 }} /><YAxis hide domain={['dataMin - 120', 'dataMax + 80']} /><Tooltip content={<PriceTooltip />} /><ReferenceLine y={product.marketAverage} stroke="#ff684d" strokeDasharray="4 4" /><Area type="monotone" dataKey="price" stroke="#4d38db" strokeWidth={3} fill="#4d38db" fillOpacity={0.07} /></AreaChart></ResponsiveContainer></div>
            <p>Histórico demonstrativo, não extraído das lojas.</p>
          </div>
        </details>

        <details>
          <summary><span><b>Como evitamos ofertas ruins</b><small>Produto equivalente, reputação e preço final</small></span><ChevronDown /></summary>
          <div className="safety-grid"><p><Check /><span><b>Mesmo produto</b>Comparamos capacidade, variação e EAN.</span></p><p><Check /><span><b>Loja confiável</b>Nota alta e volume real de avaliações.</span></p><p><Check /><span><b>Preço completo</b>Frete e cupons entram na conta quando disponíveis.</span></p></div>
        </details>
      </section>

      <section className="next-searches">
        <span>OUTRAS BUSCAS</span>
        <div>{products.filter((item) => item.id !== product.id).slice(0, 5).map((item) => <button key={item.id} onClick={() => selectProduct(item)}><ProductIcon kind={item.kind} compact /><span><b>{item.title}</b><small>{money.format(item.currentPrice)}</small></span></button>)}</div>
      </section>

      <section className="disclosure"><Info /><p><b>Transparência:</b> preços, avaliações, cashback e histórico são simulados neste protótipo. A versão conectada exibirá fonte e horário de atualização.</p></section>

      <footer><a className="brand" href="#top"><span className="brand-signal"><i /></span><b>PreçoVista</b></a><span>Preço claro. Decisão simples.</span></footer>
    </main>
  );
}
