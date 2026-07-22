import { Candy } from 'lucide-react';
import type { Product } from '../../types';

interface ProductImageProps {
  product: Pick<Product, 'tint' | 'image' | 'name'>;
  className?: string;
}

export function ProductImage({ product, className = '' }: ProductImageProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: product.tint }}
    >
      {product.image ? (
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <Candy className="opacity-30" size={32} strokeWidth={1.6} color="#fff" />
      )}
    </div>
  );
}
