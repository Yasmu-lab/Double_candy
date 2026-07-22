# Double Candy

Recriação em código (React + Vite + TypeScript + Tailwind CSS v4) do handoff de design `design_handoff_double_candy`: design system, fluxo do cliente (splash → login → home → detalhe do produto → carrinho → confirmação → histórico) e painel admin (dashboard, produtos, pedidos, preparar amanhã, retirada, clientes, relatórios).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tokens de cor/tipografia/raio definidos em `src/index.css` via `@theme`)
- React Router (rotas do cliente e do admin)
- Zustand (auth, carrinho, pedidos, produtos, UI/toast, estado do admin)
- Lucide React (ícones)
- Fontes: Space Grotesk (títulos/números) + Manrope (corpo), via Google Fonts

## Rodando localmente

```bash
npm install
npm run dev
```

Faça login em `/login` (qualquer nome + telefone) — o link "Acessar painel admin" no rodapé do formulário leva direto para `/admin/dashboard`.

## Estrutura

- `src/index.css` — tokens de design (cores, radii, fontes, keyframes das animações `dc*`)
- `src/components/ui` — componentes base do design system (Button, Input, Select, Switch, Chip, Badge, IconButton, QuantityStepper, Toast, EmptyState, Skeleton/Spinner, ProductImage)
- `src/components/layout` — BottomNav (cliente) e AdminLayout (sidebar + topbar)
- `src/components/cart` — carrinho (bottom sheet no mobile / drawer no desktop) e resumo do pedido
- `src/components/admin` — KpiCard, modal de produto
- `src/components/charts` — gráficos de linha, donut e barras (SVG, sem libs externas)
- `src/screens` — Splash, Login, Home, ProductDetail, Confirmation, History
- `src/screens/admin` — Dashboard, Products, Orders, Prepare, Pickup, Clients, Reports, Placeholder (Categorias/Configurações)
- `src/store` — stores Zustand (auth, cart, order, products, ui, admin)
- `src/data` — catálogo, itens de preparo e clientes mockados

## Notas de fidelidade

- As imagens de produto são placeholders (gradiente + ícone), como indicado no handoff — substitua `product.image` por URLs reais quando disponíveis.
- No desktop, o carrinho abre como drawer lateral e a confirmação é exibida dentro do próprio drawer; no mobile, o carrinho é um bottom sheet e a confirmação troca de tela.
- Pedidos do cliente logado (`isMine`) e os 5 pedidos de demonstração do admin (outros clientes) compartilham a mesma store — o Histórico do cliente mostra só os seus; o admin vê todos.
- CRUD de produtos, status de pedido, separação "Preparar amanhã" e "Retirada" são mutações em memória (sem backend) — consistente com o restante do protótipo mockado.
