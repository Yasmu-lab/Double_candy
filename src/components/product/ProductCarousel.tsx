import type { ReactNode } from 'react';
import type { Product } from '../../types';
import { ProductCard } from './ProductCard';

interface ProductCarouselProps {
  title: string;
  icon: ReactNode;
  products: Product[];
}

export function ProductCarousel({ title, icon, products }: ProductCarouselProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-6 lg:mt-7">
      <div className="mb-3 flex items-center gap-2 lg:mb-4">
        {icon}
        <h2 className="font-display text-lg font-bold lg:text-xl">{title}</h2>
      </div>
      <div className="no-scrollbar flex gap-3.5 overflow-x-auto pb-1 lg:gap-[18px]">
        {products.map((p) => (
          <div key={p.id} className="w-[155px] shrink-0 sm:w-[180px] lg:w-[220px]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
