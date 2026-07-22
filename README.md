# Double Candy

Recriação em código (React + Vite + TypeScript + Tailwind CSS v4) do handoff de design `design_handoff_double_candy`: design system, fluxo do cliente (splash → login → home → detalhe do produto → carrinho → confirmação → histórico) e painel admin completo (dashboard, produtos, categorias, pedidos, preparar amanhã, retirada, clientes, relatórios, configurações). Backend real em Supabase (Postgres + Edge Function + Storage), deploy contínuo no Vercel.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tokens de cor/tipografia/raio definidos em `src/index.css` via `@theme`)
- React Router (rotas do cliente e do admin)
- Zustand (auth, carrinho, pedidos, produtos, categorias, UI/toast, estado do admin)
- Lucide React (ícones)
- Fontes: Space Grotesk (títulos/números) + Manrope (corpo), via Google Fonts
- Supabase: Postgres (RLS habilitado) + Edge Function (Hono, `supabase/functions/api`) como única porta de entrada para leituras/escritas privilegiadas + Storage (bucket público `product-images`)
- Vercel: deploy automático a partir de `main` (`vercel.json` declara o framework Vite explicitamente)

## Rodando localmente

```bash
npm install
npm run dev
```

Faça login em `/login` (qualquer nome + telefone) — o link "Acessar painel admin" no rodapé do formulário leva direto para `/admin/dashboard`. As variáveis `VITE_API_BASE_URL` e `VITE_SUPABASE_ANON_KEY` (em `.env`) apontam para o backend real — sem elas o app não carrega dados.

## Estrutura

- `src/index.css` — tokens de design (cores, radii, fontes, keyframes das animações `dc*`)
- `src/components/ui` — componentes base do design system (Button, Input, Select, Switch, Chip, Badge, IconButton, QuantityStepper, Toast, EmptyState, Skeleton/Spinner, ProductImage)
- `src/components/layout` — BottomNav (cliente) e AdminLayout (sidebar + topbar)
- `src/components/cart` — carrinho (bottom sheet no mobile / drawer no desktop) e resumo do pedido
- `src/components/admin` — KpiCard, modal de produto (com upload de foto)
- `src/components/charts` — gráficos de linha, donut e barras (SVG, sem libs externas)
- `src/screens` — Splash, Login, Home, ProductDetail, Confirmation, History (com cancelamento de pedido)
- `src/screens/admin` — Dashboard, Products, Categories, Orders, Prepare, Pickup, Clients, Reports, Settings
- `src/store` — stores Zustand (auth, cart, order, products, categories, ui, admin)
- `src/lib/api.ts` — cliente HTTP tipado para a Edge Function
- `supabase/functions/api` — Edge Function (Hono) com todas as rotas: store, categories, products (+ upload de imagem), orders, pickup, clients, prepare, dashboard, reports

## Notas de fidelidade

- No desktop, o carrinho abre como drawer lateral e a confirmação é exibida dentro do próprio drawer; no mobile, o carrinho é um bottom sheet e a confirmação troca de tela.
- Moeda armazenada em centavos (`priceCents`, `totalCents`), formatada via `formatBRLCents`.
- Datas de "hoje"/"amanhã" calculadas com offset fixo `America/Sao_Paulo` (UTC-3, sem horário de verão), tanto no frontend quanto na Edge Function.
- Login é simples (nome + telefone, sem verificação SMS/OTP) — decisão deliberada, não uma limitação técnica.
