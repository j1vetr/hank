import React, { useState, memo } from 'react';
import { Heart, Loader2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { QuickViewModal } from './QuickViewModal';
import { getOriginalPrice } from '@/lib/discountPrice';

interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  colorHex?: string;
  price: string;
  stock: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
  isNew?: boolean;
  discountBadge?: string | null;
  variants?: ProductVariant[];
  availableSizes?: string[];
  availableColors?: { name: string; hex: string }[];
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { toggleFavorite, isLoading: isFavoriteLoading } = useToggleFavorite();
  
  const isLiked = favoriteIds.includes(product.id);

  const price = parseFloat(product.basePrice || '0') || 0;
  const originalPrice = getOriginalPrice(price, product.discountBadge);
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop';
  
  const uniqueColors = product.variants 
    ? Array.from(new Set(product.variants.map(v => v.colorHex).filter(Boolean)))
    : [];

  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) ?? 0;
  const isOutOfStock = product.variants && product.variants.length > 0 && totalStock === 0;

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <Link href={`/urun/${product.slug}`}>
        <motion.div
          data-testid={`card-product-${product.id}`}
          className="group relative cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900 rounded-lg border border-white/10 group-hover:border-white/20 transition-all duration-300"
              style={{
                boxShadow: isHovered 
                  ? 'inset 0 0 20px 0 rgba(255,255,255,0.08), inset 0 0 40px 0 rgba(236,72,153,0.05)' 
                  : 'inset 0 0 0 0 rgba(255,255,255,0)'
              }}
            >
              <motion.img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                animate={{ scale: isHovered ? 1.08 : 1 }}
                transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                data-testid={`img-product-${product.id}`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {product.discountBadge && !isOutOfStock && (
                <motion.div
                  className="absolute top-2 left-2 z-10"
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  data-testid={`badge-discount-${product.id}`}
                >
                  <div className="bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-md shadow-lg shadow-red-900/40 tracking-wide">
                    {product.discountBadge}
                  </div>
                </motion.div>
              )}

              {product.isNew && !isOutOfStock && !product.discountBadge && (
                <motion.span
                  className="absolute top-3 left-3 bg-pink-500 text-white text-[10px] font-bold px-2 py-1 tracking-wider rounded"
                  animate={{ 
                    boxShadow: ['0 0 0 0 rgba(236,72,153,0.4)', '0 0 0 8px rgba(236,72,153,0)', '0 0 0 0 rgba(236,72,153,0.4)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  data-testid={`badge-new-${product.id}`}
                >
                  YENİ
                </motion.span>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 tracking-wider rounded">
                    TÜKENDİ
                  </span>
                </div>
              )}

              <motion.button
                data-testid={`button-like-${product.id}`}
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation();
                  if (!isFavoriteLoading) {
                    toggleFavorite(product.id, isLiked); 
                  }
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isHovered || isLiked ? 1 : 0,
                  scale: isHovered || isLiked ? 1 : 0.8
                }}
                whileTap={{ scale: 0.9 }}
                disabled={isFavoriteLoading}
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isLiked ? 'bg-red-600 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                } ${isFavoriteLoading ? 'opacity-50' : ''}`}
              >
                {isFavoriteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                )}
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 20
                }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-3 hidden sm:block"
              >
                <motion.button
                  data-testid={`button-quick-view-${product.id}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleQuickView}
                  className="w-full bg-white text-black py-2.5 text-xs font-bold tracking-wider uppercase hover:bg-white/90 transition-colors flex items-center justify-center gap-2 rounded"
                >
                  <Eye className="w-4 h-4" />
                  Hızlı Bakış
                </motion.button>
              </motion.div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <h3 className="text-sm font-medium line-clamp-2 leading-snug" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              {originalPrice && (
                <span className="text-xs text-white/40 line-through" data-testid={`text-original-price-${product.id}`}>
                  {originalPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                </span>
              )}
              <span className="text-sm font-bold text-pink-400" data-testid={`text-price-${product.id}`}>
                {price.toLocaleString('tr-TR')} ₺
              </span>
            </div>

            {uniqueColors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1">
                {uniqueColors.slice(0, 5).map((color, index) => (
                  <span
                    key={index}
                    className="w-3 h-3 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: color as string }}
                    data-testid={`color-${product.id}-${index}`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </Link>

      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
});
