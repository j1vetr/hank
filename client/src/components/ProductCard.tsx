import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
  isNew?: boolean;
  variants?: Array<{ colorHex?: string }>;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  const price = parseFloat(product.basePrice || '0') || 0;
  const mainImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop';
  
  const uniqueColors = product.variants 
    ? Array.from(new Set(product.variants.map(v => v.colorHex).filter(Boolean)))
    : [];

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      await addToCart(product.id);
      toast({ title: 'Sepete Eklendi', description: product.name });
    } catch (error) {
      toast({ title: 'Hata', description: 'Sepete eklenemedi', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  return (
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
          <div className={`absolute -inset-[1px] rounded-sm bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isHovered ? 'animate-border-rotate' : ''}`} />
          
          <div className="relative aspect-[3/4] overflow-hidden bg-card rounded-sm">
            <motion.img
              src={mainImage}
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
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="w-full bg-white text-black py-2.5 text-xs font-bold tracking-wider uppercase hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isAdding ? 'Ekleniyor...' : 'Hızlı Ekle'}
            </motion.button>
          </motion.div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <h3 className="text-sm font-medium line-clamp-2 leading-snug" data-testid={`text-product-name-${product.id}`}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" data-testid={`text-price-${product.id}`}>
            {price.toLocaleString('tr-TR')} ₺
          </span>
        </div>

        {uniqueColors.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1">
            {uniqueColors.slice(0, 5).map((color, index) => (
              <span
                key={index}
                className="w-3 h-3 rounded-full ring-1 ring-border"
                style={{ backgroundColor: color as string }}
                data-testid={`color-${product.id}-${index}`}
              />
            ))}
          </div>
        )}
      </div>
      </motion.div>
    </Link>
  );
}
