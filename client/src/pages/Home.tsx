import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SEO } from '@/components/SEO';
import { ArrowRight, Truck, RotateCcw, Shield, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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

const marqueeText = 'HANK — GÜÇ — PERFORMANS — STİL — HANK — GÜÇ — PERFORMANS — STİL — ';

const features = [
  { icon: Truck, title: 'Ücretsiz Kargo', desc: '2.500₺ üzeri siparişlerde' },
  { icon: RotateCcw, title: 'Kolay İade', desc: '14 gün içinde ücretsiz' },
  { icon: Shield, title: 'Güvenli Ödeme', desc: 'SSL ile korunan ödeme' },
  { icon: Zap, title: 'Hızlı Teslimat', desc: '1 İş Günü içinde' },
];

function HeroProductSlider({ products }: { products: Array<{ id: string; name: string; slug: string; basePrice: string; images: string[] }> }) {
  const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, 12);
  const duplicated = [...shuffled, ...shuffled, ...shuffled, ...shuffled];

  return (
    <div className="overflow-hidden border-t border-black/8">
      <div className="flex animate-hero-slider gap-2 py-3">
        {duplicated.map((product, index) => (
          <Link key={`${product.id}-${index}`} href={`/urun/${product.slug}`}>
            <div className="relative w-20 h-28 sm:w-24 sm:h-32 lg:w-28 lg:h-36 overflow-hidden group cursor-pointer flex-shrink-0 bg-stone-100">
              <img
                src={product.images[0] || '/placeholder.jpg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const heroImages = [heroImage1, heroImage2];
  const heroRef = useRef<HTMLElement>(null);

  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 600], [0, -60]);

  const { data: apiCategories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts({});

  const categories = apiCategories.map(cat => ({
    ...cat,
    image: cat.image || defaultCategoryImages[cat.slug] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
  }));

  const featuredProducts = allProducts.slice(0, 8);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollPositionRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const scrollContainer = categoryScrollRef.current;
    if (!scrollContainer || categories.length === 0) return;
    const SCROLL_SPEED = 30;
    const MAX_DELTA = 50;

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
      if (!scrollEl) { stopAnimation(); return; }
      if (lastTimeRef.current === null) lastTimeRef.current = currentTime;
      const delta = Math.min(currentTime - lastTimeRef.current, MAX_DELTA);
      lastTimeRef.current = currentTime;
      if (!isPausedRef.current) {
        scrollPositionRef.current += (SCROLL_SPEED * delta) / 1000;
        const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
        if (scrollPositionRef.current >= maxScroll) scrollPositionRef.current = 0;
        scrollEl.scrollLeft = scrollPositionRef.current;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      stopAnimation();
      isRunningRef.current = true;
      lastTimeRef.current = null;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) startAnimation(); else stopAnimation();
    };
    if (mediaQuery.matches) startAnimation();
    mediaQuery.addEventListener('change', handleMediaChange);
    return () => { stopAnimation(); mediaQuery.removeEventListener('change', handleMediaChange); };
  }, [categories.length]);

  const handleCategoryPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && 'ontouchstart' in window) return;
    isPausedRef.current = true;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };
  const handleCategoryPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && 'ontouchstart' in window) return;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      if (categoryScrollRef.current) {
        scrollPositionRef.current = categoryScrollRef.current.scrollLeft;
        isPausedRef.current = false;
      }
    }, 3000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Ana Sayfa"
        description="Premium fitness ve bodybuilding giyim markası. Güç, performans ve stil bir arada. HANK ile antrenmanlarınızda fark yaratın."
        url="/"
      />
      <Header />

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="relative lg:flex lg:h-screen lg:min-h-[640px] overflow-hidden"
        data-testid="section-hero"
      >
        {/* Left — editorial text (desktop) */}
        <div className="hidden lg:flex lg:w-[42%] flex-col justify-between px-10 xl:px-16 py-10 bg-white z-10 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.3em] uppercase text-black/35 font-medium">HANK®</span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-black/35 font-medium">2025</span>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-display leading-[0.88] tracking-wide text-black" style={{ fontSize: 'clamp(5rem, 9vw, 10rem)' }}>
                GÜCÜNÜ<br />
                <span className="text-stroke-black">GÖSTER</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-6 text-sm text-black/45 leading-relaxed max-w-xs"
            >
              Premium fitness ve bodybuilding giyim koleksiyonu.
              Her harekette güç, her anda stil.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-10 flex items-center gap-5"
            >
              <Link href="/magaza" data-testid="button-hero-shop">
                <motion.span
                  whileHover={{ x: 4 }}
                  className="group inline-flex items-center gap-3 bg-black text-white text-[11px] tracking-[0.2em] uppercase font-semibold px-8 py-4 hover:bg-zinc-900 transition-colors"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </motion.span>
              </Link>
              <Link href="/magaza">
                <span className="text-[11px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors underline underline-offset-4 decoration-black/20">
                  Tüm Ürünler
                </span>
              </Link>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-px transition-all duration-500 ${activeSlide === index ? 'w-12 bg-black' : 'w-6 bg-black/25'}`}
                data-testid={`button-hero-dot-${index}`}
              />
            ))}
          </div>
        </div>

        {/* Right — image */}
        <div className="relative lg:flex-1 h-[65vw] max-h-[480px] lg:h-auto lg:max-h-none overflow-hidden">
          <motion.div className="absolute inset-0" style={{ y: imageY }}>
            {heroImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${activeSlide === index ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src={img}
                  alt={`HANK Hero ${index + 1}`}
                  className="w-full h-full object-cover object-top scale-105"
                  data-testid={`img-hero-${index}`}
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mobile hero text overlay */}
        <div className="lg:hidden absolute inset-0 flex flex-col justify-end p-6 pb-8">
          <div className="bg-white/90 backdrop-blur-sm p-5">
            <h1 className="font-display text-5xl leading-none tracking-wide text-black mb-4">
              GÜCÜNÜ<br />GÖSTER
            </h1>
            <Link href="/magaza" data-testid="button-shop-men">
              <span className="inline-flex items-center gap-2 bg-black text-white text-[10px] tracking-[0.2em] uppercase font-semibold px-6 py-3">
                Koleksiyonu Keşfet
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>

        {/* Product slider strip */}
        <div className="absolute bottom-0 left-0 right-0 lg:relative lg:w-full bg-white">
          {allProducts.length > 0 && (
            <div className="lg:hidden">
              <HeroProductSlider products={allProducts} />
            </div>
          )}
        </div>
      </section>

      {/* Desktop product slider below hero */}
      {allProducts.length > 0 && (
        <div className="hidden lg:block bg-white">
          <HeroProductSlider products={allProducts} />
        </div>
      )}

      {/* ─── MARQUEE ─── */}
      <div className="bg-black overflow-hidden py-3.5">
        <div className="flex animate-marquee-slow whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-[11px] tracking-[0.35em] uppercase text-white/70 mx-16 font-medium">
              {marqueeText}
            </span>
          ))}
        </div>
      </div>

      {/* ─── CATEGORIES ─── */}
      <section className="py-16 lg:py-24 px-5 lg:px-8" data-testid="section-categories">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-8 lg:mb-12"
          >
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-black/35 font-medium">01</span>
              <h2 className="font-display text-4xl lg:text-5xl tracking-wide text-black mt-1">KATEGORİLER</h2>
            </div>
            <Link href="/magaza" className="hidden lg:flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors">
              Tümünü Gör <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

          <div
            ref={categoryScrollRef}
            onPointerDown={handleCategoryPointerDown}
            onPointerUp={handleCategoryPointerUp}
            onPointerCancel={handleCategoryPointerUp}
            onPointerLeave={handleCategoryPointerUp}
            className="flex gap-3 lg:gap-4 overflow-x-auto pb-2 scrollbar-hide sm:snap-x sm:snap-mandatory touch-pan-x"
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="snap-start shrink-0"
              >
                <Link href={`/kategori/${category.slug}`} data-testid={`link-category-${category.id}`}>
                  <div className="group relative w-[190px] sm:w-[220px] lg:w-[260px] h-[270px] sm:h-[310px] lg:h-[360px] overflow-hidden cursor-pointer bg-stone-100">
                    <motion.img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
                      data-testid={`img-category-${category.id}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-display text-xl lg:text-2xl text-white tracking-wide leading-tight">
                        {category.name.toUpperCase()}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                        <span className="text-white/80 text-xs tracking-wider">Keşfet</span>
                        <ArrowRight className="w-3 h-3 text-white/80" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS ─── */}
      <section className="py-16 lg:py-24 px-5 lg:px-8 bg-stone-50" data-testid="section-products">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-end justify-between mb-8 lg:mb-14"
          >
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-black/35 font-medium">02</span>
              <h2 className="font-display text-4xl lg:text-5xl tracking-wide text-black mt-1">ÖZEL SEÇKİLER</h2>
            </div>
            <Link href="/magaza" className="group flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors">
              Tümünü Gör
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: (index % 4) * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-black/35 text-sm">Henüz ürün eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── BRAND PROMISE ─── */}
      <section className="border-t border-black/8" data-testid="section-features">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`px-7 py-10 lg:py-12 ${index > 0 ? 'border-l border-black/8' : ''} ${index === 2 ? 'border-t border-black/8 lg:border-t-0' : ''} ${index === 3 ? 'border-t border-black/8 lg:border-t-0' : ''}`}
                data-testid={`feature-${index}`}
              >
                <feature.icon className="w-5 h-5 text-black/40 mb-4" />
                <h3 className="text-sm font-semibold text-black tracking-wide mb-1.5">{feature.title}</h3>
                <p className="text-xs text-black/40">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
