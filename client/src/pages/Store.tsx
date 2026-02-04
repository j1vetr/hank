import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { Link } from 'wouter';
import { ChevronRight, X, SlidersHorizontal, Grid3X3, LayoutGrid, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts, useCategories, type ProductFilters } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const sortOptions = [
  { value: 'newest', label: 'En Yeni' },
  { value: 'price_asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price_desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'popular', label: 'En Popüler' },
];

const sizeFilters = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Store() {
  const { data: categories = [] } = useCategories();
  
  const [sortBy, setSortBy] = useState<ProductFilters['sort']>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);

  const filters: ProductFilters = {
    categoryId: selectedCategory,
    sort: sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  };

  const { data: products = [], isLoading } = useProducts(filters);
  
  const filteredProducts = useMemo(() => {
    if (selectedSizes.length === 0) return products;
    return products.filter(p => 
      p.availableSizes?.some(size => selectedSizes.includes(size))
    );
  }, [products, selectedSizes]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedCategory(undefined);
    setSortBy('newest');
    setPriceRange([0, 10000]);
  };

  const hasActiveFilters = selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000 || selectedCategory;

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h4 className="font-display text-sm tracking-wider mb-4">KATEGORİ</h4>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedCategory ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            Tüm Ürünler
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-display text-sm tracking-wider mb-4">BEDEN</h4>
        <div className="flex flex-wrap gap-2">
          {sizeFilters.map(size => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-2 text-xs border rounded-lg transition-all ${
                selectedSizes.includes(size)
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h4 className="font-display text-sm tracking-wider mb-4">
          FİYAT ARALIĞI
        </h4>
        <Slider
          value={priceRange}
          min={0}
          max={10000}
          step={100}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mb-4"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₺{priceRange[0].toLocaleString('tr-TR')}</span>
          <span>₺{priceRange[1].toLocaleString('tr-TR')}</span>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Filtreleri Temizle
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mağaza"
        description="HANK fitness ve bodybuilding giyim koleksiyonu - Tüm ürünleri keşfedin"
        url="/magaza"
        breadcrumbs={[
          { name: 'Ana Sayfa', url: '/' },
          { name: 'Mağaza', url: '/magaza' }
        ]}
      />
      <Header />

      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-800"
        />
        <div className="absolute inset-0 noise-overlay opacity-40" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1400px] mx-auto px-6 pb-12 w-full">
            <motion.nav
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm text-white/70 mb-4"
              data-testid="breadcrumb"
            >
              <Link href="/">
                <span className="hover:text-white transition-colors">Ana Sayfa</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Mağaza</span>
            </motion.nav>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white tracking-wide"
              data-testid="text-store-title"
            >
              MAĞAZA
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/70 mt-4 text-lg"
            >
              {filteredProducts.length} ürün bulundu
            </motion.p>
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-white/10"
          >
            <div className="flex items-center gap-4">
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtrele
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-background border-r border-white/10">
                  <SheetHeader>
                    <SheetTitle className="font-display tracking-wider">FİLTRELE</SheetTitle>
                  </SheetHeader>
                  <div className="mt-8">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
              
              <div className="hidden sm:flex items-center gap-2 border border-white/20 rounded-lg p-1">
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-2 rounded transition-colors ${gridCols === 2 ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2 rounded transition-colors ${gridCols === 3 ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as ProductFilters['sort'])}>
              <SelectTrigger className="w-[200px] border-white/20">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <div className="flex gap-12">
            <aside className="hidden lg:block w-[240px] shrink-0">
              <div className="sticky top-32">
                <h3 className="font-display text-lg tracking-wider mb-6">FİLTRELE</h3>
                <FilterContent />
              </div>
            </aside>

            <div className="flex-1">
              {isLoading ? (
                <div className={`grid gap-6 ${
                  gridCols === 2 ? 'grid-cols-2' : 
                  gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 
                  'grid-cols-2 lg:grid-cols-4'
                }`}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] bg-white/5 rounded-xl" />
                      <div className="mt-4 h-4 bg-white/5 rounded w-3/4" />
                      <div className="mt-2 h-4 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <p className="text-muted-foreground text-lg mb-4">
                    Bu kriterlere uygun ürün bulunamadı.
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Filtreleri Temizle
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`grid gap-6 ${
                    gridCols === 2 ? 'grid-cols-2' : 
                    gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 
                    'grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative bg-black border-t border-white/10 py-16 lg:py-20 px-6">
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
