import { useState } from 'react';
import { Heart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  colors?: string[];
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div
      data-testid={`card-product-${product.id}`}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-card mb-4">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          data-testid={`img-product-${product.id}`}
        />

        {product.isNew && (
          <span
            className="absolute top-4 left-4 bg-foreground text-background text-xs font-bold px-3 py-1 tracking-wider"
            data-testid={`badge-new-${product.id}`}
          >
            YENİ
          </span>
        )}

        {discount > 0 && (
          <span
            className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 tracking-wider"
            data-testid={`badge-discount-${product.id}`}
          >
            -%{discount}
          </span>
        )}

        <button
          data-testid={`button-like-${product.id}`}
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
            isHovered || isLiked ? 'opacity-100' : 'opacity-0'
          } ${isLiked ? 'bg-red-600 text-white' : 'bg-background/80 text-foreground'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            data-testid={`button-quick-add-${product.id}`}
            className="w-full bg-foreground text-background py-3 text-sm font-semibold tracking-wide uppercase hover:bg-foreground/90 transition-colors"
          >
            Hızlı Ekle
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider" data-testid={`text-category-${product.id}`}>
          {product.category}
        </p>
        <h3 className="font-medium line-clamp-2" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-3">
          <span className="font-semibold" data-testid={`text-price-${product.id}`}>
            {product.price.toLocaleString('tr-TR')} TL
          </span>
          {product.originalPrice && (
            <span className="text-muted-foreground line-through text-sm" data-testid={`text-original-price-${product.id}`}>
              {product.originalPrice.toLocaleString('tr-TR')} TL
            </span>
          )}
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            {product.colors.map((color, index) => (
              <span
                key={index}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
                data-testid={`color-${product.id}-${index}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
