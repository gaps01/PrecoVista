import { ArrowLeft, CheckCircle2, Link2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { chatGPTSignInPath, getChatGPTUser } from '@/app/chatgpt-auth';
import { mercadoLivreCallbackUrl, mercadoLivreConnectionStatus } from '@/lib/mercado-livre';
import { runtimeEnv } from '@/lib/runtime-env';

export const dynamic = 'force-dynamic';

export default async function IntegrationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const parameters = await searchParams;
  const user = await getChatGPTUser();
  const adminUserId = runtimeEnv().PRECOVISTA_ADMIN_USER_ID;

  if (!user) {
    return <main className="admin-page"><section className="admin-shell admin-gate">
      <LockKeyhole />
      <p>Área administrativa</p>
      <h1>Entre somente para conectar suas lojas.</h1>
      <p>O site público continua aberto para todos. Esta autenticação protege apenas credenciais e integrações.</p>
      <a className="admin-primary" href={chatGPTSignInPath('/admin/integrations')} target="_top">Entrar como proprietário</a>
      <a className="admin-back" href="/"><ArrowLeft /> Voltar ao PreçoVista</a>
    </section></main>;
  }

  if (!adminUserId || user.userId !== adminUserId) {
    return <main className="admin-page"><section className="admin-shell admin-gate">
      <ShieldCheck />
      <p>Acesso protegido</p>
      <h1>Esta área pertence ao proprietário do PreçoVista.</h1>
      <a className="admin-back" href="/"><ArrowLeft /> Voltar ao site</a>
    </section></main>;
  }

  const status = await mercadoLivreConnectionStatus();
  return <main className="admin-page">
    <section className="admin-shell">
      <a className="admin-back" href="/"><ArrowLeft /> Voltar ao PreçoVista</a>
      <div className="admin-heading">
        <p>PAINEL DO PROPRIETÁRIO</p>
        <h1>Fontes de preços</h1>
        <span>Conecte uma loja por vez. As chaves permanecem no servidor e nunca aparecem no navegador.</span>
      </div>

      {parameters.connected && <div className="admin-notice success"><CheckCircle2 /> Mercado Livre conectado com sucesso.</div>}
      {parameters.error && <div className="admin-notice error">{parameters.error}</div>}

      <article className="integration-card">
        <div className="integration-mark">ML</div>
        <div className="integration-copy">
          <small>PRIMEIRA FONTE</small>
          <h2>Mercado Livre</h2>
          <p>Preços atuais, avaliações e reputação de vendedores. Apenas ofertas novas, bem avaliadas e de vendedores confiáveis entram na busca.</p>
          <dl>
            <div><dt>Configuração</dt><dd>{status.configured ? 'Pronta' : 'Aguardando credenciais'}</dd></div>
            <div><dt>Conta</dt><dd>{status.connected ? 'Conectada' : 'Não conectada'}</dd></div>
            <div><dt>Retorno OAuth</dt><dd>{mercadoLivreCallbackUrl()}</dd></div>
          </dl>
        </div>
        <div className="integration-action">
          <span className={status.connected ? 'status-pill live' : 'status-pill'}>{status.connected ? 'ATIVA' : 'PENDENTE'}</span>
          {status.configured
            ? <a className="admin-primary" href="/api/integrations/mercado-livre/start"><Link2 /> {status.connected ? 'Reconectar' : 'Conectar conta'}</a>
            : <p>Cadastre o Client ID e o Client Secret na hospedagem para liberar a autorização.</p>}
        </div>
      </article>

      <div className="admin-next">
        <span>PRÓXIMAS FONTES</span>
        <div><b>Amazon Brasil</b><small>Aguardando aprovação na Creators API</small></div>
        <div><b>Magazine Luiza e Grupo Casas Bahia</b><small>Aguardando aprovação nos programas de afiliados e feeds</small></div>
      </div>
    </section>
  </main>;
}
