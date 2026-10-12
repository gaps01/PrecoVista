import type { Metadata } from 'next';
import './globals.css';

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precovista.leopoldomolica.chatgpt.site',
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: 'PreçoVista — Decisão de compra, sem ruído',
  description: 'Compare preços, reputação e histórico entre grandes lojas antes de decidir a compra.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'PreçoVista — Decisão de compra, sem ruído',
    description: 'Compare preços, reputação e histórico entre grandes lojas antes de decidir a compra.',
    images: [{ url: '/og.png', width: 1536, height: 816, alt: 'PreçoVista — comparação e decisão de compra' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PreçoVista — Decisão de compra, sem ruído',
    description: 'Compare preços, reputação e histórico entre grandes lojas antes de decidir a compra.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
