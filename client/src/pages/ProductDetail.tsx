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
  Check,
  Ruler,
  Share2,
  ChevronLeft,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useProduct, useProducts, useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCartModal } from '@/hooks/useCartModal';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';

const FREE_SHIPPING_THRESHOLD = 2500;

const colorMap: Record<string, string> = {
  'siyah': '#000000',
  'beyaz': '#FFFFFF',
  'gri': '#6B7280',
  'kırmızı': '#EF4444',
  'mavi': '#3B82F6',
  'lacivert': '#1E3A5F',
  'yeşil': '#22C55E',
  'sarı': '#EAB308',
  'turuncu': '#F97316',
  'mor': '#A855F7',
  'pembe': '#EC4899',
  'kahverengi': '#92400E',
  'bej': '#D4C4A8',
  'bordo': '#7C2D12',
  'antrasit': '#374151',
  'haki': '#6B8E23',
};

const getColorHex = (colorName: string): string => {
  const lowerColor = colorName.toLowerCase();
  for (const [key, value] of Object.entries(colorMap)) {
    if (lowerColor.includes(key)) {
      return value;
    }
  }
  return '#6B7280';
};

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { data: product, isLoading: productLoading } = useProduct(params.slug || '');
  const { data: allProducts = [] } = useProducts({});
  const { data: categories = [] } = useCategories();
  const { addToCart } = useCart();
  const { showModal } = useCartModal();
  const { toast } = useToast();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

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

  const category = product ? categories.find(c => c.id === product.categoryId) : null;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = product ? `${product.name} - HANK` : 'HANK';

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      color: 'hover:bg-green-500/20 hover:text-green-400',
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-white/20 hover:text-white',
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-blue-500/20 hover:text-blue-400',
    },
    {
      name: 'Instagram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
      url: `https://www.instagram.com/`,
      color: 'hover:bg-pink-500/20 hover:text-pink-400',
    },
  ];

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Bağlantı kopyalandı!' });
    setShowShareMenu(false);
  };

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
            {category && (
              <>
                <Link href={`/kategori/${category.slug}`} className="hover:text-white transition-colors">
                  {category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-foreground truncate max-w-[250px]">{product.name}</span>
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
                    <div className="relative">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                        className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                        data-testid="button-share"
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                      
                      <AnimatePresence>
                        {showShareMenu && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl p-2 min-w-[180px] shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-xs text-muted-foreground px-3 py-2 border-b border-white/10 mb-1">Paylaş</p>
                            {socialLinks.map((social) => (
                              <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${social.color}`}
                                onClick={() => setShowShareMenu(false)}
                              >
                                {social.icon}
                                <span className="text-sm">{social.name}</span>
                              </a>
                            ))}
                            <button
                              onClick={copyLink}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full hover:bg-white/10 transition-colors"
                            >
                              <Copy className="w-5 h-5" />
                              <span className="text-sm">Bağlantıyı Kopyala</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
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
              <div className="space-y-8">
                <div>
                  {product.sku && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4" data-testid="text-sku">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">SKU</span>
                      <span className="text-xs font-mono text-white">{product.sku}</span>
                    </div>
                  )}
                  
                  <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide leading-tight mb-6" data-testid="text-product-name">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-4xl sm:text-5xl font-bold tracking-tight" data-testid="text-price">
                      {price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </span>
                    {price >= FREE_SHIPPING_THRESHOLD && (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <Truck className="w-4 h-4" />
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
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Renk:
                      </span>
                      <div className="flex items-center gap-3">
                        {uniqueColors.map((color) => {
                          const colorHex = getColorHex(color);
                          const isSelected = selectedColor === color || (!selectedColor && color === uniqueColors[0]);
                          const isLight = colorHex === '#FFFFFF' || colorHex === '#D4C4A8';
                          return (
                            <motion.button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative w-9 h-9 rounded-full transition-all shadow-lg ${
                                isSelected 
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' 
                                  : 'ring-1 ring-white/30 hover:ring-white/60'
                              }`}
                              style={{ backgroundColor: colorHex }}
                              title={color}
                              data-testid={`button-color-${color}`}
                            >
                              {isSelected && (
                                <Check className={`w-4 h-4 absolute inset-0 m-auto ${isLight ? 'text-black' : 'text-white'}`} />
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
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
                {category && (
                  <Link href={`/kategori/${category.slug}`}>
                    <motion.span 
                      whileHover={{ x: 4 }}
                      className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Tümünü Gör
                      <ChevronRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                )}
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
