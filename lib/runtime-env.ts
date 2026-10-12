import { env } from 'cloudflare:workers';

export type PrecoVistaEnv = CloudflareEnv;

export function runtimeEnv(): PrecoVistaEnv {
  return env as unknown as PrecoVistaEnv;
}

export function siteOrigin(request?: Request): string {
  const configured = runtimeEnv().PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (request) return new URL(request.url).origin;
  return 'https://precovista.leopoldomolica.chatgpt.site';
}
