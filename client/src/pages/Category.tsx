import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { ProductCard } from '@/components/ProductCard';
import { Link, useParams } from 'wouter';
import { ChevronRight, X, SlidersHorizontal, Filter } from 'lucide-react';
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

export default function Category() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const category = categories.find(c => c.slug === slug);
  
  const [sortBy, setSortBy] = useState<ProductFilters['sort']>('newest');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters: ProductFilters = {
    categoryId: category?.id,
    sort: sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  };

  const { data: products = [], isLoading: productsLoading } = useProducts(filters);
  
  const isLoading = categoriesLoading || (category && productsLoading);
  
  // Client-side size filtering (since sizes are stored in product variants)
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
    setSortBy('newest');
    setPriceRange([0, 10000]);
  };

  const hasActiveFilters = selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000;

  if (!category && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-36 pb-20 px-6">
          <div className="max-w-[1400px] mx-auto text-center">
            <h1 className="font-display text-4xl mb-4">Kategori Bulunamadı</h1>
            <Link href="/">
              <span className="text-muted-foreground hover:text-foreground transition-colors">
                Ana Sayfaya Dön
              </span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={category?.name || 'Kategori'}
        description={`${category?.name || 'Ürünler'} - HANK fitness ve bodybuilding giyim koleksiyonu`}
        url={`/kategori/${slug}`}
        breadcrumbs={[
          { name: 'Ana Sayfa', url: '/' },
          { name: category?.name || 'Kategori', url: `/kategori/${slug}` }
        ]}
      />
      <Header />

      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <img
            src={category?.image || 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1200&h=600&fit=crop'}
            alt={category?.name || 'Kategori'}
            className="w-full h-full object-cover"
            data-testid="img-category-hero"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30" />
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
              <span className="text-white">{category?.name}</span>
            </motion.nav>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl text-white tracking-wide"
              data-testid="text-category-title"
            >
              {category?.name?.toUpperCase()}
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
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/50"
          >
            <div className="flex items-center gap-3">
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-white/20 hover:bg-white/5"
                    data-testid="button-open-filters"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtrele
                    {hasActiveFilters && (
                      <span className="w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
                        {selectedSizes.length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-zinc-900 border-white/10">
                  <SheetHeader>
                    <SheetTitle className="font-display text-xl tracking-wide">FİLTRELER</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-8 space-y-8">
                    <div>
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
                        Fiyat Aralığı
                      </h4>
                      <div className="space-y-4">
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          min={0}
                          max={10000}
                          step={100}
                          className="w-full"
                          data-testid="slider-price-range"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{priceRange[0].toLocaleString('tr-TR')} TL</span>
                          <span>{priceRange[1].toLocaleString('tr-TR')} TL</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
                        Beden
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {sizeFilters.map(size => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`w-12 h-12 border text-sm font-medium transition-all ${
                              selectedSizes.includes(size)
                                ? 'bg-white text-black border-white'
                                : 'border-white/20 hover:border-white/50'
                            }`}
                            data-testid={`button-filter-size-${size}`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground"
                        onClick={clearFilters}
                        data-testid="button-clear-filters"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Filtreleri Temizle
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  {selectedSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors"
                      data-testid={`button-remove-filter-${size}`}
                    >
                      {size}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as ProductFilters['sort'])}>
              <SelectTrigger className="w-[220px] border-white/20 bg-transparent" data-testid="select-sort">
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

          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-zinc-800/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-800/50 flex items-center justify-center">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-2xl mb-2">Ürün Bulunamadı</h3>
              <p className="text-muted-foreground mb-6">
                Bu kategoride henüz ürün bulunmuyor.
              </p>
              <Link href="/">
                <Button variant="outline" className="border-white/20">
                  Alışverişe Devam Et
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Math.min(index, 8) }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {categories.length > 1 && (
        <section className="py-16 px-6 border-t border-border/30">
          <div className="max-w-[1400px] mx-auto">
            <h2 className="font-display text-2xl tracking-wide mb-8">DİĞER KATEGORİLER</h2>
            <div className="flex flex-wrap gap-3">
              {categories
                .filter(c => c.slug !== slug)
                .map(cat => (
                  <Link key={cat.id} href={`/kategori/${cat.slug}`}>
                    <Button
                      variant="outline"
                      className="border-white/20 hover:bg-white hover:text-black transition-all"
                      data-testid={`button-other-category-${cat.slug}`}
                    >
                      {cat.name}
                    </Button>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
