import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { SEO } from '@/components/SEO';
import { ArrowRight, Truck, RotateCcw, Shield, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
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

const heroSlides = [
  { img: heroImage1, label: '01 / 02' },
  { img: heroImage2, label: '02 / 02' },
];

const tickerWords = Array(12).fill(null).map(() =>
  ['HANK', 'GÜÇ', 'PERFORMANS', 'STİL', 'PREMIUM', 'FİTNESS']
).flat();

const stats = [
  { num: '1000+', label: 'Mutlu Sporcu' },
  { num: '5+', label: 'Yıl Deneyim' },
  { num: '%100', label: 'Türk Üretimi' },
  { num: '1 Gün', label: 'Hızlı Teslimat' },
];

const features = [
  { icon: Truck, num: '/01', title: 'Ücretsiz Kargo', desc: '2.500₺ üzeri siparişlerde' },
  { icon: RotateCcw, num: '/02', title: 'Kolay İade', desc: '14 gün içinde ücretsiz' },
  { icon: Shield, num: '/03', title: 'Güvenli Ödeme', desc: 'SSL ile korunan ödeme' },
  { icon: Zap, num: '/04', title: 'Hızlı Teslimat', desc: '1 İş Günü içinde' },
];

function SplitText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <span ref={ref} className={`inline-block overflow-hidden ${className}`}>
      <motion.span
        className="inline-block"
        initial={{ y: '110%' }}
        animate={inView ? { y: '0%' } : { y: '110%' }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const manifestoInView = useInView(manifestoRef, { once: true, margin: '-100px' });

  const { scrollY } = useScroll();
  const imageParallax = useTransform(scrollY, [0, 700], [0, -50]);

  const { data: apiCategories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts({});

  const categories = apiCategories.map(cat => ({
    ...cat,
    image: cat.image || defaultCategoryImages[cat.slug] || '',
  }));

  const featuredProducts = allProducts.slice(0, 8);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <SEO
        title="Ana Sayfa"
        description="Premium fitness ve bodybuilding giyim markası. Güç, performans ve stil bir arada. HANK ile antrenmanlarınızda fark yaratın."
        url="/"
      />
      <Header />

      {/* ══════════════════════════════════════════
          HERO — full-viewport editorial split
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative flex flex-col lg:flex-row lg:h-screen lg:min-h-[660px] bg-white"
        data-testid="section-hero"
      >
        {/* ── Mobile: full-bleed image top ── */}
        <div className="relative lg:hidden w-full h-[70svh] overflow-hidden">
          {heroSlides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeSlide === i ? 'opacity-100' : 'opacity-0'}`}
            >
              <img
                src={slide.img}
                alt={`HANK hero ${i + 1}`}
                className="w-full h-full object-cover object-top"
                data-testid={`img-hero-mobile-${i}`}
              />
            </div>
          ))}
          {/* Gradient fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* ── Mobile: text block ── */}
        <div className="lg:hidden px-5 pt-4 pb-10">
          <p className="text-[9px] tracking-[0.35em] uppercase text-black/35 mb-5">Premium Fitness Giyim</p>
          <h1 className="font-display leading-[0.88] tracking-wide text-black" style={{ fontSize: 'clamp(4rem, 18vw, 7rem)' }}>
            GÜCÜNÜ<br />
            <span className="text-stroke-black">GÖSTER</span>
          </h1>
          <Link href="/magaza" data-testid="button-hero-shop-mobile">
            <motion.span
              whileTap={{ scale: 0.97 }}
              className="mt-8 group inline-flex items-center gap-3 bg-black text-white text-[10px] tracking-[0.22em] uppercase font-semibold px-7 py-4"
            >
              Koleksiyonu Keşfet
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </motion.span>
          </Link>
        </div>

        {/* ── Desktop LEFT: editorial text panel ── */}
        <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col justify-between px-10 xl:px-14 2xl:px-20 py-10 bg-white z-10 relative shrink-0">
          {/* Top metadata row */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] tracking-[0.4em] uppercase text-black/25 font-medium select-none">HANK®</span>
            <div className="flex items-center gap-3">
              <span className="block w-8 h-px bg-black/15" />
              <span className="text-[9px] tracking-[0.4em] uppercase text-black/25 font-medium select-none">SS / 25</span>
            </div>
          </div>

          {/* Center: Main headline block */}
          <div className="relative">
            {/* Rotated side label */}
            <div
              className="absolute -left-8 top-1/2 -translate-y-1/2 select-none"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(50%)' }}
            >
              <span className="text-[8px] tracking-[0.35em] uppercase text-black/18 font-medium">
                Premium Fitness Giyim
              </span>
            </div>

            {/* Label */}
            <motion.p
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-[10px] tracking-[0.35em] uppercase text-black/35 mb-6 font-medium"
            >
              / Koleksiyon 2025
            </motion.p>

            {/* Headline */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="font-display leading-[0.88] tracking-wide text-black"
                style={{ fontSize: 'clamp(5rem, 8.5vw, 9.5rem)' }}
              >
                GÜCÜNÜ
              </motion.h1>
            </div>
            <div className="overflow-hidden">
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display leading-[0.88] tracking-wide text-stroke-black"
                style={{ fontSize: 'clamp(5rem, 8.5vw, 9.5rem)' }}
              >
                GÖSTER
              </motion.div>
            </div>

            {/* Thin separator line */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 mb-7 h-px bg-black/10 w-full"
            />

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="text-sm text-black/42 leading-[1.75] max-w-[280px] font-body"
            >
              Premium fitness ve bodybuilding giyim koleksiyonu.
              Her harekette güç, her anda stil.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 flex items-center gap-6"
            >
              <Link href="/magaza" data-testid="button-hero-shop">
                <motion.span
                  whileHover={{ x: 4 }}
                  className="group inline-flex items-center gap-3 bg-black text-white text-[11px] tracking-[0.22em] uppercase font-semibold px-8 py-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
                </motion.span>
              </Link>
              <Link href="/magaza">
                <span className="text-[10px] tracking-[0.18em] uppercase text-black/35 hover:text-black transition-colors font-medium relative after:absolute after:left-0 after:-bottom-0.5 after:w-full after:h-px after:bg-current after:scale-x-100">
                  Tüm Ürünler
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Bottom: slide indicators */}
          <div className="flex items-center gap-3">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-px transition-all duration-500 ease-out ${activeSlide === i ? 'w-14 bg-black' : 'w-5 bg-black/22 hover:bg-black/45'}`}
                data-testid={`button-slide-${i}`}
                aria-label={`Slayt ${i + 1}`}
              />
            ))}
            <span className="ml-3 text-[9px] tracking-[0.3em] text-black/25 font-medium tabular-nums">
              {String(activeSlide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── Desktop RIGHT: full-bleed image ── */}
        <div className="hidden lg:block relative flex-1 overflow-hidden bg-stone-100">
          <motion.div className="absolute inset-0" style={{ y: imageParallax }}>
            {heroSlides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-1200 ease-in-out ${activeSlide === i ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src={slide.img}
                  alt={`HANK hero ${i + 1}`}
                  className="w-full h-full object-cover object-top"
                  style={{ scale: 1.04 }}
                  data-testid={`img-hero-${i}`}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TICKER — black marquee strip
      ══════════════════════════════════════════ */}
      <div className="bg-black overflow-hidden h-10 flex items-center border-y border-black">
        <div className="flex animate-marquee-fast whitespace-nowrap">
          {tickerWords.map((word, i) => (
            <span key={i} className="inline-flex items-center gap-4 text-[10px] tracking-[0.32em] uppercase text-white/50 font-medium px-4">
              {word}
              <span className="inline-block w-px h-2.5 bg-white/20" />
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CATEGORIES — bold editorial grid
      ══════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 px-5 lg:px-10 xl:px-16" data-testid="section-categories">
        <div className="max-w-[1400px] mx-auto">

          {/* Section header */}
          <div className="flex items-end justify-between mb-10 lg:mb-14">
            <div className="flex items-end gap-5">
              <span className="font-display text-[72px] lg:text-[100px] leading-none text-black/6 select-none tabular-nums" aria-hidden>01</span>
              <div className="pb-2">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="font-display text-3xl lg:text-5xl tracking-wide text-black leading-none"
                >
                  KATEGORİLER
                </motion.h2>
              </div>
            </div>
            <Link href="/magaza" className="hidden lg:flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-black/35 hover:text-black transition-colors font-medium group">
              Tümünü Gör
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Desktop editorial grid: 1 tall + 2×2 */}
          {categories.length >= 5 ? (
            <div className="hidden lg:flex gap-3 xl:gap-4" style={{ height: '580px' }}>
              {/* Large featured card */}
              <Link href={`/kategori/${categories[0].slug}`} className="flex-[1.4] relative overflow-hidden group bg-stone-100 block" data-testid={`link-category-${categories[0].id}`}>
                <motion.img
                  src={categories[0].image}
                  alt={categories[0].name}
                  className="w-full h-full object-cover"
                  whileHover={{ scale: 1.04 }}
                  transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <span className="text-[9px] tracking-[0.3em] uppercase text-white/50 font-medium">Keşfet</span>
                  <h3 className="font-display text-4xl text-white tracking-wide mt-1 transition-transform duration-500 group-hover:-translate-y-1">
                    {categories[0].name.toUpperCase()}
                  </h3>
                </div>
                {/* Inner border on hover */}
                <div className="absolute inset-3 border border-white/0 group-hover:border-white/30 transition-all duration-500 pointer-events-none" />
              </Link>

              {/* 2×2 grid of remaining */}
              <div className="flex-[2] grid grid-cols-2 grid-rows-2 gap-3 xl:gap-4">
                {categories.slice(1, 5).map((cat, i) => (
                  <Link
                    key={cat.id}
                    href={`/kategori/${cat.slug}`}
                    className="relative overflow-hidden group bg-stone-100 block"
                    data-testid={`link-category-${cat.id}`}
                  >
                    <motion.img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h3 className="font-display text-2xl text-white tracking-wide transition-transform duration-500 group-hover:-translate-y-1">
                        {cat.name.toUpperCase()}
                      </h3>
                    </div>
                    <div className="absolute inset-2 border border-white/0 group-hover:border-white/25 transition-all duration-500 pointer-events-none" />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            /* Fallback grid for fewer categories */
            <div className="hidden lg:grid grid-cols-3 lg:grid-cols-5 gap-3 xl:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/kategori/${cat.slug}`}
                  className="relative overflow-hidden group bg-stone-100 block aspect-[3/4]"
                  data-testid={`link-category-${cat.id}`}
                >
                  <motion.img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-xl text-white tracking-wide">{cat.name.toUpperCase()}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Mobile: horizontal scroll */}
          <div className="lg:hidden flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="snap-start shrink-0"
              >
                <Link href={`/kategori/${cat.slug}`} data-testid={`link-category-mobile-${cat.id}`}>
                  <div className="relative w-[190px] h-[270px] overflow-hidden group bg-stone-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-xl text-white tracking-wide">{cat.name.toUpperCase()}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MANIFESTO — black statement section
      ══════════════════════════════════════════ */}
      <section className="bg-black py-20 lg:py-28 px-5 overflow-hidden" data-testid="section-manifesto">
        <div className="max-w-[1400px] mx-auto relative">
          {/* Background watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <span className="font-display text-[200px] lg:text-[340px] leading-none text-white/[0.03] tracking-tighter">
              HANK
            </span>
          </div>

          <div className="relative z-10 text-center" ref={manifestoRef}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={manifestoInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="text-[10px] tracking-[0.4em] uppercase text-white/25 font-medium mb-8 lg:mb-12"
            >
              — Hank Felsefesi —
            </motion.p>

            <div className="overflow-hidden mb-3">
              <motion.h2
                initial={{ y: '100%' }}
                animate={manifestoInView ? { y: '0%' } : {}}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-white leading-[0.9] tracking-wide"
                style={{ fontSize: 'clamp(2.8rem, 7vw, 7.5rem)' }}
              >
                GÜÇ BİR
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-8 lg:mb-12">
              <motion.h2
                initial={{ y: '100%' }}
                animate={manifestoInView ? { y: '0%' } : {}}
                transition={{ duration: 1, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-white/0 leading-[0.9] tracking-wide"
                style={{
                  fontSize: 'clamp(2.8rem, 7vw, 7.5rem)',
                  WebkitTextStroke: '2px rgba(255,255,255,0.85)',
                }}
              >
                İFADE BİÇİMİDİR.
              </motion.h2>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={manifestoInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-sm text-white/35 tracking-wider font-body max-w-md mx-auto"
            >
              1000'den fazla sporcu HANK ile güçleniyor.
              <br className="hidden sm:block" />
              Her koleksiyon, sınırları zorlamak için tasarlandı.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={manifestoInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.7 }}
              className="mt-10 lg:mt-14"
            >
              <Link href="/magaza" data-testid="button-manifesto-shop">
                <motion.span
                  whileHover={{ x: 4 }}
                  className="group inline-flex items-center gap-3 border border-white/25 text-white text-[10px] tracking-[0.25em] uppercase font-semibold px-8 py-4 hover:bg-white hover:text-black transition-all duration-300 cursor-pointer"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
                </motion.span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS — 4 numbers in a row
      ══════════════════════════════════════════ */}
      <section className="border-b border-black/8" data-testid="section-stats">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`px-6 py-10 lg:px-10 lg:py-14 text-center ${i > 0 ? 'border-l border-black/8' : ''} ${i === 2 ? 'border-t border-black/8 lg:border-t-0' : ''} ${i === 3 ? 'border-t border-black/8 lg:border-t-0' : ''}`}
              data-testid={`stat-${i}`}
            >
              <p className="font-display text-4xl lg:text-5xl text-black leading-none mb-2">{stat.num}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-black/35 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRODUCTS — featured grid
      ══════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 px-5 lg:px-10 xl:px-16 bg-stone-50" data-testid="section-products">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-10 lg:mb-14">
            <div className="flex items-end gap-5">
              <span className="font-display text-[72px] lg:text-[100px] leading-none text-black/6 select-none tabular-nums" aria-hidden>02</span>
              <div className="pb-2">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  className="font-display text-3xl lg:text-5xl tracking-wide text-black leading-none"
                >
                  ÖZEL SEÇKİLER
                </motion.h2>
              </div>
            </div>
            <Link href="/magaza" className="group flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-black/35 hover:text-black transition-colors font-medium">
              Tümünü Gör
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 xl:gap-5">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: (index % 4) * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                data-testid={`product-card-${product.id}`}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-black/30 text-sm tracking-wider">Henüz ürün eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — 4 minimal columns
      ══════════════════════════════════════════ */}
      <section className="border-t border-black/8" data-testid="section-features">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`px-6 py-10 lg:px-10 lg:py-14 ${i > 0 ? 'border-l border-black/8' : ''} ${i === 2 ? 'border-t border-black/8 lg:border-t-0' : ''} ${i === 3 ? 'border-t border-black/8 lg:border-t-0' : ''}`}
              data-testid={`feature-${i}`}
            >
              <div className="flex items-start justify-between mb-5">
                <f.icon className="w-4 h-4 text-black/30" />
                <span className="text-[9px] tracking-[0.2em] text-black/18 font-medium tabular-nums">{f.num}</span>
              </div>
              <h3 className="text-sm font-semibold text-black tracking-wide mb-1.5">{f.title}</h3>
              <p className="text-xs text-black/38 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
