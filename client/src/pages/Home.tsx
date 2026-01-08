import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import heroImage from '@assets/generated_images/athletic_torso_hero_image.png';

const categories = [
  {
    id: 1,
    name: 'Tişörtler',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
    count: 48,
  },
  {
    id: 2,
    name: 'Sweatshirtler',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop',
    count: 32,
  },
  {
    id: 3,
    name: 'Şortlar',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop',
    count: 24,
  },
  {
    id: 4,
    name: 'Eşofman Altları',
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=800&fit=crop',
    count: 36,
  },
];

const featuredProducts = [
  {
    id: 1,
    name: 'Performance Pro Tişört - Siyah',
    price: 599,
    originalPrice: 799,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop',
    category: 'Tişört',
    isNew: true,
    colors: ['#000000', '#1a1a1a', '#333333'],
  },
  {
    id: 2,
    name: 'Muscle Fit Sweatshirt - Gri',
    price: 899,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop',
    category: 'Sweatshirt',
    colors: ['#4a4a4a', '#1a1a1a'],
  },
  {
    id: 3,
    name: 'Training Şort - Siyah',
    price: 449,
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=800&fit=crop',
    category: 'Şort',
    isNew: true,
    colors: ['#000000', '#2d2d2d'],
  },
  {
    id: 4,
    name: 'Essential Tank Top - Beyaz',
    price: 399,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop',
    category: 'Tank Top',
    colors: ['#ffffff', '#000000'],
  },
  {
    id: 5,
    name: 'Compression Tişört - Navy',
    price: 649,
    image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=800&fit=crop',
    category: 'Tişört',
    colors: ['#1a1a2e', '#000000'],
  },
  {
    id: 6,
    name: 'Premium Eşofman Altı - Antrasit',
    price: 749,
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=800&fit=crop',
    category: 'Eşofman Altı',
    isNew: true,
    colors: ['#2d2d2d', '#1a1a1a', '#000000'],
  },
  {
    id: 7,
    name: 'Pro Series Hoodie - Siyah',
    price: 999,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=800&fit=crop',
    category: 'Hoodie',
    colors: ['#000000', '#1a1a1a'],
  },
  {
    id: 8,
    name: 'Gym Stringers - Gri',
    price: 349,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
    category: 'Stringer',
    colors: ['#4a4a4a', '#000000', '#ffffff'],
  },
];

const marqueeText = 'HANK • GÜÇ • PERFORMANS • STİL • HANK • GÜÇ • PERFORMANS • STİL • ';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative h-screen overflow-hidden noise-overlay" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="HANK Hero"
            className="w-full h-full object-cover"
            data-testid="img-hero"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-[1400px] mx-auto px-6 w-full">
            <div className="max-w-2xl animate-fade-up">
              <span className="inline-block text-sm tracking-[0.3em] uppercase text-white/70 mb-6">
                2024 Yeni Sezon
              </span>
              <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl text-white tracking-wide mb-6">
                GÜCÜNÜ<br />GÖSTER
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-md font-body">
                Premium kalite fitness giyim. Antrenmanlarında fark yarat, 
                tarzınla öne çık.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/erkek">
                  <button
                    data-testid="button-shop-men"
                    className="group px-8 py-4 bg-white text-black font-semibold tracking-wide uppercase flex items-center justify-center gap-3 hover:bg-white/90 transition-colors"
                  >
                    Erkek Koleksiyonu
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="/kadin">
                  <button
                    data-testid="button-shop-women"
                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold tracking-wide uppercase hover:bg-white hover:text-black transition-colors"
                  >
                    Kadın Koleksiyonu
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 overflow-hidden py-4 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
          <div className="animate-marquee flex whitespace-nowrap">
            <span className="font-display text-2xl text-white/40 tracking-[0.2em]">
              {marqueeText}{marqueeText}
            </span>
          </div>
        </div>
      </section>

      <section className="py-24 px-6" data-testid="section-categories">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">
                Keşfet
              </span>
              <h2 className="font-display text-4xl sm:text-5xl mt-2 tracking-wide">
                KATEGORİLER
              </h2>
            </div>
            <Link href="/kategoriler" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
              Tümünü Gör <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/kategori/${category.name.toLowerCase()}`}
                data-testid={`link-category-${category.id}`}
              >
                <div className="group relative aspect-[3/4] overflow-hidden bg-card hover-lift cursor-pointer">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    data-testid={`img-category-${category.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
                      {category.name.toUpperCase()}
                    </h3>
                    <p className="text-white/60 text-sm mt-1">
                      {category.count} Ürün
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-card noise-overlay" data-testid="section-products">
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm tracking-[0.2em] uppercase text-muted-foreground">
                En Çok Satanlar
              </span>
              <h2 className="font-display text-4xl sm:text-5xl mt-2 tracking-wide">
                POPÜLER ÜRÜNLER
              </h2>
            </div>
            <Link href="/urunler" className="hidden sm:flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">
              Tümünü Gör <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12 sm:hidden">
            <Link href="/urunler">
              <button className="px-8 py-4 border border-foreground font-semibold tracking-wide uppercase">
                Tümünü Gör
              </button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative overflow-hidden" data-testid="section-brand">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        </div>
        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <span className="text-sm tracking-[0.3em] uppercase text-muted-foreground">
            Hakkımızda
          </span>
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl mt-6 mb-8 tracking-wide">
            GÜÇ. STİL.<br />PERFORMANS.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed">
            HANK, fitness tutkunları için tasarlanmış premium spor giyim markasıdır. 
            Her ürünümüz, en zorlu antrenmanlarınızda size eşlik etmek için 
            en kaliteli malzemelerle üretilmiştir.
          </p>
          <Link href="/hakkimizda">
            <button
              data-testid="button-about"
              className="group px-8 py-4 bg-foreground text-background font-semibold tracking-wide uppercase flex items-center gap-3 mx-auto hover:opacity-90 transition-opacity"
            >
              Markayı Keşfet
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border" data-testid="section-features">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Ücretsiz Kargo', desc: '500 TL üzeri siparişlerde' },
              { title: 'Kolay İade', desc: '14 gün içinde ücretsiz iade' },
              { title: 'Güvenli Ödeme', desc: 'SSL ile korunan ödeme' },
              { title: 'Hızlı Teslimat', desc: '2-4 iş günü içinde' },
            ].map((feature, index) => (
              <div key={index} className="text-center" data-testid={`feature-${index}`}>
                <h3 className="font-display text-xl tracking-wide mb-2">
                  {feature.title.toUpperCase()}
                </h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border py-16 px-6" data-testid="section-footer">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-1">
              <img
                src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                alt="HANK"
                className="h-8 invert mb-6"
              />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Premium fitness ve bodybuilding giyim markası. 
                Güç, performans ve stil bir arada.
              </p>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wide mb-4">ALIŞVERİŞ</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/erkek">Erkek</Link></li>
                <li><Link href="/kadin">Kadın</Link></li>
                <li><Link href="/aksesuarlar">Aksesuarlar</Link></li>
                <li><Link href="/yeni">Yeni Gelenler</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wide mb-4">DESTEK</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/iletisim">İletişim</Link></li>
                <li><Link href="/sss">S.S.S.</Link></li>
                <li><Link href="/kargo">Kargo Bilgileri</Link></li>
                <li><Link href="/iade">İade Politikası</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-lg tracking-wide mb-4">KURUMSAL</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/hakkimizda">Hakkımızda</Link></li>
                <li><Link href="/kariyer">Kariyer</Link></li>
                <li><Link href="/gizlilik">Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk">KVKK</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 HANK. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
