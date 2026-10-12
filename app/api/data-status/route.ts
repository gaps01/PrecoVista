import { NextResponse } from 'next/server';
import { mercadoLivreConnectionStatus } from '@/lib/mercado-livre';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mercadoLivre = await mercadoLivreConnectionStatus();
  return NextResponse.json({
    mode: mercadoLivre.connected ? 'live' : 'demo',
    providers: {
      mercado_livre: mercadoLivre,
    },
    checked_at: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
