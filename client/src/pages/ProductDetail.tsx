import { useState, useRef } from 'react';
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
  Zap
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
  const [showConfetti, setShowConfetti] = useState(false);

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
    setShowConfetti(true);
    setTimeout(() => {
      setIsAddedToCart(false);
      setShowConfetti(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />

      <motion.div 
        className="fixed top-0 left-0 h-[2px] bg-gradient-to-r from-white/50 via-white to-white/50 z-[100]"
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
            <motion.button
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-5 h-5" />
            </motion.button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              src={productData.images[selectedImage]}
              alt={productData.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {productData.images.map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                  className={`w-12 h-12 rounded overflow-hidden transition-all ${
                    index === selectedImage ? 'ring-2 ring-white' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-6"
          >
            <Link href="/">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/kategori/sifir-kol-atlet">{productData.category}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground truncate max-w-[200px]">{productData.name}</span>
          </motion.nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-3"
            >
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {productData.images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-[3/4] rounded overflow-hidden transition-all ${
                      index === selectedImage 
                        ? 'ring-1 ring-white' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                    {index === selectedImage && (
                      <motion.div 
                        layoutId="active-thumb"
                        className="absolute inset-0 ring-1 ring-white rounded"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex-1">
                <div className="snake-border">
                <motion.div 
                  ref={imageRef}
                  className="relative aspect-[3/4] bg-card rounded overflow-hidden cursor-zoom-in group"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  onClick={() => setLightboxOpen(true)}
                  whileHover={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ 
                        opacity: 1,
                        scale: isZooming ? 2 : 1,
                        x: isZooming ? (50 - mousePosition.x) * 4 : 0,
                        y: isZooming ? (50 - mousePosition.y) * 4 : 0,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        opacity: { duration: 0.3 },
                        scale: { duration: 0.4, ease: 'easeOut' },
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
                    <motion.div 
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="absolute top-3 left-3"
                    >
                      <span className="relative inline-flex">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 tracking-wider">
                          -%{productData.discount}
                        </span>
                        <span className="absolute inset-0 bg-red-600 animate-ping opacity-20 rounded-sm" />
                      </span>
                    </motion.div>
                  )}

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  </div>
                </motion.div>
                </div>

                <div className="flex sm:hidden gap-2 mt-3 overflow-x-auto pb-2">
                  {productData.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-14 aspect-[3/4] rounded overflow-hidden ${
                        index === selectedImage ? 'ring-1 ring-white' : 'opacity-50'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:sticky lg:top-24 lg:self-start space-y-5"
            >
              <motion.div variants={itemVariants}>
                <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  {productData.category}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl tracking-wide mb-3">
                  {productData.name}
                </h1>
                <div className="flex items-baseline gap-3">
                  <motion.span 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {productData.price.toLocaleString('tr-TR')} ₺
                  </motion.span>
                  {productData.originalPrice && (
                    <span className="text-base text-muted-foreground line-through">
                      {productData.originalPrice.toLocaleString('tr-TR')} ₺
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.p variants={itemVariants} className="text-sm text-muted-foreground leading-relaxed">
                {productData.description}
              </motion.p>

              <motion.div variants={itemVariants} className="space-y-4 pt-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Renk: {selectedColor.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {productData.colors.map((color) => (
                      <motion.button
                        key={color.slug}
                        onClick={() => setSelectedColor(color)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className={`relative w-9 h-9 rounded-full transition-all flex items-center justify-center ${
                          selectedColor.slug === color.slug
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-background'
                            : 'ring-1 ring-white/20 hover:ring-white/50'
                        }`}
                        style={{ backgroundColor: color.value }}
                      >
                        <AnimatePresence>
                          {selectedColor.slug === color.slug && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 180 }}
                            >
                              <Check className={`w-4 h-4 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
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
                      className="text-xs text-muted-foreground hover:text-white underline underline-offset-2 transition-colors"
                    >
                      Beden Tablosu
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {productData.sizes.map((size, index) => (
                      <motion.button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`relative py-2.5 text-sm font-medium rounded overflow-hidden transition-colors ${
                          selectedSize === size
                            ? 'bg-white text-black'
                            : 'bg-white/5 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        {selectedSize === size && (
                          <motion.div
                            layoutId="size-indicator"
                            className="absolute inset-0 bg-white"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{size}</span>
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
                  <div className="flex items-center border border-border rounded overflow-hidden">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>
                    <motion.span 
                      key={quantity}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-10 text-center font-medium text-sm"
                    >
                      {quantity}
                    </motion.span>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <span className="text-xs text-muted-foreground">SKU: {productData.sku}</span>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-2 pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  disabled={!selectedSize}
                  className={`relative flex-1 py-3.5 rounded font-bold text-sm tracking-wide uppercase overflow-hidden transition-all ${
                    selectedSize 
                      ? 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]' 
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isAddedToCart ? (
                      <motion.span
                        key="added"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Eklendi!
                      </motion.span>
                    ) : (
                      <motion.span 
                        key="add" 
                        initial={{ y: 20, opacity: 0 }} 
                        animate={{ y: 0, opacity: 1 }} 
                        exit={{ y: -20, opacity: 0 }}
                      >
                        Sepete Ekle
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {showConfetti && (
                    <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            x: '50%', 
                            y: '50%',
                            scale: 0 
                          }}
                          animate={{ 
                            x: `${Math.random() * 100}%`,
                            y: `${Math.random() * 100 - 50}%`,
                            scale: [0, 1, 0],
                            rotate: Math.random() * 360
                          }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute w-2 h-2 bg-black/80"
                          style={{ 
                            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-12 h-12 flex items-center justify-center rounded border transition-all ${
                    isLiked 
                      ? 'bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                      : 'border-border hover:border-white/50'
                  }`}
                >
                  <motion.div
                    animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.div>
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 flex items-center justify-center rounded border border-border hover:border-white/50 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              </motion.div>

              <motion.div 
                variants={itemVariants}
                className="grid grid-cols-3 gap-3 pt-4 border-t border-border"
              >
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="text-center p-3 rounded bg-white/[0.02] border border-white/5"
                >
                  <Truck className="w-5 h-5 mx-auto mb-1.5 text-white/60" />
                  <p className="text-xs font-medium">Ücretsiz Kargo</p>
                  <p className="text-[10px] text-muted-foreground">2000₺ üzeri</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="text-center p-3 rounded bg-white/[0.02] border border-white/5"
                >
                  <RotateCcw className="w-5 h-5 mx-auto mb-1.5 text-white/60" />
                  <p className="text-xs font-medium">Kolay İade</p>
                  <p className="text-[10px] text-muted-foreground">14 gün</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -2 }}
                  className="text-center p-3 rounded bg-white/[0.02] border border-white/5"
                >
                  <Shield className="w-5 h-5 mx-auto mb-1.5 text-white/60" />
                  <p className="text-xs font-medium">Güvenli Ödeme</p>
                  <p className="text-[10px] text-muted-foreground">SSL korumalı</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 pt-10 border-t border-border"
          >
            <h3 className="font-display text-xl tracking-wide mb-4">ÜRÜN ÖZELLİKLERİ</h3>
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
              {productData.features.map((feature, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded bg-white/[0.02] border border-white/5"
                >
                  <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {feature}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.section 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-20"
            data-testid="section-related"
          >
            <h2 className="font-display text-2xl tracking-wide mb-8">BENZERİ ÜRÜNLER</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </motion.section>
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
