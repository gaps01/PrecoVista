import { NextRequest, NextResponse } from 'next/server';
import { currentAdmin } from '@/lib/admin';
import { exchangeMercadoLivreCode } from '@/lib/mercado-livre';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin.authorized) {
    return NextResponse.json({ error: 'Acesso administrativo necessário.' }, { status: 403 });
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('precovista_ml_oauth_state')?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL('/admin/integrations?error=Autorização inválida ou expirada.', request.url));
  }

  try {
    await exchangeMercadoLivreCode(code, request);
    const response = NextResponse.redirect(new URL('/admin/integrations?connected=1', request.url));
    response.cookies.delete('precovista_ml_oauth_state');
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível concluir a autorização.';
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(message)}`, request.url));
  }
}
