# Double Candy — App Cliente

Recriação em código (React + Vite + TypeScript + Tailwind CSS v4) do handoff de design `design_handoff_double_candy`: design system e fluxo do cliente (splash → login → home → detalhe do produto → carrinho → confirmação → histórico).

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (tokens de cor/tipografia/raio definidos em `src/index.css` via `@theme`)
- React Router (rotas do fluxo do cliente)
- Zustand (auth, carrinho, pedidos, UI/toast)
- Lucide React (ícones)
- Fontes: Space Grotesk (títulos/números) + Manrope (corpo), via Google Fonts

## Rodando localmente

```bash
npm install
npm run dev
```

## Estrutura

- `src/index.css` — tokens de design (cores, radii, fontes, keyframes das animações `dc*`)
- `src/components/ui` — componentes base do design system (Button, Input, Chip, Badge, IconButton, QuantityStepper, Toast, EmptyState, Skeleton/Spinner, ProductImage)
- `src/components/layout` — BottomNav
- `src/components/cart` — carrinho (bottom sheet no mobile / drawer no desktop) e resumo do pedido
- `src/screens` — Splash, Login, Home, ProductDetail, Confirmation, History
- `src/store` — stores Zustand (auth, cart, order, ui)
- `src/data/products.ts` — catálogo mockado

## Notas de fidelidade

- As imagens de produto são placeholders (gradiente + ícone), como indicado no handoff — substitua `product.image` por URLs reais quando disponíveis.
- No desktop, o carrinho abre como drawer lateral e a confirmação é exibida dentro do próprio drawer; no mobile, o carrinho é um bottom sheet e a confirmação troca de tela.
