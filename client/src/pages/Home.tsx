import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SEO } from '@/components/SEO';
import { ValentineHearts } from '@/components/ValentineTheme';
import { ArrowRight, ChevronRight, Truck, RotateCcw, Shield, Zap, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import heroImage1 from '@assets/hero-1.webp';
import heroImage2 from '@assets/hero-2.webp';
import categoryTshirt from '@assets/category-tshirt.webp';
import categorySort from '@assets/category-sort.webp';
import categoryAtlet from '@assets/category-atlet.webp';
import categorySalvar from '@assets/category-salvar.webp';
import categoryEsofman from '@assets/category-esofman.webp';
import { useProducts, useCategories } from '@/hooks/useProducts';

const defaultCategoryImages: Record<string, string> = {
  'esofman': categoryEsofman,
  'salvar-pantolon': categorySalvar,
  'sifir-kol-atlet': categoryAtlet,
  'sort': categorySort,
  'tshirt': categoryTshirt,
};

const marqueeText = 'HANK • GÜÇ • PERFORMANS • STİL • 💕 SEVGİLİLER GÜNÜ • HANK • GÜÇ • PERFORMANS • STİL • 💕 SEVGİLİLER GÜNÜ • ';

function HeroProductSlider({ products }: { products: Array<{ id: string; name: string; slug: string; basePrice: string; images: string[] }> }) {
  const shuffledProducts = [...products].sort(() => Math.random() - 0.5).slice(0, 12);
  const duplicatedProducts = [...shuffledProducts, ...shuffledProducts, ...shuffledProducts, ...shuffledProducts];
  
  return (
    <div className="overflow-hidden">
      <div className="flex animate-hero-slider gap-3 lg:gap-4">
        {duplicatedProducts.map((product, index) => (
          <Link key={`${product.id}-${index}`} href={`/urun/${product.slug}`}>
            <div className="relative w-24 h-32 sm:w-28 sm:h-36 lg:w-32 lg:h-44 rounded-lg overflow-hidden group cursor-pointer flex-shrink-0 border border-white/20 hover:border-white/40 transition-colors">
              <img
                src={product.images[0] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-[9px] sm:text-[10px] lg:text-xs font-medium truncate">{product.name}</p>
                <p className="text-pink-400 text-[9px] sm:text-[10px] lg:text-xs font-bold">₺{parseFloat(product.basePrice).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const features = [
  { icon: Truck, title: 'Ücretsiz Kargo', desc: '2.500₺ üzeri siparişlerde' },
  { icon: RotateCcw, title: 'Kolay İade', desc: '14 gün içinde ücretsiz' },
  { icon: Shield, title: 'Güvenli Ödeme', desc: 'SSL ile korunan ödeme' },
  { icon: Zap, title: 'Hızlı Teslimat', desc: '1 İş Günü içinde' },
];

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const heroImages = [heroImage1, heroImage2];

  const { data: apiCategories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts({});

  const categories = apiCategories.map(cat => ({
    ...cat,
    image: cat.image || defaultCategoryImages[cat.slug] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
  }));

  const featuredProducts = allProducts.slice(0, 8);

  const categoriesRef = useRef(null);
  const productsRef = useRef(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isRunningRef = useRef(false);
  
  const categoriesInView = useInView(categoriesRef, { once: true, amount: 0.2 });
  const productsInView = useInView(productsRef, { once: true, amount: 0.1 });

  // Auto-scroll categories on mobile with delta-time based speed
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer || categories.length === 0) return;

    const SCROLL_SPEED = 30; // pixels per second (consistent across all devices)
    const MAX_DELTA = 50; // clamp delta to prevent jumps (in ms)

    const stopAnimation = () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      isRunningRef.current = false;
      lastTimeRef.current = null;
    };

    const animate = (currentTime: number) => {
      if (!isRunningRef.current) return;
      
      const scrollEl = categoryScrollRef.current;
      if (!scrollEl) {
        stopAnimation();
        return;
      }

      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
      }

      const rawDelta = currentTime - lastTimeRef.current;
      const delta = Math.min(rawDelta, MAX_DELTA); // Clamp delta to prevent speed spikes
      lastTimeRef.current = currentTime;

      if (!isPausedRef.current) {
        const movement = (SCROLL_SPEED * delta) / 1000; // Convert to pixels
        scrollPositionRef.current += movement;
        
        const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
        if (scrollPositionRef.current >= maxScroll) {
          scrollPositionRef.current = 0;
        }
        
        scrollEl.scrollLeft = scrollPositionRef.current;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      // Guard: Stop any existing animation before starting
      stopAnimation();
      isRunningRef.current = true;
      lastTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Only auto-scroll on mobile
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    // Initial check
    if (mediaQuery.matches) {
      startAnimation();
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      stopAnimation();
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [categories.length]);

  // Pointer event handlers to prevent double-trigger on iOS
  const handleCategoryPointerDown = (e: React.PointerEvent) => {
    // Prevent handling the same interaction twice
    if (e.pointerType === 'mouse' && 'ontouchstart' in window) return;
    
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  const handleCategoryPointerUp = (e: React.PointerEvent) => {
    // Prevent handling the same interaction twice
    if (e.pointerType === 'mouse' && 'ontouchstart' in window) return;
    
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    // Resume after 3 seconds
    pauseTimeoutRef.current = setTimeout(() => {
      if (categoryScrollRef.current) {
        // Sync scroll position before resuming
        scrollPositionRef.current = categoryScrollRef.current.scrollLeft;
        isPausedRef.current = false;
      }
    }, 3000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Ana Sayfa"
        description="Premium fitness ve bodybuilding giyim markası. Güç, performans ve stil bir arada. HANK ile antrenmanlarınızda fark yaratın."
        url="/"
      />
      <Header />
      <ValentineHearts />

      <section className="relative h-screen overflow-hidden noise-overlay" data-testid="section-hero">
        {heroImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              activeSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt={`HANK Hero ${index + 1}`}
              className="w-full h-full object-cover object-top scale-105"
              data-testid={`img-hero-${index}`}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
          </div>
        ))}

        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex justify-between px-6 pointer-events-none">
          <button
            onClick={() => setActiveSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
            className="w-12 h-12 border border-white/30 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all pointer-events-auto"
            data-testid="button-hero-prev"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % heroImages.length)}
            className="w-12 h-12 border border-white/30 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white hover:text-black transition-all pointer-events-auto"
            data-testid="button-hero-next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-[180px] sm:bottom-[200px] lg:bottom-[240px] left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`h-1 transition-all duration-500 ${
                activeSlide === index ? 'w-12 bg-white' : 'w-6 bg-white/40'
              }`}
              data-testid={`button-hero-dot-${index}`}
            />
          ))}
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center">
          <div className="text-center px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5 sm:mb-6"
            >
              <Link href="/magaza">
                <div className="relative inline-flex flex-col items-center gap-1 bg-gradient-to-r from-pink-600/90 to-rose-600/90 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:from-pink-500/90 hover:to-rose-500/90 transition-all cursor-pointer overflow-hidden group">
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'borderShine 2.5s linear infinite',
                    mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    maskComposite: 'exclude',
                    WebkitMaskComposite: 'xor',
                    padding: '2px',
                    borderRadius: '9999px',
                  }} />
                  <span className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wide">
                    <Heart className="w-4 h-4 fill-white" />
                    14 Şubat'a Özel %30'a Varan İndirim
                    <Heart className="w-4 h-4 fill-white" />
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-pink-100/90 tracking-wide">
                    Fırsatını Kaçırma!
                  </span>
                </div>
              </Link>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-5xl sm:text-6xl lg:text-[100px] xl:text-[120px] text-white tracking-wider mb-6 sm:mb-8 leading-none text-center"
            >
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block mb-1 sm:mb-2"
              >
                GÜCÜNÜ
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="block text-stroke-white"
              >
                GÖSTER
              </motion.span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0 mb-8 lg:mb-12"
            >
              <Link href="/magaza" className="w-full sm:w-auto">
                <button
                  data-testid="button-shop-men"
                  className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-semibold tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-white/90 transition-all hover:gap-4 text-sm"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/magaza" className="w-full sm:w-auto">
                <button
                  data-testid="button-shop-all"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold tracking-wide uppercase hover:bg-white hover:text-black transition-all text-sm"
                >
                  Tüm Ürünler
                </button>
              </Link>
            </motion.div>
          </div>

          </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          {allProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="pb-6 lg:pb-8"
            >
              <HeroProductSlider products={allProducts} />
            </motion.div>
          )}
        </div>
      </section>

      <section ref={categoriesRef} className="py-6 lg:py-10 px-4 lg:px-6" data-testid="section-categories">
        <div className="max-w-[1400px] mx-auto">
          <div 
            ref={categoryScrollRef}
            onPointerDown={handleCategoryPointerDown}
            onPointerUp={handleCategoryPointerUp}
            onPointerCancel={handleCategoryPointerUp}
            onPointerLeave={handleCategoryPointerUp}
            className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 scrollbar-hide sm:snap-x sm:snap-mandatory touch-pan-x"
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: 30 }}
                animate={categoriesInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="snap-start shrink-0"
              >
                <Link
                  href={`/kategori/${category.slug}`}
                  data-testid={`link-category-${category.id}`}
                >
                  <div className="group relative w-[200px] sm:w-[220px] lg:w-[260px] h-[280px] sm:h-[300px] lg:h-[340px] overflow-hidden rounded-xl cursor-pointer">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      data-testid={`img-category-${category.id}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 group-hover:from-black/95 transition-all" />
                    
                    <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6">
                      <h3 className="font-display text-lg sm:text-xl lg:text-2xl text-white tracking-wide leading-tight mb-2">
                        {category.name.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span className="text-white/80 text-xs lg:text-sm">Keşfet</span>
                        <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 group-hover:ring-white/30 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-6 relative overflow-hidden" data-testid="section-valentine">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-950/40 via-pink-950/30 to-background" />
        <div className="absolute inset-0 noise-overlay opacity-20" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
              </motion.div>
              <span className="text-sm tracking-[0.3em] uppercase text-pink-400/80 font-medium">14 Şubat Özel</span>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}>
                <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
              </motion.div>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-wide mb-3">
              SEVGİLİLER GÜNÜ
            </h2>
            <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">
              Sevdiğinize özel hediyeler keşfedin. Sınırlı süre indirimlerle.
            </p>
          </motion.div>

          <div className="flex justify-center">
            <Link href="/magaza">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-8 py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold tracking-wide uppercase rounded-full flex items-center gap-3 hover:from-pink-500 hover:to-rose-500 transition-all shadow-lg shadow-pink-900/30"
                data-testid="button-valentine-shop"
              >
                <Heart className="w-4 h-4 fill-white" />
                Hediyeleri Keşfet
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      <section ref={productsRef} className="py-24 lg:py-32 px-6 relative" data-testid="section-products">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-background to-zinc-900/50" />
        <div className="absolute inset-0 noise-overlay opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12 lg:mb-16"
          >
            <div>
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-block text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4"
              >
                En Çok Tercih Edilenler
              </motion.span>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide"
              >
                POPÜLER ÜRÜNLER
              </motion.h2>
            </div>
            <Link href="/kategori/tshirt" className="group flex items-center gap-3 px-6 py-3 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all">
              <span className="text-sm font-medium tracking-wider uppercase">Tümünü Gör</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: (index % 4) * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
          
          {featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Henüz ürün eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 lg:py-24 px-6 relative overflow-hidden" data-testid="section-features">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-zinc-900/50" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="group text-center p-6 lg:p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                data-testid={`feature-${index}`}
              >
                <motion.div 
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform"
                  whileInView={{ rotate: [0, 10, -10, 0] }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  <feature.icon className="w-6 h-6 text-white/80" />
                </motion.div>
                <h3 className="font-display text-lg lg:text-xl tracking-wide mb-2">
                  {feature.title.toUpperCase()}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
