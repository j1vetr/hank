import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Link, useParams } from 'wouter';
import { 
  ChevronRight, 
  Heart, 
  Truck, 
  RotateCcw, 
  Minus, 
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCartModal } from '@/hooks/useCartModal';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { data: product, isLoading: productLoading } = useProduct(params.slug || '');
  const { data: allProducts = [] } = useProducts({});
  const { addToCart } = useCart();
  const { showModal } = useCartModal();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    const hasVariants = product.variants && product.variants.length > 0;
    const hasSizes = hasVariants && product.variants!.some(v => v.size);
    
    if (hasSizes && !selectedSize) {
      toast({ title: 'Uyarı', description: 'Lütfen bir beden seçiniz', variant: 'destructive' });
      return;
    }
    
    setIsAdding(true);
    try {
      const variant = selectedSize ? product.variants?.find(v => v.size === selectedSize) : undefined;
      await addToCart(product.id, variant?.id, quantity);
      const mainImage = product.images?.length > 0 
        ? product.images[0] 
        : 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop';
      showModal({
        name: product.name,
        image: mainImage,
        price: parseFloat(product.basePrice || '0') * quantity,
        size: selectedSize || undefined,
        quantity: quantity,
      });
    } catch (error) {
      toast({ title: 'Hata', description: 'Sepete eklenemedi', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const uniqueSizes = product?.variants
    ? Array.from(new Set(product.variants.map(v => v.size).filter((s): s is string => Boolean(s))))
    : [];

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-[1200px] mx-auto flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <h1 className="font-display text-4xl mb-4">Ürün Bulunamadı</h1>
            <Link href="/">
              <span className="text-muted-foreground hover:text-foreground">Ana Sayfaya Dön</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const images = product.images?.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop'];

  const price = parseFloat(product.basePrice || '0');
  const relatedProducts = allProducts.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <motion.div 
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-white/50 via-white to-white/50 z-[100]"
        style={{ width: progressWidth }}
      />

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.button
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              src={images[selectedImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-6"
          >
            <Link href="/">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-3"
            >
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-[3/4] rounded overflow-hidden transition-all ${
                      index === selectedImage 
                        ? 'ring-1 ring-white' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>

              <div className="flex-1">
                <div className="snake-border">
                  <motion.div 
                    ref={imageRef}
                    className="relative aspect-[3/4] bg-card rounded overflow-hidden cursor-zoom-in group"
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={() => setIsZooming(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setLightboxOpen(true)}
                    whileHover={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedImage}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ 
                          opacity: 1,
                          scale: isZooming ? 2 : 1,
                          x: isZooming ? (50 - mousePosition.x) * 4 : 0,
                          y: isZooming ? (50 - mousePosition.y) * 4 : 0,
                        }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full"
                      >
                        <img
                          src={images[selectedImage]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </motion.div>
                    </AnimatePresence>

                    {product.isNew && (
                      <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="absolute top-3 left-3"
                      >
                        <span className="bg-white text-black text-xs font-bold px-3 py-1.5 tracking-wider">
                          YENİ
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-14 aspect-[3/4] rounded overflow-hidden ${
                        index === selectedImage ? 'ring-1 ring-white' : 'opacity-50'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:sticky lg:top-24 lg:self-start space-y-5"
            >
              <div>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide mb-3" data-testid="text-product-name">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold" data-testid="text-price">
                    {price.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="space-y-4 pt-2">
                {uniqueSizes.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                      Beden: {selectedSize || 'Seçiniz'}
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {uniqueSizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className={`relative py-2.5 text-sm font-medium rounded overflow-hidden transition-colors ${
                            selectedSize === size
                              ? 'bg-white text-black'
                              : 'bg-white/5 border border-white/10 hover:border-white/30'
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors"
                      data-testid="button-decrease-quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="w-10 text-center font-medium text-sm" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors"
                      data-testid="button-increase-quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="relative flex-1 py-3.5 rounded font-bold text-sm tracking-wide uppercase overflow-hidden transition-all bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="button-add-to-cart"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isAdding ? 'Ekleniyor...' : 'Sepete Ekle'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-12 h-12 rounded flex items-center justify-center transition-colors ${
                    isLiked ? 'bg-red-600 text-white' : 'border border-border hover:bg-white/5'
                  }`}
                  data-testid="button-like"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>2000 TL üzeri ücretsiz kargo</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>14 gün ücretsiz iade</span>
                </div>
              </div>
            </motion.div>
          </div>

          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="font-display text-2xl tracking-wide mb-8">
                İLGİLİ ÜRÜNLER
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
