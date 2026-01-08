import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { Link } from 'wouter';
import { 
  ChevronRight, 
  Heart, 
  Share2, 
  Truck, 
  RotateCcw, 
  Shield, 
  Minus, 
  Plus,
  Check,
  X,
  ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const productData = {
  id: 1,
  name: 'SIFIR KOL REALBODYBUILDING T-SHIRT BEYAZ',
  price: 599.92,
  originalPrice: 674.91,
  discount: 11,
  sku: '2002',
  category: 'Sıfır Kol & Atlet',
  description: 'Hank sıfır kol tişörtleri, kapalı yaka tasarımı ve kolsuz dizaynıyla hem günlük giyimde hem de spor aktivitelerinde ideal bir seçenek sunar, modern tasarımıyla stil ve konforu bir arada sunar.',
  modelInfo: {
    name: 'IFBB PRO FAITHFUL CUTTER',
    height: '1.71m',
    weight: '85kg',
    size: 'M'
  },
  sizeChart: [
    { size: 'S', length: '85cm', chest: '53cm' },
    { size: 'M', length: '85cm', chest: '55cm' },
    { size: 'L', length: '87cm', chest: '57cm' },
    { size: 'XL', length: '89cm', chest: '59cm' },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: [
    { name: 'Beyaz', value: '#ffffff', slug: 'beyaz' },
    { name: 'Siyah', value: '#000000', slug: 'siyah' },
  ],
  images: [
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08802.jpg',
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08803.jpg',
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08804.jpg',
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08805.jpg',
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08809.jpg',
    'https://hank.com.tr/wp-content/uploads/2024/10/DSC08810.jpg',
  ],
  features: [
    'Nefes alan premium kumaş',
    'Kapalı yaka tasarımı',
    'Kolsuz modern dizayn',
    'Rahat ve esnek kesim',
  ],
};

const relatedProducts = [
  {
    id: 2,
    name: 'Sıfır Kol Realbodybuilding T-Shirt Siyah',
    price: 599.92,
    originalPrice: 674.91,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=800&fit=crop',
    category: 'Sıfır Kol & Atlet',
    colors: ['#000000', '#ffffff'],
  },
  {
    id: 3,
    name: 'Tank Top Atlet Realbodybuilding Siyah',
    price: 599.92,
    originalPrice: 674.91,
    image: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=800&fit=crop',
    category: 'Tank Top',
    colors: ['#000000'],
  },
  {
    id: 4,
    name: 'Performance Pro Tişört Siyah',
    price: 759.99,
    originalPrice: 854.99,
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop',
    category: 'Tişört',
    isNew: true,
    colors: ['#000000', '#1a1a1a'],
  },
  {
    id: 5,
    name: 'Muscle Fit Sweatshirt Gri',
    price: 899,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=800&fit=crop',
    category: 'Sweatshirt',
    colors: ['#4a4a4a', '#1a1a1a'],
  },
];

export default function ProductDetail() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(productData.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

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

  const handleAddToCart = () => {
    if (!selectedSize) return;
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <motion.div 
        className="fixed top-0 left-0 h-0.5 bg-foreground z-[100]"
        style={{ width: progressWidth }}
      />

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-8"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={productData.images[selectedImage]}
              alt={productData.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {productData.images.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                  className={`w-12 h-12 rounded overflow-hidden border transition-all ${
                    index === selectedImage ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/kategori/sifir-kol-atlet">{productData.category}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[200px]">{productData.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div className="flex gap-3">
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-[3/4] rounded overflow-hidden transition-all ${
                      index === selectedImage 
                        ? 'ring-1 ring-foreground' 
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex-1">
                <div 
                  ref={imageRef}
                  className="relative aspect-[3/4] bg-card rounded overflow-hidden cursor-zoom-in"
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
                        scale: isZooming ? 1.8 : 1,
                        x: isZooming ? (50 - mousePosition.x) * 3 : 0,
                        y: isZooming ? (50 - mousePosition.y) * 3 : 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        opacity: { duration: 0.2 },
                        scale: { duration: 0.3 },
                        x: { duration: 0 },
                        y: { duration: 0 },
                      }}
                      className="w-full h-full"
                    >
                      <img
                        src={productData.images[selectedImage]}
                        alt={productData.name}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {productData.discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1">
                      -%{productData.discount}
                    </span>
                  )}

                  <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2">
                  {productData.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-14 aspect-[3/4] rounded overflow-hidden ${
                        index === selectedImage ? 'ring-1 ring-foreground' : 'opacity-50'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  {productData.category}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide mb-3">
                  {productData.name}
                </h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold">
                    {productData.price.toLocaleString('tr-TR')} ₺
                  </span>
                  {productData.originalPrice && (
                    <span className="text-base text-muted-foreground line-through">
                      {productData.originalPrice.toLocaleString('tr-TR')} ₺
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {productData.description}
              </p>

              <div className="space-y-5 pt-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Renk: {selectedColor.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {productData.colors.map((color) => (
                      <button
                        key={color.slug}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                          selectedColor.slug === color.slug
                            ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                            : 'ring-1 ring-border hover:ring-muted-foreground'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        {selectedColor.slug === color.slug && (
                          <Check className={`w-3 h-3 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Beden: {selectedSize || 'Seçiniz'}
                    </span>
                    <button
                      onClick={() => setShowSizeChart(!showSizeChart)}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      Beden Tablosu
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {productData.sizes.map((size) => (
                      <motion.button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        whileTap={{ scale: 0.95 }}
                        className={`py-2.5 text-sm font-medium rounded transition-all ${
                          selectedSize === size
                            ? 'bg-foreground text-background'
                            : 'bg-card border border-border hover:border-foreground'
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {showSizeChart && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-card border border-border rounded p-4 text-sm">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="pb-2 font-medium text-muted-foreground">Beden</th>
                              <th className="pb-2 font-medium text-muted-foreground">Boy</th>
                              <th className="pb-2 font-medium text-muted-foreground">Göğüs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productData.sizeChart.map((row) => (
                              <tr key={row.size} className="border-b border-border/50 last:border-0">
                                <td className="py-2 font-medium">{row.size}</td>
                                <td className="py-2 text-muted-foreground">{row.length}</td>
                                <td className="py-2 text-muted-foreground">{row.chest}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-xs text-muted-foreground mt-3">
                          Model: {productData.modelInfo.name} | Boy: {productData.modelInfo.height} | Beden: {productData.modelInfo.size}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-medium text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">SKU: {productData.sku}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className={`flex-1 py-3.5 rounded font-semibold text-sm tracking-wide uppercase transition-all ${
                    selectedSize 
                      ? 'bg-foreground text-background hover:opacity-90' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isAddedToCart ? (
                      <motion.span
                        key="added"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Eklendi
                      </motion.span>
                    ) : (
                      <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        Sepete Ekle
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-12 h-12 flex items-center justify-center rounded border transition-all ${
                    isLiked ? 'bg-red-600 border-red-600 text-white' : 'border-border hover:border-foreground'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </motion.button>
                
                <button className="w-12 h-12 flex items-center justify-center rounded border border-border hover:border-foreground transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="text-center">
                  <Truck className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                  <p className="text-xs font-medium">Ücretsiz Kargo</p>
                  <p className="text-[10px] text-muted-foreground">500₺ üzeri</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                  <p className="text-xs font-medium">Kolay İade</p>
                  <p className="text-[10px] text-muted-foreground">14 gün</p>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                  <p className="text-xs font-medium">Güvenli Ödeme</p>
                  <p className="text-[10px] text-muted-foreground">SSL korumalı</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-10 border-t border-border">
            <h3 className="font-display text-xl tracking-wide mb-4">ÜRÜN ÖZELLİKLERİ</h3>
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {productData.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-foreground shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <section className="mt-20" data-testid="section-related">
            <h2 className="font-display text-2xl tracking-wide mb-8">BENZERİ ÜRÜNLER</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-1">
              <img
                src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                alt="HANK"
                className="h-7 invert mb-4"
              />
              <p className="text-muted-foreground text-sm">
                Premium fitness ve bodybuilding giyim.
              </p>
            </div>
            
            <div>
              <h4 className="font-display text-base tracking-wide mb-3">ALIŞVERİŞ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/kategori/esofman">Eşofman</Link></li>
                <li><Link href="/kategori/salvar-pantolon">Şalvar & Pantolon</Link></li>
                <li><Link href="/kategori/sifir-kol-atlet">Sıfır Kol & Atlet</Link></li>
                <li><Link href="/kategori/tshirt">T-Shirt</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-base tracking-wide mb-3">DESTEK</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/iletisim">İletişim</Link></li>
                <li><Link href="/sss">S.S.S.</Link></li>
                <li><Link href="/kargo">Kargo Bilgileri</Link></li>
                <li><Link href="/iade">İade Politikası</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-display text-base tracking-wide mb-3">KURUMSAL</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/hakkimizda">Hakkımızda</Link></li>
                <li><Link href="/gizlilik">Gizlilik Politikası</Link></li>
                <li><Link href="/kvkk">KVKK</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © 2024 HANK. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  );
}
