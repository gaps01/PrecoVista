# PreçoVista

Site responsivo em Next.js/Vinext para comparar ofertas seguras e acompanhar preços. A versão pública continua utilizável como demonstração enquanto as credenciais das lojas não estiverem configuradas.

## Dados reais do Mercado Livre

A integração roda no servidor do próprio Site e nunca envia tokens ao navegador. Ela inclui:

- OAuth com validação de estado e renovação de token;
- tokens criptografados em repouso;
- filtro de produtos novos com nota mínima 4, pelo menos 20 avaliações e vendedor confiável;
- reputação, volume de vendas e identificação de loja oficial;
- banco D1 para ofertas e histórico de preços;
- histórico iniciado na primeira busca real, sem inventar dados anteriores;
- painel administrativo separado em `/admin/integrations`.

Variáveis necessárias na hospedagem:

```text
MERCADO_LIVRE_CLIENT_ID
MERCADO_LIVRE_CLIENT_SECRET
MERCADO_LIVRE_TOKEN_ENCRYPTION_KEY
MERCADO_LIVRE_SITE_ID=MLB
PRECOVISTA_ADMIN_USER_ID
PUBLIC_SITE_URL=https://precovista.leopoldomolica.chatgpt.site
```

Cadastre no DevCenter o retorno OAuth:

```text
https://precovista.leopoldomolica.chatgpt.site/api/integrations/mercado-livre/callback
```

`MERCADO_LIVRE_CLIENT_SECRET` e `MERCADO_LIVRE_TOKEN_ENCRYPTION_KEY` devem ser secretos. Não coloque credenciais em arquivos versionados ou no GitHub.

## Desenvolvimento local

```powershell
pnpm install
pnpm dev
```

Abra o endereço mostrado no terminal. Sem credenciais locais, as rotas informam modo de demonstração e a interface usa o catálogo representativo.
