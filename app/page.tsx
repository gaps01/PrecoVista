'use client';

import {
  ArrowDownRight, ArrowRight, Bell, Check, ChevronDown, Info, Laptop, Menu,
  Refrigerator, Search, ShieldCheck, Smartphone, Sparkles, Target,
  TrendingDown, Tv, X,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

import { demoProducts, type DemoProduct, type ProductKind } from './demo-data';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type ApiProductSummary = {
  id: number; external_id: string; title: string; category: string; current_price: string;
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
};

function ProductIcon({ kind, compact = false }: { kind: ProductKind; compact?: boolean }) {
  const Icon = productIcons[kind];
  return <div className={compact ? 'product-icon compact' : 'product-icon'}><Icon aria-hidden="true" strokeWidth={1.55} /></div>;
}

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><span>{label}</span><strong>{money.format(payload[0].value)}</strong></div>;
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
    id: detail.external_id,
    backendId: detail.id,
    kind: inferKind(detail.title, detail.category),
    title: detail.title,
    category: detail.category,
    currentPrice,
    originalPrice: Math.max(...prices, currentPrice),
    lowestPrice: Math.min(...prices, currentPrice),
    marketAverage: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    percentile: detail.prediction.current_percentile,
    confidence: detail.prediction.confidence_score,
    trend: detail.prediction.predicted_trend,
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
  const [targetPrice, setTargetPrice] = useState('2999');
  const [email, setEmail] = useState('');
  const [alertSaved, setAlertSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const product = products.find((item) => item.id === selectedId) ?? products[0];
  const discount = Math.round((1 - product.currentPrice / product.originalPrice) * 100);
  const isGoodTime = product.percentile < 20;
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    if (!term) return [];
    const localResults = products.filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase('pt-BR').includes(term));
    return apiSearchResults ?? localResults;
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
          const existing = products.find((productItem) => productItem.id === item.external_id);
          return existing
            ? { ...existing, backendId: item.id, currentPrice: Number(item.current_price) }
            : {
                id: item.external_id, backendId: item.id, kind: inferKind(item.title, item.category),
                title: item.title, category: item.category, currentPrice: Number(item.current_price),
                originalPrice: Number(item.current_price), lowestPrice: Number(item.current_price),
                marketAverage: Number(item.current_price), percentile: 50, confidence: 45,
                trend: 'stable' as const, history: [{ date: 'Hoje', price: Number(item.current_price) }],
              };
        }));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setApiSearchResults(null);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [products, query]);

  useEffect(() => {
    setTargetPrice(String(Math.floor(product.currentPrice * 0.91)));
    setAlertSaved(false);
  }, [product]);

  async function selectProduct(item: DemoProduct) {
    setSelectedId(item.id);
    setQuery('');
    window.scrollTo({ top: 420, behavior: 'smooth' });
    if (apiUrl && item.backendId) {
      try {
        const response = await fetch(`${apiUrl}/api/products/${item.backendId}`);
        if (!response.ok) return;
        const resolved = mapApiDetail(await response.json() as ApiProductDetail);
        setProducts((current) => [...current.filter((entry) => entry.id !== resolved.id), resolved]);
      } catch {
        // The deployed prototype intentionally remains usable with its local demo data.
      }
    }
  }

  async function saveAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const alert = { productId: product.id, email, targetPrice, savedAt: new Date().toISOString() };
    window.localStorage.setItem(`precovista-alert-${product.id}`, JSON.stringify(alert));
    if (apiUrl && product.backendId) {
      try {
        await fetch(`${apiUrl}/api/watchlist`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, product_id: product.backendId, target_price: targetPrice }),
        });
      } catch {
        // Local storage keeps the prototype interaction reliable if the API is offline.
      }
    }
    setAlertSaved(true);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PreçoVista — início">
          <span className="brand-mark"><TrendingDown aria-hidden="true" /></span>
          <span>Preço<span>Vista</span></span>
        </a>
        <nav className={menuOpen ? 'nav open' : 'nav'} aria-label="Navegação principal">
          <a href="#analise">Como funciona</a><a href="#alerta">Meus alertas</a>
          <span className="demo-pill"><span /> Dados demonstrativos</span>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="eyebrow"><Sparkles aria-hidden="true" /> Inteligência de preço para compras melhores</div>
        <h1>O preço está bom.<br /><em>Ou parece que está?</em></h1>
        <p>Veja o histórico, entenda a tendência e descubra se vale comprar agora ou esperar um pouco.</p>

        <div className="search-shell">
          <Search aria-hidden="true" />
          <input aria-label="Buscar um produto" placeholder="Busque por celular, notebook, TV..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="button" onClick={() => searchResults[0] && selectProduct(searchResults[0])}>Analisar preço <ArrowRight aria-hidden="true" /></button>
          {query && (
            <div className="search-results">
              <div className="search-results-label">Produtos encontrados no protótipo</div>
              {searchResults.length ? searchResults.map((item) => (
                <button key={item.id} onClick={() => selectProduct(item)}>
                  <ProductIcon kind={item.kind} compact />
                  <span><strong>{item.title}</strong><small>{item.category}</small></span>
                  <span className="result-price">{money.format(item.currentPrice)}</span>
                </button>
              )) : <p>Nenhum resultado. Tente “Samsung”, “notebook”, “TV” ou “geladeira”.</p>}
            </div>
          )}
        </div>
        <div className="popular-searches"><span>Experimente:</span>{['Samsung', 'Notebook', 'Smart TV', 'Geladeira'].map((term) => <button key={term} onClick={() => setQuery(term)}>{term}</button>)}</div>
      </section>

      <section className="analysis-section" id="analise">
        <div className="section-intro">
          <div><span className="section-kicker">Análise em destaque</span><h2>Um sinal claro, sem adivinhação.</h2></div>
          <p>Comparamos o preço de hoje com o comportamento recente do mesmo anúncio.</p>
        </div>

        <div className="product-panel">
          <div className="product-summary">
            <ProductIcon kind={product.kind} />
            <div className="product-copy">
              <div className="market-tag">MERCADO LIVRE <span>•</span> {product.category}</div>
              <h3>{product.title}</h3>
              <div className="price-row">
                <strong>{money.format(product.currentPrice)}</strong>
                <span className="discount"><ArrowDownRight /> {discount}%</span>
                <small>era {money.format(product.originalPrice)}</small>
              </div>
            </div>
            <a className="market-link" href="#alerta">Criar alerta <ArrowRight /></a>
          </div>

          <div className="signal-banner">
            <div className={isGoodTime ? 'signal-icon good' : 'signal-icon wait'}>{isGoodTime ? <Check /> : <Info />}</div>
            <div>
              <span className="signal-label">Sinal PreçoVista</span>
              <h4>{isGoodTime ? 'Bom momento para comprar' : 'Vale a pena esperar'}</h4>
              <p>{isGoodTime
                ? `O preço atual está entre os ${product.percentile}% mais baixos do histórico recente e a tendência continua favorável.`
                : `O preço está acima da faixa historicamente atrativa. A tendência recente é de ${product.trend === 'rising' ? 'alta' : 'estabilidade'}.`}</p>
            </div>
            <div className="confidence"><strong>{product.confidence}%</strong><span>confiança do sinal</span></div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="card-heading"><div><span>Histórico de preço</span><h4>Últimos 90 dias</h4></div><button>90 dias <ChevronDown /></button></div>
              <div className="chart-wrap" aria-label="Gráfico do histórico de preços">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={product.history} margin={{ top: 16, right: 12, bottom: 0, left: 0 }}>
                    <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20b875" stopOpacity={0.28} /><stop offset="100%" stopColor="#20b875" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e8e7e2" strokeDasharray="4 6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} minTickGap={28} tick={{ fill: '#7c817d', fontSize: 11 }} />
                    <YAxis hide domain={['dataMin - 120', 'dataMax + 80']} />
                    <Tooltip content={<PriceTooltip />} cursor={{ stroke: '#173f34', strokeDasharray: '3 4' }} />
                    <ReferenceLine y={product.marketAverage} stroke="#ef8b64" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="price" stroke="#159764" strokeWidth={3} fill="url(#priceFill)" activeDot={{ r: 5, fill: '#fff', stroke: '#159764', strokeWidth: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend"><span><i className="green" /> Preço observado</span><span><i className="coral" /> Média do período: {money.format(product.marketAverage)}</span></div>
            </div>

            <aside className="insight-card">
              <div className="insight-heading"><Target /><span>Posição no histórico</span></div>
              <div className="percentile-ring" style={{ '--score': `${product.percentile * 3.6}deg` } as React.CSSProperties}><div><strong>{product.percentile}º</strong><span>percentil</span></div></div>
              <p>Em apenas <strong>{product.percentile}% dos dias</strong> o preço esteve mais baixo que hoje.</p>
              <div className="mini-stats"><div><span>Menor preço</span><strong>{money.format(product.lowestPrice)}</strong></div><div><span>Média recente</span><strong>{money.format(product.marketAverage)}</strong></div></div>
            </aside>
          </div>
        </div>
      </section>

      <section className="alert-section" id="alerta">
        <div className="alert-copy">
          <span className="section-kicker light">Alerta inteligente</span><h2>Você escolhe o preço.<br />A gente acompanha.</h2>
          <p>Receba um aviso quando a oferta chegar no valor que faz sentido para você.</p>
          <div className="trust-line"><ShieldCheck /> Sem spam. Só avisamos quando houver uma mudança importante.</div>
        </div>
        <form className="alert-form" onSubmit={saveAlert}>
          {alertSaved ? (
            <div className="success-state"><div><Check /></div><h3>Alerta criado!</h3><p>Vamos simular um aviso quando {product.title} chegar a <strong>{money.format(Number(targetPrice))}</strong>.</p><button type="button" onClick={() => setAlertSaved(false)}>Editar alerta</button></div>
          ) : (
            <>
              <div className="form-title"><Bell /><div><span>Avise-me quando chegar a</span><strong>{product.title}</strong></div></div>
              <label>Preço desejado<div className="currency-input"><span>R$</span><input inputMode="numeric" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value.replace(/\D/g, ''))} required /></div></label>
              <label>Seu melhor e-mail<input type="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
              <button className="save-alert" type="submit">Criar alerta gratuito <ArrowRight /></button>
              <small>Protótipo: o alerta fica salvo somente neste dispositivo.</small>
            </>
          )}
        </form>
      </section>

      <section className="other-products">
        <div className="section-intro compact"><div><span className="section-kicker">Outras análises</span><h2>Continue explorando</h2></div></div>
        <div className="product-cards">
          {products.filter((item) => item.id !== product.id).slice(0, 3).map((item) => (
            <button key={item.id} className="product-card" onClick={() => selectProduct(item)}>
              <ProductIcon kind={item.kind} compact />
              <span className="product-card-copy"><small>{item.category}</small><strong>{item.title}</strong><span>{money.format(item.currentPrice)}</span></span>
              <span className={item.percentile < 20 ? 'card-signal good' : 'card-signal'}>{item.percentile < 20 ? 'Bom preço' : 'Acompanhar'}</span>
            </button>
          ))}
        </div>
      </section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><TrendingDown /></span><span>Preço<span>Vista</span></span></a><p>Decisões melhores começam com preços mais claros.</p><span>Protótipo MVP • Dados demonstrativos</span></footer>
    </main>
  );
}
