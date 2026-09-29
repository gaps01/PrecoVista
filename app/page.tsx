'use client';

import {
  Bell, Check, ChefHat, ExternalLink, Info, Laptop, Menu, Refrigerator,
  Search, ShieldCheck, Smartphone, Star, Store, Tv, WashingMachine, X,
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
  const [menuOpen, setMenuOpen] = useState(false);

  const product = products.find((item) => item.id === selectedId) ?? products[0];
  const isGoodTime = product.percentile < 20;
  const availableOffers = [...product.offers].filter((offer) => offer.available).sort((a, b) => a.price - b.price);
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
    setMenuOpen(false);
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
      <div className="proof-bar"><span>PV / LAB 01</span><p>Protótipo com dados demonstrativos — nenhuma oferta é atualizada em tempo real</p><span>BR · 2026</span></div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="PreçoVista — início"><b>PREÇO</b><i>/</i><b>VISTA</b></a>
        <nav className={menuOpen ? 'nav open' : 'nav'}><a href="#resultado">Diagnóstico</a><a href="#ofertas">Comparar lojas</a><a href="#metodo">Método</a></nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="workbench" id="resultado">
        <div className="workbench-copy">
          <span className="section-code">01 — CONSULTA</span>
          <h1>Comprar agora<br />ou esperar?</h1>
          <p>Uma resposta objetiva, comparando preço, histórico e reputação da oferta.</p>
          <div className="search-shell">
            <Search aria-hidden="true" />
            <input aria-label="Buscar produto" placeholder="Busque celular, TV, geladeira..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <button onClick={() => searchResults[0] && selectProduct(searchResults[0])}>Analisar</button>
            {query && <div className="search-results">
              {searchResults.length ? searchResults.map((item) => <button key={item.id} onClick={() => selectProduct(item)}>
                <ProductIcon kind={item.kind} compact /><span><strong>{item.title}</strong><small>{item.category}</small></span><b>{money.format(item.currentPrice)}</b>
              </button>) : <p>Nenhum resultado. Tente “Samsung”, “TV” ou “geladeira”.</p>}
            </div>}
          </div>
          <div className="quick-picks" aria-label="Produtos de exemplo"><span>EXEMPLOS</span>{products.slice(0, 4).map((item) => <button className={item.id === product.id ? 'active' : ''} key={item.id} onClick={() => selectProduct(item)}>{item.category.split(' ')[0]}</button>)}</div>
        </div>

        <article className="verdict-sheet">
          <div className="case-line"><span>DIAGNÓSTICO / {product.id.replace('DEMO-', '').slice(-8)}</span><span>{product.confidence}% de confiança</span></div>
          <div className="product-identity"><ProductIcon kind={product.kind} /><div><small>{product.category}</small><h2>{product.title}</h2></div></div>
          <div className={isGoodTime ? 'verdict buy' : 'verdict wait'}>
            <div><span>RESPOSTA PREÇOVISTA</span><strong>{isGoodTime ? 'PODE COMPRAR' : 'MELHOR ESPERAR'}</strong></div>
            <p>{isGoodTime ? `O preço está entre os ${product.percentile}% menores do histórico.` : 'O preço ainda está fora da faixa que consideramos atrativa.'}</p>
          </div>
          <div className="price-ledger">
            <div><span>MENOR OFERTA</span><strong>{money.format(availableOffers[0]?.price ?? product.currentPrice)}</strong></div>
            <div><span>ECONOMIA VS. MÉDIA</span><strong>{averageSaving}%</strong></div>
            <div><span>MOVIMENTO</span><strong>{trendLabel[product.trend]}</strong></div>
          </div>
          <div className="trust-line"><span><ShieldCheck /> {product.trustScore}/100 segurança</span><span><Star /> {product.rating.toFixed(1)} em {product.reviewCount.toLocaleString('pt-BR')} avaliações</span><span><Store /> {product.officialStore ? 'Loja oficial' : product.sellerName}</span></div>
        </article>
      </section>

      <section className="comparison" id="ofertas">
        <header className="section-heading"><div><span className="section-code">02 — COMPARAÇÃO</span><h2>Mesma compra.<br /><em>Outras condições.</em></h2></div><p>{availableOffers.length} lojas encontradas. Priorizamos disponibilidade, preço e confiança do vendedor.</p></header>
        <div className="comparison-table">
          <div className="table-head"><span>ORDEM</span><span>LOJA / CONFIANÇA</span><span>PREÇO</span><span>BENEFÍCIO</span><span>AÇÃO</span></div>
          {orderedOffers.map((offer, index) => {
            const affiliate = Boolean(offer.affiliateUrl);
            const isBest = offer.available && offer.price === availableOffers[0]?.price;
            return <div className={`offer-line${!offer.available ? ' unavailable' : ''}${isBest ? ' best' : ''}`} key={offer.store}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="store-copy"><b>{offer.store}</b><small>{offer.note} · confiança {offer.trustScore}/100</small></span>
              {offer.available ? <>
                <strong className="offer-price">{money.format(offer.price)}{isBest && <small>MENOR PREÇO</small>}</strong>
                <span className="benefit">{offer.cashbackPercent ? <><b>{offer.cashbackPercent}%</b><small>cashback simulado</small></> : <small>sem cashback</small>}</span>
                {offer.cashbackPercent
                  ? <button className="offer-action cashback" onClick={() => setCashbackOffer(offer)}>Ativar cashback</button>
                  : <a className="offer-action" href={offer.affiliateUrl ?? offer.url} target="_blank" rel={affiliate ? 'noopener noreferrer sponsored' : 'noopener noreferrer'} onClick={() => trackOutbound(offer.store, affiliate)}>Abrir loja <ExternalLink /></a>}
              </> : <span className="unavailable-copy">Indisponível agora</span>}
            </div>;
          })}
        </div>
        {cashbackOffer && <form className="cashback-form" onSubmit={activateCashback}>
          <span className="form-index">CASHBACK / DEMO</span><div><strong>{cashbackOffer.store}: cerca de {money.format(cashbackOffer.price * (cashbackOffer.cashbackPercent ?? 0) / 100)} de volta</strong><p>Informe seu e-mail para criar uma viagem de compra demonstrativa.</p></div>
          <input type="email" aria-label="E-mail para acompanhar cashback" placeholder="seu@email.com" value={cashbackEmail} onChange={(event) => setCashbackEmail(event.target.value)} required /><button type="submit">Continuar para a loja</button><button type="button" className="close-form" onClick={() => setCashbackOffer(null)} aria-label="Cancelar cashback"><X /></button>
        </form>}
      </section>

      <section className="evidence" id="metodo">
        <div className="chart-block">
          <div className="block-heading"><span className="section-code">03 — HISTÓRICO</span><div><b>{money.format(product.lowestPrice)}</b><small>menor preço simulado</small></div></div>
          <div className="chart-panel"><ResponsiveContainer width="100%" height="100%"><AreaChart data={product.history} margin={{ top: 18, right: 12, bottom: 0, left: 0 }}><CartesianGrid vertical={false} stroke="#d8d5ca" /><XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={34} tick={{ fill: '#676b73', fontSize: 11 }} /><YAxis hide domain={['dataMin - 120', 'dataMax + 80']} /><Tooltip content={<PriceTooltip />} /><ReferenceLine y={product.marketAverage} stroke="#ff5a36" strokeDasharray="4 4" /><Area type="monotone" dataKey="price" stroke="#1746d1" strokeWidth={3} fill="#1746d1" fillOpacity={0.06} /></AreaChart></ResponsiveContainer></div>
          <p>Menor preço diário entre lojas. Linha laranja: média de {money.format(product.marketAverage)}. <b>Dados demonstrativos, não extraídos das lojas.</b></p>
        </div>
        <aside className="method-block">
          <span className="section-code">04 — PROTOCOLO</span><h2>O que passa<br />pelo filtro.</h2>
          <ol><li><span>01</span><p><b>Produto equivalente</b>Mesma variação, capacidade e EAN.</p></li><li><span>02</span><p><b>Reputação comprovada</b>Nota alta, volume de avaliações e vendedor verificado.</p></li><li><span>03</span><p><b>Preço final comparável</b>Frete e cupons entram na conta quando disponíveis.</p></li></ol>
          <button className="alert-trigger" onClick={() => setShowAlert((value) => !value)}><Bell /> {showAlert ? 'Fechar alerta' : 'Avisar quando baixar'}</button>
        </aside>
      </section>

      {showAlert && <section className="alert-drawer">
        {alertSaved ? <div className="alert-success"><Check /><span><b>Alerta registrado.</b> Vamos acompanhar todas as lojas deste produto.</span></div> : <form onSubmit={saveAlert}>
          <div><span className="section-code">ALERTA DE PREÇO</span><h2>Quanto você quer pagar?</h2></div>
          <label>Preço desejado <span className="money-input"><b>R$</b><input inputMode="numeric" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ''))} required /></span></label>
          <label>Seu e-mail <input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <button type="submit">Criar alerta</button>
        </form>}
      </section>}

      <section className="catalogue">
        <header className="section-heading compact"><div><span className="section-code">05 — OUTRAS ANÁLISES</span><h2>Continue comparando.</h2></div></header>
        <div className="catalogue-list">{products.filter((item) => item.id !== product.id).slice(0, 5).map((item, index) => <button key={item.id} onClick={() => selectProduct(item)}>
          <span className="rank">{String(index + 1).padStart(2, '0')}</span><ProductIcon kind={item.kind} compact /><span><b>{item.title}</b><small>{item.category}</small></span><strong>{money.format(item.currentPrice)}</strong><em>{item.percentile < 20 ? 'BOM MOMENTO' : 'ACOMPANHAR'}</em>
        </button>)}</div>
      </section>

      <section className="disclosure"><Info /><p><b>Transparência:</b> preços, avaliações, cashback e histórico deste protótipo são simulados. Na versão conectada, cada oferta exibirá fonte, regras e horário da última atualização. Cashback só será oferecido em lojas que autorizem tráfego incentivado e após a compra ser confirmada.</p></section>

      <footer><a className="brand" href="#top"><b>PREÇO</b><i>/</i><b>VISTA</b></a><p>Decisão de compra, sem ruído.</p><span>PV / LAB 01 — DADOS DEMONSTRATIVOS</span></footer>
    </main>
  );
}
