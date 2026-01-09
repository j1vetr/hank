import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { SEO } from '@/components/SEO';
import { ArrowRight, ChevronRight, Truck, RotateCcw, Shield, Zap, Instagram } from 'lucide-react';
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

const marqueeText = 'HANK • GÜÇ • PERFORMANS • STİL • HANK • GÜÇ • PERFORMANS • STİL • ';

const features = [
  { icon: Truck, title: 'Ücretsiz Kargo', desc: '2.500₺ üzeri siparişlerde' },
  { icon: RotateCcw, title: 'Kolay İade', desc: '14 gün içinde ücretsiz' },
  { icon: Shield, title: 'Güvenli Ödeme', desc: 'SSL ile korunan ödeme' },
  { icon: Zap, title: 'Hızlı Teslimat', desc: '2-4 iş günü içinde' },
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
  const [isScrollPaused, setIsScrollPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const categoriesInView = useInView(categoriesRef, { once: true, amount: 0.2 });
  const productsInView = useInView(productsRef, { once: true, amount: 0.1 });

  // Auto-scroll categories on mobile
  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer || categories.length === 0) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels per frame - slow speed

    const animate = () => {
      if (!isScrollPaused && scrollContainer) {
        scrollPosition += scrollSpeed;
        
        // Reset to beginning when reaching the end
        if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    // Only auto-scroll on mobile
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    if (mediaQuery.matches) {
      animationId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      if (mediaQuery.matches) {
        animationId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationId);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [categories.length, isScrollPaused]);

  const handleCategoryTouchStart = () => {
    setIsScrollPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  };

  const handleCategoryTouchEnd = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    // Resume after 3 seconds
    pauseTimeoutRef.current = setTimeout(() => {
      if (categoryScrollRef.current) {
        // Sync scroll position before resuming
        setIsScrollPaused(false);
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

        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 flex gap-3">
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

        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center px-6 w-full">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-6xl sm:text-7xl lg:text-[140px] xl:text-[180px] text-white tracking-wider mb-8 sm:mb-12 leading-none text-center"
            >
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block mb-1 sm:mb-2 lg:mb-4"
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
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0"
            >
              <Link href="/kategori/tshirt" className="w-full sm:w-auto">
                <button
                  data-testid="button-shop-men"
                  className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-semibold tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-white/90 transition-all hover:gap-4 text-sm sm:text-base"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/kategori/esofman" className="w-full sm:w-auto">
                <button
                  data-testid="button-shop-all"
                  className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold tracking-wide uppercase hover:bg-white hover:text-black transition-all text-sm sm:text-base"
                >
                  Tüm Ürünler
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden py-5 bg-black/60 backdrop-blur-sm border-t border-white/10">
          <div className="marquee-container">
            <div className="animate-marquee-right flex whitespace-nowrap">
              <span className="font-display text-2xl text-white/50 tracking-[0.3em] px-4">
                {marqueeText}{marqueeText}{marqueeText}{marqueeText}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section ref={categoriesRef} className="py-6 lg:py-10 px-4 lg:px-6" data-testid="section-categories">
        <div className="max-w-[1400px] mx-auto">
          <div 
            ref={categoryScrollRef}
            onTouchStart={handleCategoryTouchStart}
            onTouchEnd={handleCategoryTouchEnd}
            onMouseDown={handleCategoryTouchStart}
            onMouseUp={handleCategoryTouchEnd}
            onMouseLeave={handleCategoryTouchEnd}
            className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 scrollbar-hide sm:snap-x sm:snap-mandatory"
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
                  <div className="group relative w-[160px] sm:w-[200px] lg:w-[260px] h-[220px] sm:h-[280px] lg:h-[340px] overflow-hidden rounded-xl cursor-pointer">
                    <motion.img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.5 }}
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

      <section ref={productsRef} className="py-24 lg:py-32 px-6 relative" data-testid="section-products">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-background to-zinc-900/50" />
        <div className="absolute inset-0 noise-overlay opacity-30" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={productsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12 lg:mb-16"
          >
            <div>
              <span className="inline-block text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
                En Çok Tercih Edilenler
              </span>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wide">
                POPÜLER ÜRÜNLER
              </h2>
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
                initial={{ opacity: 0, y: 40 }}
                animate={productsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.08 }}
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group text-center p-6 lg:p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all"
                data-testid={`feature-${index}`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white/80" />
                </div>
                <h3 className="font-display text-lg lg:text-xl tracking-wide mb-2">
                  {feature.title.toUpperCase()}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative bg-black border-t border-white/10 py-16 lg:py-20 px-6" data-testid="section-footer">
        <div className="absolute inset-0 noise-overlay opacity-30" />
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-16">
            <div className="col-span-2 lg:col-span-1">
              <img
                src="/uploads/branding/hank-logo.svg"
                alt="HANK"
                className="h-10 invert mb-6"
                loading="lazy"
              />
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                Premium fitness ve bodybuilding giyim markası. 
                Güç, performans ve stil bir arada.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <a 
                  href="https://www.instagram.com/hankathletics" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center hover:from-pink-500/40 hover:to-purple-500/40 transition-colors"
                  data-testid="link-footer-instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
              <div className="text-xs text-white/40 space-y-1">
                <p>ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27</p>
                <p>İZMİR / GAZİEMİR</p>
                <p className="mt-2">
                  <a href="tel:+905321350391" className="hover:text-white transition-colors">0532 135 03 91</a>
                </p>
                <p>
                  <a href="mailto:info@hank.com.tr" className="hover:text-white transition-colors">info@hank.com.tr</a>
                </p>
              </div>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wider mb-6">ALIŞVERİŞ</h4>
              <ul className="space-y-4 text-sm text-white/50">
                {categories.slice(0, 4).map(cat => (
                  <li key={cat.id}>
                    <Link href={`/kategori/${cat.slug}`} className="hover:text-white transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wider mb-6">DESTEK</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="/teslimat-kosullari" className="hover:text-white transition-colors">Teslimat Koşulları</Link></li>
                <li><Link href="/iptal-ve-iade" className="hover:text-white transition-colors">İptal ve İade Politikası</Link></li>
                <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wider mb-6">KURUMSAL</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2025 HANK. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span>Geliştirici & Tasarım:</span>
              <a 
                href="https://toov.com.tr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white transition-colors"
                data-testid="link-toov-developer"
              >
                <img 
                  src="https://toov.com.tr/assets/toov_logo-DODYNPrj.png" 
                  alt="TOOV" 
                  className="h-5"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
