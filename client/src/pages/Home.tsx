import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ArrowRight, ChevronRight, Truck, RotateCcw, Shield, Zap, Instagram, Facebook, Twitter } from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import heroImage1 from '@assets/hero-1.jpg';
import heroImage2 from '@assets/hero-2.jpg';
import categoryTshirt from '@assets/category-tshirt.jpg';
import categorySort from '@assets/category-sort.jpg';
import categoryAtlet from '@assets/category-atlet.jpg';
import categorySalvar from '@assets/category-salvar.jpg';
import categoryEsofman from '@assets/category-esofman.jpg';
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
  { icon: Truck, title: 'Ücretsiz Kargo', desc: '2000₺ üzeri siparişlerde' },
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
  const brandRef = useRef(null);
  
  const categoriesInView = useInView(categoriesRef, { once: true, amount: 0.2 });
  const productsInView = useInView(productsRef, { once: true, amount: 0.1 });
  const brandInView = useInView(brandRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
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

        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-6 pointer-events-none">
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
              className="font-display text-5xl sm:text-7xl lg:text-[140px] xl:text-[180px] text-white tracking-wider mb-12 leading-none"
            >
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="block mb-4 lg:mb-8"
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
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/kategori/tshirt">
                <button
                  data-testid="button-shop-men"
                  className="group px-10 py-5 bg-white text-black font-semibold tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-white/90 transition-all hover:gap-4"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/kategori/esofman">
                <button
                  data-testid="button-shop-all"
                  className="px-10 py-5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold tracking-wide uppercase hover:bg-white hover:text-black transition-all"
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
          <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
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

      <section ref={brandRef} className="py-32 lg:py-40 px-6 relative overflow-hidden" data-testid="section-brand">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800" />
        <div className="absolute inset-0 noise-overlay opacity-50" />
        
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
        
        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={brandInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block text-sm tracking-[0.4em] uppercase text-white/50 mb-8">
              HANK Felsefesi
            </span>
            
            <h2 className="font-display text-5xl sm:text-6xl lg:text-8xl mb-8 tracking-wide leading-tight">
              <span className="block">GÜÇ.</span>
              <span className="block text-stroke-white">STİL.</span>
              <span className="block">PERFORMANS.</span>
            </h2>
            
            <p className="text-lg lg:text-xl text-white/60 max-w-2xl mx-auto mb-12 font-body leading-relaxed">
              HANK, fitness tutkunları için tasarlanmış premium spor giyim markasıdır. 
              Her ürünümüz, en zorlu antrenmanlarınızda size eşlik etmek için 
              en kaliteli malzemelerle üretilmiştir.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/kategori/esofman">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  data-testid="button-about"
                  className="group px-10 py-5 bg-white text-black font-bold tracking-wider uppercase flex items-center gap-3 mx-auto hover:shadow-lg hover:shadow-white/20 transition-all"
                >
                  Koleksiyonu Keşfet
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
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
                src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                alt="HANK"
                className="h-10 invert mb-6"
              />
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Premium fitness ve bodybuilding giyim markası. 
                Güç, performans ve stil bir arada.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
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
                <li><Link href="/iletisim" className="hover:text-white transition-colors">İletişim</Link></li>
                <li><Link href="/sss" className="hover:text-white transition-colors">S.S.S.</Link></li>
                <li><Link href="/kargo" className="hover:text-white transition-colors">Kargo Bilgileri</Link></li>
                <li><Link href="/iade" className="hover:text-white transition-colors">İade Politikası</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wider mb-6">KURUMSAL</h4>
              <ul className="space-y-4 text-sm text-white/50">
                <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
                <li><Link href="/kariyer" className="hover:text-white transition-colors">Kariyer</Link></li>
                <li><Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2025 HANK. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4 text-sm text-white/40">
              <span>Türkiye'de Üretildi</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>Premium Kalite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
