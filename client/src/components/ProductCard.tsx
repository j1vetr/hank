import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <motion.div
      data-testid={`card-product-${product.id}`}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <div className={`absolute -inset-[1px] rounded-sm bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isHovered ? 'animate-border-rotate' : ''}`} />
        
        <div className="relative aspect-[3/4] overflow-hidden bg-card rounded-sm">
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
            data-testid={`img-product-${product.id}`}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {product.isNew && (
            <motion.span
              className="absolute top-3 left-3 bg-white text-black text-[10px] font-bold px-2 py-1 tracking-wider"
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(255,255,255,0.4)', '0 0 0 8px rgba(255,255,255,0)', '0 0 0 0 rgba(255,255,255,0.4)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              data-testid={`badge-new-${product.id}`}
            >
              YENİ
            </motion.span>
          )}

          {discount > 0 && !product.isNew && (
            <span
              className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 tracking-wider"
              data-testid={`badge-discount-${product.id}`}
            >
              -%{discount}
            </span>
          )}

          <motion.button
            data-testid={`button-like-${product.id}`}
            onClick={(e) => { e.preventDefault(); setIsLiked(!isLiked); }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isHovered || isLiked ? 1 : 0,
              scale: isHovered || isLiked ? 1 : 0.8
            }}
            whileTap={{ scale: 0.9 }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLiked ? 'bg-red-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isHovered ? 1 : 0,
              y: isHovered ? 0 : 20
            }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 p-3"
          >
            <motion.button
              data-testid={`button-quick-add-${product.id}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-white text-black py-2.5 text-xs font-bold tracking-wider uppercase hover:bg-white/90 transition-colors"
            >
              Hızlı Ekle
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider" data-testid={`text-category-${product.id}`}>
          {product.category}
        </p>
        <h3 className="text-sm font-medium line-clamp-2 leading-snug" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" data-testid={`text-price-${product.id}`}>
            {product.price.toLocaleString('tr-TR')} ₺
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
              {product.originalPrice.toLocaleString('tr-TR')} ₺
            </span>
          )}
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {product.colors.map((color, index) => (
              <span
                key={index}
                className="w-3 h-3 rounded-full ring-1 ring-border"
                style={{ backgroundColor: color }}
                data-testid={`color-${product.id}-${index}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
