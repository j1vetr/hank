import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { ShippingCountdown } from '@/components/ShippingCountdown';
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
  Copy,
  Star,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProduct, useProducts, useCategories } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useCartModal } from '@/hooks/useCartModal';
import { useToast } from '@/hooks/use-toast';
import { ProductCard } from '@/components/ProductCard';
import { useProductReviews, useProductRating, useUserReview, useCreateReview } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';

const FREE_SHIPPING_THRESHOLD = 2500;

function StarRating({ rating, size = 16, interactive = false, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (rating: number) => void }) {
  const [hover, setHover] = useState(0);
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            style={{ width: size, height: size }}
            className={`${
              star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { data: product, isLoading: productLoading } = useProduct(params.slug || '');
  const { data: allProducts = [] } = useProducts({});
  const { data: categories = [] } = useCategories();
  const { addToCart } = useCart();
  const { showModal } = useCartModal();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: reviews = [] } = useProductReviews(product?.id || '');
  const { data: ratingData } = useProductRating(product?.id || '');
  const { data: userReview } = useUserReview(product?.id || '');
  const createReviewMutation = useCreateReview();
  
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { toggleFavorite, isLoading: isFavoriteLoading } = useToggleFavorite();
  const isLiked = product ? favoriteIds.includes(product.id) : false;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');

  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    const sizes = product.availableSizes?.length > 0 ? product.availableSizes : [];
    
    if (sizes.length > 0 && !selectedSize) {
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    
    try {
      await createReviewMutation.mutateAsync({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle || undefined,
        content: reviewContent || undefined,
      });
      toast({ title: 'Başarılı', description: 'Değerlendirmeniz gönderildi.' });
      setReviewTitle('');
      setReviewContent('');
      setReviewRating(5);
    } catch (error: any) {
      toast({ title: 'Hata', description: error.message || 'Değerlendirme gönderilemedi.', variant: 'destructive' });
    }
  };

  const sizes = (product?.availableSizes && product.availableSizes.length > 0)
    ? product.availableSizes 
    : (product?.variants ? Array.from(new Set(product.variants.map(v => v.size).filter((s): s is string => Boolean(s)))) : []);

  const colors = (product?.availableColors && product.availableColors.length > 0)
    ? product.availableColors 
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
        <main className="pt-36 pb-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
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
        <main className="pt-36 pb-20 px-6">
          <div className="max-w-7xl mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-white/30" />
            </div>
            <h1 className="font-display text-3xl mb-4">Ürün Bulunamadı</h1>
            <p className="text-muted-foreground mb-8">Aradığınız ürün mevcut değil veya kaldırılmış olabilir.</p>
            <Link href="/">
              <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-medium">
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

  const categoryName = categories.find(c => c.id === product.categoryId)?.name || 'Ürünler';
  const categorySlug = categories.find(c => c.id === product.categoryId)?.slug || '';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title={product.name}
        description={product.description || `${product.name} - HANK premium fitness giyim`}
        image={images[0]}
        url={`/urun/${product.slug}`}
        type="product"
        product={{
          name: product.name,
          price: price,
          currency: 'TRY',
          availability: 'InStock',
          sku: product.sku || undefined,
          brand: 'HANK',
          category: categoryName,
          images: images
        }}
        breadcrumbs={[
          { name: 'Ana Sayfa', url: '/' },
          { name: categoryName, url: `/kategori/${categorySlug}` },
          { name: product.name, url: `/urun/${product.slug}` }
        ]}
      />
      <Header />

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors" onClick={() => setLightboxOpen(false)}>
              <X className="w-6 h-6" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1); }} className="absolute left-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <motion.img key={selectedImage} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 25 }} src={images[selectedImage]} alt={product.name} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1); }} className="absolute right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }} className={`w-2 h-2 rounded-full transition-all ${idx === selectedImage ? 'bg-white w-6' : 'bg-white/30'}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSizeGuide && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 rounded-2xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl">Beden Tablosu</h3>
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
                      { size: 'XXL', chest: '112-116', length: '78-80' },
                      { size: '2XL', chest: '116-120', length: '80-82' },
                      { size: '3XL', chest: '120-124', length: '82-84' },
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

      <main className="pt-36 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            {category && (
              <>
                <Link href={`/kategori/${category.slug}`} className="hover:text-white transition-colors">{category.name}</Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-foreground truncate max-w-[300px] uppercase">{product.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-3 sm:gap-4 w-full">
              <div className="hidden sm:flex flex-col gap-2 w-20 shrink-0">
                {images.length > 5 && selectedImage > 0 && (
                  <button
                    onClick={() => setSelectedImage(prev => Math.max(0, prev - 1))}
                    className="w-full h-8 flex items-center justify-center bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors"
                    data-testid="button-thumbnail-prev"
                  >
                    <ChevronLeft className="w-4 h-4 rotate-90" />
                  </button>
                )}
                <div className="flex flex-col gap-2">
                  {images.length <= 5 ? (
                    images.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                          index === selectedImage ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                        }`}
                        data-testid={`button-thumbnail-${index}`}
                      >
                        <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </motion.button>
                    ))
                  ) : (
                    images.slice(
                      Math.max(0, Math.min(selectedImage - 2, images.length - 5)),
                      Math.max(0, Math.min(selectedImage - 2, images.length - 5)) + 5
                    ).map((image, idx) => {
                      const actualIndex = Math.max(0, Math.min(selectedImage - 2, images.length - 5)) + idx;
                      return (
                        <motion.button
                          key={actualIndex}
                          onClick={() => setSelectedImage(actualIndex)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative aspect-[3/4] rounded-lg overflow-hidden transition-all flex-shrink-0 ${
                            actualIndex === selectedImage ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-100'
                          }`}
                          data-testid={`button-thumbnail-${actualIndex}`}
                        >
                          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </motion.button>
                      );
                    })
                  )}
                </div>
                {images.length > 5 && selectedImage < images.length - 1 && (
                  <button
                    onClick={() => setSelectedImage(prev => Math.min(images.length - 1, prev + 1))}
                    className="w-full h-8 flex items-center justify-center bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors"
                    data-testid="button-thumbnail-next"
                  >
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </button>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute -inset-[1px] rounded-xl pointer-events-none overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 133" preserveAspectRatio="none">
                      <rect
                        x="0.5"
                        y="0.5"
                        width="99"
                        height="132"
                        rx="6"
                        fill="none"
                        stroke="url(#borderGradient)"
                        strokeWidth="1"
                        className="animate-border-dash"
                      />
                      <defs>
                        <linearGradient id="borderGradient" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="transparent" />
                          <stop offset="45%" stopColor="transparent" />
                          <stop offset="50%" stopColor="white" />
                          <stop offset="55%" stopColor="transparent" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <motion.div 
                    ref={imageRef}
                    className="relative aspect-[3/4] bg-zinc-900 rounded-xl overflow-hidden cursor-zoom-in group w-full"
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={() => setIsZooming(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setLightboxOpen(true)}
                  >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: 1,
                        scale: isZooming ? 2 : 1,
                        x: isZooming ? (50 - mousePosition.x) * 4 : 0,
                        y: isZooming ? (50 - mousePosition.y) * 4 : 0,
                      }}
                      exit={{ opacity: 0 }}
                      className="w-full h-full"
                    >
                      <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" draggable={false} />
                    </motion.div>
                  </AnimatePresence>

                  {product.isNew && (
                    <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded">%YENİ</span>
                  )}
                  </motion.div>
                </div>

                <div className="sm:hidden mt-4">
                  {images.length <= 5 ? (
                    <div className="flex gap-2 justify-center">
                      {images.map((image, index) => (
                        <button 
                          key={index} 
                          onClick={() => setSelectedImage(index)} 
                          className={`shrink-0 w-14 aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                            index === selectedImage ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : 'opacity-50'
                          }`}
                        >
                          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="flex gap-2 justify-center">
                        {images.slice(
                          Math.max(0, Math.min(selectedImage - 2, images.length - 5)),
                          Math.max(0, Math.min(selectedImage - 2, images.length - 5)) + 5
                        ).map((image, idx) => {
                          const actualIndex = Math.max(0, Math.min(selectedImage - 2, images.length - 5)) + idx;
                          return (
                            <button 
                              key={actualIndex} 
                              onClick={() => setSelectedImage(actualIndex)} 
                              className={`shrink-0 w-14 aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                                actualIndex === selectedImage ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : 'opacity-50'
                              }`}
                            >
                              <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-center gap-1 mt-3">
                        {images.map((_, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === selectedImage ? 'bg-white w-4' : 'bg-white/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="lg:pt-4">
              {category && (
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{category.name}</p>
              )}
              
              <h1 className="font-display text-xl sm:text-2xl tracking-wide uppercase mb-4" data-testid="text-product-name">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-xl font-semibold" data-testid="text-price">
                  {price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              <div className="space-y-6">
                {colors.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Renk:</span>
                    <div className="flex items-center gap-2">
                      {colors.map((color) => {
                        const isSelected = selectedColor === color.name || (!selectedColor && color.name === colors[0].name);
                        const isLight = color.hex === '#FFFFFF' || color.hex === '#D4C4A8';
                        return (
                          <motion.button
                            key={color.name}
                            onClick={() => setSelectedColor(color.name)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative w-8 h-8 rounded-full transition-all ${
                              isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : 'ring-1 ring-white/30'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                            data-testid={`button-color-${color.name}`}
                          >
                            {isSelected && (
                              <Check className={`w-4 h-4 absolute inset-0 m-auto ${isLight ? 'text-black' : 'text-white'}`} />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Beden: <span className="text-white">{selectedSize || ''}</span>
                      </span>
                      <button onClick={() => setShowSizeGuide(true)} className="text-xs text-white/60 hover:text-white underline transition-colors">
                        Beden Tablosu
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((size) => {
                        const variant = product.variants?.find(v => v.size === size);
                        const isOutOfStock = variant ? (variant.stock || 0) <= 0 : false;
                        return (
                          <motion.button
                            key={size}
                            onClick={() => !isOutOfStock && setSelectedSize(size)}
                            whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
                            whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                            disabled={isOutOfStock}
                            className={`relative min-w-[56px] py-2.5 px-4 text-sm font-medium border transition-all ${
                              isOutOfStock
                                ? 'bg-transparent border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                : selectedSize === size
                                  ? 'bg-white text-black border-white'
                                  : 'bg-transparent border-zinc-700 text-white hover:border-zinc-500'
                            }`}
                            data-testid={`button-size-${size}`}
                          >
                            <span className={isOutOfStock ? 'line-through' : ''}>{size}</span>
                            {isOutOfStock && (
                              <span className="absolute -top-2 -right-2 text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                                Tükendi
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-zinc-700">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors" data-testid="button-decrease-quantity">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium text-sm" data-testid="text-quantity">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors" data-testid="button-increase-quantity">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {product.sku && (
                    <span className="text-xs text-muted-foreground" data-testid="text-sku">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-sm uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    data-testid="button-add-to-cart"
                  >
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isAdding ? 'Ekleniyor...' : 'Sepete Ekle'}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => product && !isFavoriteLoading && toggleFavorite(product.id, isLiked)}
                    disabled={isFavoriteLoading}
                    className={`w-12 h-12 border flex items-center justify-center transition-colors ${
                      isLiked ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-700 hover:border-zinc-500'
                    } ${isFavoriteLoading ? 'opacity-50' : ''}`}
                    data-testid="button-like"
                  >
                    {isFavoriteLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    )}
                  </motion.button>

                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-12 h-12 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center transition-colors"
                      data-testid="button-share"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                    
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-zinc-700 rounded-lg p-2 min-w-[160px] shadow-xl"
                        >
                          {socialLinks.map((social) => (
                            <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${social.color}`} onClick={() => setShowShareMenu(false)}>
                              {social.icon}
                              <span className="text-sm">{social.name}</span>
                            </a>
                          ))}
                          <button onClick={copyLink} className="flex items-center gap-3 px-3 py-2 rounded w-full hover:bg-white/10 transition-colors">
                            <Copy className="w-5 h-5" />
                            <span className="text-sm">Kopyala</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Same Day Shipping Notice */}
                <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                  <ShippingCountdown />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-zinc-800">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-800/50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium">Ücretsiz Kargo</p>
                  <p className="text-[10px] text-muted-foreground">2500₺ Üzeri</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-800/50 flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium">Kolay İade</p>
                  <p className="text-[10px] text-muted-foreground">14 gün</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-zinc-800/50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-xs font-medium">Güvenli Ödeme</p>
                  <p className="text-[10px] text-muted-foreground">SSL korumalı</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.section 
            initial={{ opacity: 0, y: 40 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6 }} 
            className="mt-16"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-xl tracking-wide uppercase">Değerlendirmeler</h2>
              {ratingData && ratingData.count > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(ratingData.average)} size={18} />
                  <span className="text-sm text-muted-foreground">
                    {ratingData.average.toFixed(1)} ({ratingData.count} değerlendirme)
                  </span>
                </div>
              )}
            </div>

            {user && !userReview && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
                <h3 className="font-semibold mb-4">Değerlendirme Yaz</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Puanınız</label>
                    <StarRating rating={reviewRating} size={28} interactive onChange={setReviewRating} />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Başlık (isteğe bağlı)"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors"
                      data-testid="input-review-title"
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Yorumunuz (isteğe bağlı)"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-white transition-colors resize-none"
                      data-testid="input-review-content"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                    data-testid="button-submit-review"
                  >
                    {createReviewMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Gönder
                  </button>
                </form>
              </div>
            )}

            {!user && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 text-center">
                <p className="text-white font-medium mb-4">Değerlendirme Yazmak için Giriş Yapın !</p>
                <Link href="/giris">
                  <button className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                    Giriş Yap
                  </button>
                </Link>
              </div>
            )}

            {userReview && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={userReview.rating} size={16} />
                  <span className="text-sm text-green-400">Değerlendirmeniz</span>
                </div>
                {userReview.title && <h4 className="font-semibold">{userReview.title}</h4>}
                {userReview.content && <p className="text-muted-foreground mt-1">{userReview.content}</p>}
              </div>
            )}

            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.filter(r => r.id !== userReview?.id).map((review) => {
                  const maskName = (name: string | null | undefined) => {
                    if (!name) return '***';
                    return name.slice(0, 2) + '***';
                  };
                  return (
                    <div key={review.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                            {review.user.firstName?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-white">
                              {maskName(review.user.firstName)} {maskName(review.user.lastName)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StarRating rating={review.rating} size={12} />
                              <span className="text-xs text-zinc-500">
                                {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {review.title && <h4 className="font-semibold text-sm text-white">{review.title}</h4>}
                      {review.content && <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{review.content}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              !userReview && (
                <div className="text-center py-10 text-muted-foreground">
                  <Star className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                  <p>Henüz değerlendirme yok. İlk değerlendirmeyi siz yapın!</p>
                </div>
              )
            )}
          </motion.section>

          {moreProducts.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mt-20">
              <h2 className="font-display text-xl tracking-wide uppercase mb-8">Beğenebileceğiniz Ürünler</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
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
