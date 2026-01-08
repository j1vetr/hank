import { useState } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const productData = {
  id: 1,
  name: 'SIFIR KOL REALBODYBUILDING T-SHIRT BEYAZ',
  price: 599.92,
  originalPrice: 674.91,
  discount: 11,
  sku: '2002',
  category: 'Sıfır Kol & Atlet',
  description: 'Hank sıfır kol tişörtleri, kapalı yaka tasarımı ve kolsuz dizaynıyla hem günlük giyimde hem de spor aktivitelerinde ideal bir seçenek sunar, modern tasarımıyla stil ve konforu bir arada sunar. Siyah ve beyaz renk seçenekleriyle tarzınızı tamamlar. Nefes alan kumaş, terletmeden konfor sağlar. Hank ile şık bir görünüm elde edin; sade detaylarla gerçek tarzınızı öne çıkarın.',
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
  const [activeTab, setActiveTab] = useState<'description' | 'size'>('description');

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? productData.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === productData.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
            <Link href="/">Ana Sayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/erkek">Erkek</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/kategori/sifir-kol">{productData.category}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{productData.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-card overflow-hidden group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={productData.images[selectedImage]}
                    alt={productData.name}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    data-testid="img-product-main"
                  />
                </AnimatePresence>

                {productData.discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-4 py-2 tracking-wider">
                    -%{productData.discount}
                  </span>
                )}

                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="button-next-image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {productData.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === selectedImage ? 'bg-foreground w-6' : 'bg-foreground/40'
                      }`}
                      data-testid={`button-image-dot-${index}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {productData.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${
                      index === selectedImage ? 'border-foreground' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${productData.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start space-y-8">
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2" data-testid="text-category">
                  {productData.category}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-4" data-testid="text-product-name">
                  {productData.name}
                </h1>
                
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-2xl font-semibold" data-testid="text-price">
                    {productData.price.toLocaleString('tr-TR')} ₺
                  </span>
                  {productData.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through" data-testid="text-original-price">
                      {productData.originalPrice.toLocaleString('tr-TR')} ₺
                    </span>
                  )}
                </div>

                <p className="text-muted-foreground leading-relaxed font-body" data-testid="text-description">
                  {productData.description}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Renk: {selectedColor.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {productData.colors.map((color) => (
                      <button
                        key={color.slug}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor.slug === color.slug
                            ? 'border-foreground scale-110'
                            : 'border-border hover:border-muted-foreground'
                        }`}
                        style={{ backgroundColor: color.value }}
                        data-testid={`button-color-${color.slug}`}
                      >
                        {selectedColor.slug === color.slug && (
                          <Check className={`w-4 h-4 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Beden: {selectedSize || 'Seçiniz'}</span>
                    <button
                      onClick={() => setShowSizeChart(!showSizeChart)}
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
                      data-testid="button-size-guide"
                    >
                      Beden Tablosu
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {productData.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-3 text-sm font-medium border transition-all ${
                          selectedSize === size
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border hover:border-foreground'
                        }`}
                        data-testid={`button-size-${size}`}
                      >
                        {size}
                      </button>
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
                      <div className="bg-card border border-border p-6 space-y-4">
                        <h3 className="font-display text-lg tracking-wide">BEDEN TABLOSU</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-2 font-medium">Beden</th>
                                <th className="text-left py-2 font-medium">Boy</th>
                                <th className="text-left py-2 font-medium">Göğüs</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productData.sizeChart.map((row) => (
                                <tr key={row.size} className="border-b border-border/50">
                                  <td className="py-2">{row.size}</td>
                                  <td className="py-2">{row.length}</td>
                                  <td className="py-2">{row.chest}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p><strong>Model:</strong> {productData.modelInfo.name}</p>
                          <p>Boy: {productData.modelInfo.height} | Kilo: {productData.modelInfo.weight} | Giydiği Beden: {productData.modelInfo.size}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <span className="text-sm font-medium mb-3 block">Adet</span>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-accent transition-colors"
                        data-testid="button-quantity-decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium" data-testid="text-quantity">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-accent transition-colors"
                        data-testid="button-quantity-increase"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">Stok Kodu: {productData.sku}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 py-4 bg-foreground text-background font-semibold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedSize}
                  data-testid="button-add-to-cart"
                >
                  Sepete Ekle
                </button>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-14 h-14 flex items-center justify-center border transition-all ${
                    isLiked ? 'bg-red-600 border-red-600 text-white' : 'border-border hover:border-foreground'
                  }`}
                  data-testid="button-wishlist"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  className="w-14 h-14 flex items-center justify-center border border-border hover:border-foreground transition-all"
                  data-testid="button-share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Ücretsiz Kargo</p>
                  <p className="text-xs text-muted-foreground">500₺ üzeri</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Kolay İade</p>
                  <p className="text-xs text-muted-foreground">14 gün içinde</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Güvenli Ödeme</p>
                  <p className="text-xs text-muted-foreground">SSL korumalı</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-border pt-12">
            <div className="flex gap-8 mb-8 border-b border-border">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative ${
                  activeTab === 'description' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-description"
              >
                Açıklama
                {activeTab === 'description' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  />
                )}
              </button>
              <button
                onClick={() => setActiveTab('size')}
                className={`pb-4 text-sm font-medium uppercase tracking-wider transition-colors relative ${
                  activeTab === 'size' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid="tab-size"
              >
                Beden Bilgisi
                {activeTab === 'size' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                  />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'description' ? (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl"
                >
                  <p className="text-muted-foreground leading-relaxed font-body mb-6">
                    {productData.description}
                  </p>
                  <ul className="space-y-2">
                    {productData.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="w-4 h-4 text-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ) : (
                <motion.div
                  key="size"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-xl"
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 font-medium">Beden</th>
                        <th className="text-left py-3 font-medium">Boy</th>
                        <th className="text-left py-3 font-medium">Göğüs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productData.sizeChart.map((row) => (
                        <tr key={row.size} className="border-b border-border/50">
                          <td className="py-3 font-medium">{row.size}</td>
                          <td className="py-3 text-muted-foreground">{row.length}</td>
                          <td className="py-3 text-muted-foreground">{row.chest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-6 p-4 bg-card border border-border">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Model Bilgisi:</strong> {productData.modelInfo.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Boy: {productData.modelInfo.height} | Kilo: {productData.modelInfo.weight} | Giydiği Beden: {productData.modelInfo.size}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <section className="mt-24" data-testid="section-related">
            <h2 className="font-display text-3xl tracking-wide mb-10">BENZERİ ÜRÜNLER</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-16 px-6">
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
