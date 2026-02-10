import { useState, useEffect } from 'react';
import { X, Minus, Plus, Loader2, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { useCartModal } from '@/hooks/useCartModal';

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
  variants?: ProductVariant[];
  availableSizes?: string[];
  availableColors?: { name: string; hex: string }[];
}

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { showModal } = useCartModal();

  useEffect(() => {
    if (isOpen && product) {
      setSelectedSize(null);
      setSelectedColor(null);
      setQuantity(1);
      setCurrentImageIndex(0);
      
      if (product.availableColors && product.availableColors.length > 0) {
        setSelectedColor(product.availableColors[0].hex);
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!product) return null;

  const price = parseFloat(product.basePrice || '0');
  const sizes = product.availableSizes || [];
  const colors = product.availableColors || [];

  const getStockForVariant = (size: string, colorHex?: string) => {
    if (!product.variants) return 0;
    const variant = product.variants.find(v => 
      v.size === size && 
      (!colorHex || v.colorHex === colorHex) &&
      v.isActive
    );
    return variant?.stock || 0;
  };

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    
    setIsAdding(true);
    try {
      const variant = product.variants?.find(v => 
        v.size === selectedSize && 
        (!selectedColor || v.colorHex === selectedColor)
      );
      
      if (variant) {
        for (let i = 0; i < quantity; i++) {
          await addToCart(product.id, variant.id);
        }
        showModal({
          name: product.name,
          image: product.images[0],
          price: price,
          quantity: quantity,
          size: selectedSize,
        });
        onClose();
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-xl border border-white/10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-square md:aspect-auto md:h-full bg-zinc-800">
                <img
                  src={product.images[currentImageIndex] || '/placeholder.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.images.slice(0, 5).map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                          currentImageIndex === index ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8 flex flex-col">
                <h2 className="font-display text-2xl md:text-3xl tracking-wide mb-2">
                  {product.name}
                </h2>
                
                <p className="text-2xl font-bold text-pink-400 mb-6">
                  ₺{price.toLocaleString('tr-TR')}
                </p>

                {colors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-white/60 mb-3">Renk</p>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color.hex}
                          onClick={() => setSelectedColor(color.hex)}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            selectedColor === color.hex
                              ? 'border-white scale-110'
                              : 'border-transparent hover:border-white/50'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-white/60 mb-3">Beden</p>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const stock = getStockForVariant(size, selectedColor || undefined);
                        const isOutOfStock = stock === 0;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                            disabled={isOutOfStock}
                            className={`min-w-[48px] h-12 px-4 rounded-lg border text-sm font-medium transition-all ${
                              selectedSize === size
                                ? 'border-white bg-white text-black'
                                : isOutOfStock
                                ? 'border-white/10 text-white/30 cursor-not-allowed line-through'
                                : 'border-white/20 hover:border-white/50'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-white/60 mb-3">Adet</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || isAdding}
                    className="w-full py-4 bg-white text-black font-bold tracking-wider uppercase flex items-center justify-center gap-3 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    {isAdding ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingBag className="w-5 h-5" />
                    )}
                    {isAdding ? 'Ekleniyor...' : selectedSize ? 'Sepete Ekle' : 'Beden Seçiniz'}
                  </button>
                  
                  <a
                    href={`/urun/${product.slug}`}
                    className="block text-center text-sm text-white/60 hover:text-white mt-4 transition-colors"
                  >
                    Ürün Detaylarını Gör →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
