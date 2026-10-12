import { NextRequest, NextResponse } from 'next/server';
import { chatGPTSignInPath } from '@/app/chatgpt-auth';
import { currentAdmin } from '@/lib/admin';
import { mercadoLivreAuthorizationUrl } from '@/lib/mercado-livre';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const admin = await currentAdmin();
  if (!admin.user) {
    return NextResponse.redirect(new URL(chatGPTSignInPath('/admin/integrations'), request.url));
  }
  if (!admin.authorized) {
    return NextResponse.json({ error: 'Apenas o proprietário pode conectar integrações.' }, { status: 403 });
  }

  try {
    const state = crypto.randomUUID();
    const response = NextResponse.redirect(mercadoLivreAuthorizationUrl(state, request));
    response.cookies.set('precovista_ml_oauth_state', state, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Integração não configurada.';
    return NextResponse.redirect(new URL(`/admin/integrations?error=${encodeURIComponent(message)}`, request.url));
  }
}
