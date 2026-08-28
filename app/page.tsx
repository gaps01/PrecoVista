'use client';

import {
  ArrowRight, Bell, Check, ChefHat, ChevronDown, ExternalLink, Info, Laptop,
  Menu, Refrigerator, Search, ShieldCheck, Smartphone, Star, Store,
  TrendingDown, Tv, WashingMachine, X,
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

function ProductIcon({ kind, compact = false }: { kind: ProductKind; compact?: boolean }) {
  const Icon = productIcons[kind];
  return <span className={compact ? 'product-icon compact' : 'product-icon'}><Icon aria-hidden="true" strokeWidth={1.55} /></span>;
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
  const [menuOpen, setMenuOpen] = useState(false);

  const product = products.find((item) => item.id === selectedId) ?? products[0];
  const isGoodTime = product.percentile < 20;
  const availableOffers = [...product.offers].filter((offer) => offer.available).sort((a, b) => a.price - b.price);
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
    window.scrollTo({ top: 330, behavior: 'smooth' });
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
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PreçoVista — início"><span className="brand-mark"><TrendingDown /></span><span>Preço<span>Vista</span></span></a>
        <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#resultado">Análise</a><a href="#ofertas">Ofertas seguras</a><span className="demo-pill"><i /> Demonstração</span></nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="top">
        <span className="eyebrow"><ShieldCheck /> Compra inteligente, sem complicação</span>
        <h1>Vale a pena<br /><em>comprar agora?</em></h1>
        <p>Pesquise o produto. A gente responde.</p>
        <div className="search-shell">
          <Search />
          <input aria-label="Buscar produto" placeholder="Celular, notebook, TV..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <button onClick={() => searchResults[0] && selectProduct(searchResults[0])}>Analisar <ArrowRight /></button>
          {query && <div className="search-results">
            {searchResults.length ? searchResults.map((item) => <button key={item.id} onClick={() => selectProduct(item)}>
              <ProductIcon kind={item.kind} compact /><span><strong>{item.title}</strong><small>{money.format(item.currentPrice)}</small></span><ArrowRight />
            </button>) : <p>Tente “Samsung”, “notebook”, “TV” ou “geladeira”.</p>}
          </div>}
        </div>
        <span className="filter-line"><ShieldCheck /> Comparamos grandes lojas e mostramos alternativas quando uma delas não tem o produto.</span>
      </section>

      <section className="result-section" id="resultado">
        <article className="decision-card">
          <div className="product-heading">
            <ProductIcon kind={product.kind} />
            <div><small>{product.category} · dados simulados</small><h2>{product.title}</h2><span className="price">a partir de {money.format(product.currentPrice)}</span><del>{money.format(product.originalPrice)}</del></div>
          </div>

          <div className={isGoodTime ? 'answer good' : 'answer wait'}>
            <span className="answer-icon">{isGoodTime ? <Check /> : <Info />}</span>
            <div><small>Resposta PreçoVista</small><h3>{isGoodTime ? 'Pode comprar.' : 'Melhor esperar.'}</h3><p>{isGoodTime ? `Hoje está entre os ${product.percentile}% menores preços do histórico.` : 'O preço ainda está acima da faixa que consideramos atrativa.'}</p></div>
            <strong>{product.confidence}%<small>confiança</small></strong>
          </div>

          <div className="trust-strip">
            <span><ShieldCheck /><b>{product.trustScore}/100</b> oferta segura</span>
            <span><Star fill="currentColor" /><b>{product.rating.toFixed(1)}</b> ({product.reviewCount.toLocaleString('pt-BR')})</span>
            <span><Store /><b>{product.officialStore ? 'Loja oficial' : product.sellerName}</b></span>
          </div>

          <div className="action-grid">
            <div className="offers-panel">
              <div className="offers-heading"><div><strong>Onde comprar</strong><small>{availableOffers.length} lojas com este produto · cashback demonstrativo</small></div><span>Dados simulados</span></div>
              <div className="offers-list">
                {[...product.offers].sort((a, b) => Number(b.available) - Number(a.available) || a.price - b.price).map((offer) => {
                  const affiliate = Boolean(offer.affiliateUrl);
                  return <div className={offer.available ? 'offer-row' : 'offer-row unavailable'} key={offer.store}>
                    <span className="store-logo">{offer.store.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                    <span className="store-copy"><b>{offer.store}</b><small>{offer.note} · {offer.trustScore}/100</small></span>
                    {offer.available ? <>
                      <strong className="offer-price">{money.format(offer.price)}{offer.cashbackPercent ? <small>{offer.cashbackPercent}% de volta*</small> : offer.price === availableOffers[0]?.price && <small>melhor preço</small>}</strong>
                      {offer.cashbackPercent
                        ? <button className="cashback-trigger" onClick={() => setCashbackOffer(offer)}>Ativar e ir <ArrowRight /></button>
                        : <a href={offer.affiliateUrl ?? offer.url} target="_blank" rel={affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} onClick={() => trackOutbound(offer.store, affiliate)}>Ver loja <ExternalLink /></a>}
                    </> : <span className="not-found">Indisponível<small>Veja as outras lojas</small></span>}
                  </div>;
                })}
              </div>
              {cashbackOffer && <form className="cashback-form" onSubmit={activateCashback}>
                <div><strong>Ativar cashback demonstrativo</strong><span>{cashbackOffer.cashbackPercent}% · cerca de {money.format(cashbackOffer.price * (cashbackOffer.cashbackPercent ?? 0) / 100)} após a compra ser aprovada</span></div>
                <input type="email" aria-label="E-mail para acompanhar cashback" placeholder="Seu e-mail" value={cashbackEmail} onChange={(event) => setCashbackEmail(event.target.value)} required />
                <button type="submit">Continuar para {cashbackOffer.store} <ArrowRight /></button>
                <button type="button" className="cashback-close" onClick={() => setCashbackOffer(null)} aria-label="Cancelar cashback"><X /></button>
              </form>}
            </div>
            <div className="secondary-action">
              <Bell />
              <div><strong>Ainda não decidiu?</strong><span>Avisamos quando baixar em qualquer loja.</span></div>
              <button onClick={() => setShowAlert((value) => !value)}>{showAlert ? 'Fechar' : 'Criar alerta'}</button>
            </div>
          </div>

          {showAlert && <form className="alert-form" onSubmit={saveAlert}>
            {alertSaved ? <div className="alert-success"><Check /><span><b>Alerta criado.</b> Vamos acompanhar todas as lojas.</span></div> : <>
              <label>Preço desejado <span className="input-wrap"><b>R$</b><input inputMode="numeric" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ''))} required /></span></label>
              <label>Seu e-mail <input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <button type="submit">Ativar alerta <ArrowRight /></button>
            </>}
          </form>}

          <div className="details-row">
            <details>
              <summary>Ver histórico simulado <ChevronDown /></summary>
              <div className="chart-panel">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={product.history} margin={{ top: 14, right: 8, bottom: 0, left: 0 }}>
                    <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20b875" stopOpacity={0.25} /><stop offset="100%" stopColor="#20b875" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e8e7e2" strokeDasharray="4 6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={30} tick={{ fill: '#7c817d', fontSize: 10 }} />
                    <YAxis hide domain={['dataMin - 120', 'dataMax + 80']} />
                    <Tooltip content={<PriceTooltip />} />
                    <ReferenceLine y={product.marketAverage} stroke="#ef8b64" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="price" stroke="#159764" strokeWidth={3} fill="url(#priceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
                <span>Menor preço diário entre lojas · <b>dados demonstrativos, não extraídos das lojas</b><br />Menor: <b>{money.format(product.lowestPrice)}</b> · Média: <b>{money.format(product.marketAverage)}</b></span>
              </div>
            </details>
            <details>
              <summary>Como verificamos a oferta <ChevronDown /></summary>
              <ul className="safety-list">
                <li><Check /> Produto novo e anúncio ativo</li>
                <li><Check /> Nota mínima 4,5 e mais de 100 opiniões</li>
                <li><Check /> Vendedor verde: {product.sellerLevel}</li>
                <li><Check /> Mesma variação e EAN comparados entre lojas</li>
                <li><Check /> Preço final considerará frete e cupons</li>
                <li><Check /> Comunidade poderá confirmar ou denunciar ofertas</li>
              </ul>
            </details>
          </div>
          <p className="disclosure"><b>Transparência:</b> preços, avaliações, cashback e histórico deste protótipo são simulados. Na versão conectada, cada oferta exibirá fonte, regras e horário da última atualização. Cashback só será oferecido em lojas que autorizem tráfego incentivado e após a compra ser confirmada.</p>
        </article>
      </section>

      <section className="more-section" id="ofertas">
        <div><span>Outras ofertas verificadas</span><h2>Escolha e veja a resposta.</h2></div>
        <div className="product-cards">
          {products.filter((item) => item.id !== product.id).slice(0, 5).map((item) => <button key={item.id} onClick={() => selectProduct(item)}>
            <ProductIcon kind={item.kind} compact /><span><strong>{item.title}</strong><small>{money.format(item.currentPrice)} · {item.rating.toFixed(1)} ★</small></span><ArrowRight />
          </button>)}
        </div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><TrendingDown /></span><span>Preço<span>Vista</span></span></a><p>Preço claro. Oferta segura. Decisão simples.</p><small>Protótipo com dados demonstrativos</small></footer>
    </main>
  );
}
