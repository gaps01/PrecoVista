import type { Metadata } from 'next';
import './globals.css';

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precovista.leopoldomolica.chatgpt.site',
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: 'PreçoVista — Inteligência para comprar na hora certa',
  description: 'Histórico de preços, sinais de compra e alertas para produtos do Mercado Livre.',
  openGraph: {
    title: 'PreçoVista — Inteligência para comprar na hora certa',
    description: 'Histórico de preços, sinais de compra e alertas para produtos do Mercado Livre.',
    images: [{ url: '/og.png', width: 1536, height: 816, alt: 'PreçoVista — Inteligência para comprar na hora certa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PreçoVista — Inteligência para comprar na hora certa',
    description: 'Histórico de preços, sinais de compra e alertas para produtos do Mercado Livre.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
