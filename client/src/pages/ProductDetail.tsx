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
  Loader2,
  Shield,
  Package,
  Star,
  Check,
  Ruler,
  Share2,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCartModal } from '@/hooks/useCartModal';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';

const FREE_SHIPPING_THRESHOLD = 2500;

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
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
      toast({ title: 'Uyarı', description: 'Lütfen bir beden seçiniz.', variant: 'destructive' });
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
      toast({ title: 'Hata', description: 'Sepete eklenemedi.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const uniqueSizes = product?.variants
    ? Array.from(new Set(product.variants.map(v => v.size).filter((s): s is string => Boolean(s))))
    : [];

  const uniqueColors = product?.variants
    ? Array.from(new Set(product.variants.map(v => v.color).filter((c): c is string => Boolean(c))))
    : [];

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-10 h-10 text-white/50" />
            </motion.div>
            <p className="mt-4 text-sm text-muted-foreground">Ürün yükleniyor...</p>
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
          <div className="max-w-7xl mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-white/30" />
            </div>
            <h1 className="font-display text-3xl mb-4">Ürün Bulunamadı</h1>
            <p className="text-muted-foreground mb-8">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
            <Link href="/">
              <motion.span 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium"
              >
                Ana Sayfaya Dön
              </motion.span>
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
  const relatedProducts = allProducts
    .filter(p => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);
  const moreProducts = relatedProducts.length < 4 
    ? [...relatedProducts, ...allProducts.filter(p => p.id !== product.id && p.categoryId !== product.categoryId).slice(0, 4 - relatedProducts.length)]
    : relatedProducts;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Bağlantı kopyalandı!' });
    }
  };

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
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1); }}
              className="absolute left-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <motion.img
              key={selectedImage}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              src={images[selectedImage]}
              alt={product.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1); }}
              className="absolute right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === selectedImage ? 'bg-white w-6' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl">Beden Rehberi</h3>
                <button onClick={() => setShowSizeGuide(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Beden</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Göğüs (cm)</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Boy (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { size: 'S', chest: '96-100', length: '70-72' },
                      { size: 'M', chest: '100-104', length: '72-74' },
                      { size: 'L', chest: '104-108', length: '74-76' },
                      { size: 'XL', chest: '108-112', length: '76-78' },
                    ].map((row) => (
                      <tr key={row.size} className="border-b border-white/5">
                        <td className="py-3 px-4 font-medium">{row.size}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{row.chest}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{row.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-8"
          >
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/kategori/${product.categoryId}`} className="hover:text-white transition-colors">Ürünler</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="relative">
                <motion.div 
                  ref={imageRef}
                  className="relative aspect-[4/5] bg-zinc-900 rounded-2xl overflow-hidden cursor-zoom-in group"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  onClick={() => setLightboxOpen(true)}
                  whileHover={{ boxShadow: '0 30px 60px -15px rgba(0,0,0,0.5)' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        scale: isZooming ? 2.5 : 1,
                        x: isZooming ? (50 - mousePosition.x) * 5 : 0,
                        y: isZooming ? (50 - mousePosition.y) * 5 : 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ opacity: { duration: 0.2 } }}
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

                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.isNew && (
                      <motion.span 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white text-black text-[10px] font-bold px-3 py-1.5 tracking-widest uppercase"
                      >
                        Yeni
                      </motion.span>
                    )}
                    {product.isFeatured && (
                      <motion.span 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-bold px-3 py-1.5 tracking-widest uppercase"
                      >
                        Öne Çıkan
                      </motion.span>
                    )}
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); handleShare(); }}
                      className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isLiked ? 'bg-red-600' : 'bg-black/50 backdrop-blur-sm hover:bg-black/70'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </motion.button>
                  </div>

                  {!isZooming && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full">
                        Yakınlaştırmak için tıklayın
                      </span>
                    </div>
                  )}
                </motion.div>

                <div className="absolute -left-2 lg:-left-20 top-4 flex flex-col gap-2">
                  {images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      whileHover={{ scale: 1.05, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-14 lg:w-16 aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                        index === selectedImage 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-background' 
                          : 'opacity-50 hover:opacity-100'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:sticky lg:top-32 lg:self-start"
            >
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">(128 değerlendirme)</span>
                  </div>
                  
                  <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-4" data-testid="text-product-name">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl sm:text-4xl font-bold" data-testid="text-price">
                      {price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                    {price >= FREE_SHIPPING_THRESHOLD && (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        Ücretsiz Kargo
                      </span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                )}

                {uniqueColors.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
                      Renk: <span className="text-white">{uniqueColors[0]}</span>
                    </span>
                    <div className="flex gap-2">
                      {uniqueColors.map((color) => (
                        <div
                          key={color}
                          className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-sm"
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uniqueSizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Beden: <span className="text-white">{selectedSize || 'Seçiniz'}</span>
                      </span>
                      <button 
                        onClick={() => setShowSizeGuide(true)}
                        className="text-xs text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                        Beden Rehberi
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {uniqueSizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative py-3 text-sm font-semibold rounded-lg overflow-hidden transition-all ${
                            selectedSize === size
                              ? 'bg-white text-black shadow-lg shadow-white/20'
                              : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {size}
                          {selectedSize === size && (
                            <motion.div
                              layoutId="sizeIndicator"
                              className="absolute inset-0 bg-white -z-10"
                            />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors"
                      data-testid="button-decrease-quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <span className="w-12 text-center font-semibold" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors"
                      data-testid="button-increase-quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex-1 py-4 rounded-lg font-bold text-sm tracking-wide uppercase overflow-hidden transition-all bg-white text-black hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="button-add-to-cart"
                  >
                    {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isAdding ? 'Ekleniyor...' : 'Sepete Ekle'}
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ücretsiz Kargo</p>
                      <p className="text-xs text-muted-foreground">2.500₺ ve üzeri</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Kolay İade</p>
                      <p className="text-xs text-muted-foreground">14 gün içinde</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Güvenli Ödeme</p>
                      <p className="text-xs text-muted-foreground">SSL korumalı</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Hızlı Teslimat</p>
                      <p className="text-xs text-muted-foreground">2-4 iş günü</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Stokta mevcut
                    </span>
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      Orijinal ürün
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {moreProducts.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-24"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-display text-2xl sm:text-3xl tracking-wide">
                  Beğenebileceğiniz Ürünler
                </h2>
                <Link href="/kategori/tshirt">
                  <motion.span 
                    whileHover={{ x: 4 }}
                    className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                {moreProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>
    </div>
  );
}
