import { Candy } from 'lucide-react';
import { tintForId } from '../../lib/tint';

interface ProductImageProps {
  product: { id: string; name: string; imageUrl?: string | null };
  className?: string;
}

export function ProductImage({ product, className = '' }: ProductImageProps) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: tintForId(product.id) }}
    >
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <Candy className="opacity-30" size={32} strokeWidth={1.6} color="#fff" />
      )}
    </div>
  );
}
