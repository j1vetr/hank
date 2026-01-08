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
  ZoomIn,
  RotateCw
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - dragStart;
    const newRotation = rotation + diff * 0.5;
    setRotation(newRotation);
    setDragStart(e.clientX);
    
    const imageIndex = Math.abs(Math.floor(newRotation / 60)) % productData.images.length;
    setSelectedImage(imageIndex);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Header />

      <motion.div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-white/50 via-white to-white/50 z-[100]"
        style={{ width: progressWidth }}
      />

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={productData.images[selectedImage]}
              alt={productData.name}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              {productData.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(index); }}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === selectedImage ? 'border-white scale-110' : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={productData.images[index]} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

          <div className="grid lg:grid-cols-[1fr,480px] gap-12 lg:gap-16">
            <div className="flex gap-4">
              <div className="hidden md:flex flex-col gap-3 w-20">
                {productData.images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                      index === selectedImage 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-background' 
                        : 'opacity-40 hover:opacity-80'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`${productData.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === selectedImage && (
                      <motion.div
                        layoutId="thumbnail-indicator"
                        className="absolute inset-0 border-2 border-white rounded-lg"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="flex-1 space-y-4">
                <motion.div 
                  ref={imageRef}
                  className="relative aspect-[3/4] bg-gradient-to-br from-card to-card/50 rounded-2xl overflow-hidden group cursor-zoom-in"
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  onMouseDown={handleDragStart}
                  onMouseUp={handleDragEnd}
                  onMouseMoveCapture={handleDragMove}
                  onClick={() => !isDragging && setLightboxOpen(true)}
                  style={{
                    perspective: '1000px',
                  }}
                  animate={{
                    rotateY: isDragging ? rotation * 0.1 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10 pointer-events-none" />
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ 
                        opacity: 1, 
                        scale: isZooming ? 1.5 : 1,
                        x: isZooming ? (50 - mousePosition.x) * 2 : 0,
                        y: isZooming ? (50 - mousePosition.y) * 2 : 0,
                      }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        opacity: { duration: 0.3 },
                        scale: { duration: 0.4, ease: 'easeOut' },
                        x: { duration: 0.1 },
                        y: { duration: 0.1 },
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
                    <motion.span 
                      initial={{ x: -100 }}
                      animate={{ x: 0 }}
                      className="absolute top-4 left-4 z-20"
                    >
                      <span className="relative">
                        <span className="absolute inset-0 bg-red-500 blur-lg opacity-50" />
                        <span className="relative bg-red-600 text-white text-sm font-bold px-4 py-2 tracking-wider">
                          -%{productData.discount}
                        </span>
                      </span>
                    </motion.span>
                  )}

                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-colors"
                    >
                      <RotateCw className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center justify-center gap-2 text-white/60 text-xs">
                      <RotateCw className="w-3 h-3" />
                      <span>Sürükleyerek 360° görüntüle</span>
                    </div>
                  </div>
                </motion.div>

                <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
                  {productData.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-16 aspect-[3/4] rounded-lg overflow-hidden ${
                        index === selectedImage ? 'ring-2 ring-white' : 'opacity-50'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl blur-xl" />
                
                <div className="relative bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-[0.2em] mb-3" data-testid="text-category">
                      {productData.category}
                    </p>
                    <h1 className="font-display text-3xl tracking-wide mb-4" data-testid="text-product-name">
                      {productData.name}
                    </h1>
                    
                    <div className="flex items-baseline gap-4">
                      <motion.span 
                        className="text-3xl font-bold"
                        data-testid="text-price"
                        animate={{ 
                          textShadow: ['0 0 20px rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.3)', '0 0 20px rgba(255,255,255,0)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {productData.price.toLocaleString('tr-TR')} ₺
                      </motion.span>
                      {productData.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through" data-testid="text-original-price">
                          {productData.originalPrice.toLocaleString('tr-TR')} ₺
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Renk: <span className="text-foreground">{selectedColor.name}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                      {productData.colors.map((color) => (
                        <motion.button
                          key={color.slug}
                          onClick={() => setSelectedColor(color)}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative w-12 h-12 rounded-full transition-all flex items-center justify-center ${
                            selectedColor.slug === color.slug
                              ? 'ring-2 ring-white ring-offset-4 ring-offset-card'
                              : 'ring-1 ring-white/20 hover:ring-white/50'
                          }`}
                          style={{ backgroundColor: color.value }}
                          data-testid={`button-color-${color.slug}`}
                        >
                          <AnimatePresence>
                            {selectedColor.slug === color.slug && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Check className={`w-5 h-5 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">Beden: <span className="text-foreground">{selectedSize || 'Seçiniz'}</span></span>
                      <button
                        onClick={() => setShowSizeChart(!showSizeChart)}
                        className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4"
                        data-testid="button-size-guide"
                      >
                        Beden Tablosu
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {productData.sizes.map((size) => (
                        <motion.button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          animate={selectedSize === size ? { 
                            scale: [1, 1.05, 1],
                          } : {}}
                          transition={{ duration: 0.3 }}
                          className={`relative py-3.5 text-sm font-semibold rounded-lg overflow-hidden transition-all ${
                            selectedSize === size
                              ? 'bg-white text-black'
                              : 'bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10'
                          }`}
                          data-testid={`button-size-${size}`}
                        >
                          {selectedSize === size && (
                            <motion.div
                              layoutId="size-bg"
                              className="absolute inset-0 bg-white"
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4">
                          <h3 className="font-display text-lg tracking-wide">BEDEN TABLOSU</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-2 font-medium text-muted-foreground">Beden</th>
                                  <th className="text-left py-2 font-medium text-muted-foreground">Boy</th>
                                  <th className="text-left py-2 font-medium text-muted-foreground">Göğüs</th>
                                </tr>
                              </thead>
                              <tbody>
                                {productData.sizeChart.map((row) => (
                                  <tr key={row.size} className="border-b border-white/5">
                                    <td className="py-2 font-medium">{row.size}</td>
                                    <td className="py-2 text-muted-foreground">{row.length}</td>
                                    <td className="py-2 text-muted-foreground">{row.chest}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p><strong className="text-foreground">Model:</strong> {productData.modelInfo.name}</p>
                            <p>Boy: {productData.modelInfo.height} | Kilo: {productData.modelInfo.weight} | Beden: {productData.modelInfo.size}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors"
                        data-testid="button-quantity-decrease"
                      >
                        <Minus className="w-4 h-4" />
                      </motion.button>
                      <motion.span 
                        key={quantity}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-12 text-center font-semibold"
                        data-testid="text-quantity"
                      >
                        {quantity}
                      </motion.span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white/10 transition-colors"
                        data-testid="button-quantity-increase"
                      >
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <span className="text-xs text-muted-foreground">SKU: {productData.sku}</span>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      disabled={!selectedSize}
                      className={`relative flex-1 py-4 rounded-xl font-bold tracking-wide uppercase overflow-hidden transition-all ${
                        selectedSize 
                          ? 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]' 
                          : 'bg-white/20 text-white/50 cursor-not-allowed'
                      }`}
                      data-testid="button-add-to-cart"
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
                            <Check className="w-5 h-5" />
                            Sepete Eklendi
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
                      {isAddedToCart && (
                        <motion.div
                          initial={{ scale: 0, opacity: 1 }}
                          animate={{ scale: 3, opacity: 0 }}
                          className="absolute inset-0 bg-green-400 rounded-xl"
                        />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsLiked(!isLiked)}
                      className={`w-14 h-14 flex items-center justify-center rounded-xl border transition-all ${
                        isLiked 
                          ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                      data-testid="button-wishlist"
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
                      className="w-14 h-14 flex items-center justify-center rounded-xl border border-white/10 hover:border-white/30 bg-white/5 transition-all"
                      data-testid="button-share"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Truck, title: 'Ücretsiz Kargo', desc: '500₺ üzeri' },
                      { icon: RotateCcw, title: 'Kolay İade', desc: '14 gün' },
                      { icon: Shield, title: 'Güvenli', desc: 'SSL' },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ y: -2 }}
                        className="text-center p-3 rounded-xl bg-white/5 border border-white/5"
                      >
                        <item.icon className="w-5 h-5 mx-auto mb-2 text-white/60" />
                        <p className="text-xs font-medium">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24"
          >
            <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8">
              <div className="flex gap-8 mb-8">
                {['description', 'size'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'description' | 'size')}
                    className={`relative pb-4 text-sm font-medium uppercase tracking-wider transition-colors ${
                      activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`tab-${tab}`}
                  >
                    {tab === 'description' ? 'Açıklama' : 'Beden Bilgisi'}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-white/50 via-white to-white/50"
                      />
                    )}
                  </button>
                ))}
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
                    <p className="text-muted-foreground leading-relaxed font-body mb-8">
                      {productData.description}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {productData.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-4 rounded-xl bg-white/5"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
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
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 font-medium text-muted-foreground">Beden</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Boy</th>
                          <th className="text-left py-3 font-medium text-muted-foreground">Göğüs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productData.sizeChart.map((row, index) => (
                          <motion.tr 
                            key={row.size} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border-b border-white/5"
                          >
                            <td className="py-4 font-medium">{row.size}</td>
                            <td className="py-4 text-muted-foreground">{row.length}</td>
                            <td className="py-4 text-muted-foreground">{row.chest}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-6 p-4 rounded-xl bg-white/5">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">Model:</strong> {productData.modelInfo.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Boy: {productData.modelInfo.height} | Kilo: {productData.modelInfo.weight} | Beden: {productData.modelInfo.size}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.section 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24"
            data-testid="section-related"
          >
            <h2 className="font-display text-3xl tracking-wide mb-10">BENZERİ ÜRÜNLER</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6">
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

      <footer className="bg-card/50 backdrop-blur-sm border-t border-white/5 py-16 px-6">
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
                <li><Link href="/kategori/esofman">Eşofman</Link></li>
                <li><Link href="/kategori/salvar-pantolon">Şalvar & Pantolon</Link></li>
                <li><Link href="/kategori/sifir-kol-atlet">Sıfır Kol & Atlet</Link></li>
                <li><Link href="/kategori/sort">Şort</Link></li>
                <li><Link href="/kategori/tshirt">T-Shirt</Link></li>
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

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
