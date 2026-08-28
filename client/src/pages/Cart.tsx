import { Link } from 'wouter';
import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, ShoppingBag, Truck, Shield, RotateCcw, ArrowRight, Package, BadgePercent, Bell, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
}

type RecommendationSource = 'complementary' | 'campaign' | 'free_shipping';

interface RecommendationProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
  stock: number;
  isOutOfStock: boolean;
  requiresVariant: boolean;
  defaultVariantId: string | null;
  defaultVariantLabel: string | null;
  source: RecommendationSource;
}

interface CartRecommendations {
  sections: {
    complementary: RecommendationProduct[];
    campaign: RecommendationProduct[];
    freeShipping: RecommendationProduct[];
  };
  freeShipping: {
    threshold: number;
    remaining: number;
  };
}

const FREE_SHIPPING_THRESHOLD = 2500;

export default function Cart() {
  const { items, isLoading, updateQuantity, removeItem, addToCart, totalItems, subtotal, pricing } = useCart();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [notifyTarget, setNotifyTarget] = useState<RecommendationProduct | null>(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [isSubmittingNotification, setIsSubmittingNotification] = useState(false);
  const seenRecommendationViews = useRef(new Set<string>());

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
  });

  const { data: recommendations } = useQuery<CartRecommendations>({
    queryKey: ['cart-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/cart/recommendations', { credentials: 'include' });
      if (!res.ok) throw new Error('Öneriler alınamadı');
      return res.json();
    },
    enabled: items.length > 0,
    staleTime: 0,
  });

  const cartItemsWithProducts = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  });

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 200;
  const campaignDiscount = pricing?.campaignDiscount || 0;
  const total = (pricing?.discountedSubtotal ?? subtotal) + shippingCost;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const getPricingLine = (cartItemId: string) => pricing?.lines.find(line => line.cartItemId === cartItemId);

  useEffect(() => {
    if (!recommendations) return;
    Object.values(recommendations.sections).flat().forEach(product => {
      const key = `${product.source}:${product.id}`;
      if (seenRecommendationViews.current.has(key)) return;
      seenRecommendationViews.current.add(key);
      fetch('/api/recommendations/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventType: 'view', productId: product.id, source: product.source }),
      }).catch(() => undefined);
    });
  }, [recommendations]);

  const handleRecommendationAdd = async (product: RecommendationProduct) => {
    if (!product.defaultVariantId && product.requiresVariant) return;
    setAddingProductId(product.id);
    try {
      await addToCart(product.id, product.defaultVariantId || undefined, 1, product.source);
    } finally {
      setAddingProductId(null);
    }
  };

  const handleStockNotification = async () => {
    if (!notifyTarget) return;
    setNotifyStatus(null);
    setIsSubmittingNotification(true);
    try {
      const res = await fetch('/api/stock-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: notifyEmail,
          productId: notifyTarget.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bildirim isteği kaydedilemedi');
      setNotifyStatus('Stokta olduğunda size e-posta göndereceğiz.');
      setNotifyEmail('');
    } catch (error) {
      setNotifyStatus(error instanceof Error ? error.message : 'Bildirim isteği kaydedilemedi');
    } finally {
      setIsSubmittingNotification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-36 pb-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="font-display text-xl"
            >
              Yükleniyor...
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent h-64 pointer-events-none" />
        <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
      </div>

      <main className="pt-36 pb-20 px-4 sm:px-6 relative z-10 w-full box-border">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-3" data-testid="text-page-title">
              SEPETİM
            </h1>
            <p className="text-muted-foreground">
              {totalItems > 0 ? `${totalItems} ürün sepetinizde` : 'Sepetiniz boş'}
            </p>
          </motion.div>

          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="font-display text-2xl tracking-wide mb-4">Sepetiniz Boş</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Henüz sepetinize ürün eklemediniz. Koleksiyonumuzu keşfedin ve favori ürünlerinizi ekleyin.
              </p>
              <Link href="/">
                <Button className="h-12 px-8 bg-white text-black hover:bg-white/90 font-bold tracking-wide group" data-testid="button-continue-shopping">
                  ALIŞVERİŞE BAŞLA
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-hidden">
              <div className="lg:col-span-2 space-y-4 overflow-hidden">
                {remainingForFreeShipping > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium">Ücretsiz Kargoya Az Kaldı!</p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-bold text-amber-400">{remainingForFreeShipping.toFixed(0)} TL</span> daha harcayın
                        </p>
                      </div>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {remainingForFreeShipping <= 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-400">Ücretsiz Kargo Kazandınız!</p>
                        <p className="text-sm text-muted-foreground">Siparişiniz ücretsiz kargo ile gönderilecek</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {pricing?.campaign && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl p-4 border ${
                      campaignDiscount > 0
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/25'
                        : 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/25'
                    }`}
                    data-testid="cart-campaign-progress"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        campaignDiscount > 0 ? 'bg-emerald-500/20' : 'bg-violet-500/20'
                      }`}>
                        <BadgePercent className={`w-5 h-5 ${campaignDiscount > 0 ? 'text-emerald-400' : 'text-violet-300'}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-medium ${campaignDiscount > 0 ? 'text-emerald-300' : 'text-violet-200'}`}>
                          {pricing.campaign.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {pricing.campaign.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {pricing.progressMessage}
                        </p>
                        {campaignDiscount === 0 && pricing.requiredItemCount > 0 && (
                          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden mt-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((pricing.eligibleItemCount / pricing.requiredItemCount) * 100, 100)}%` }}
                              className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Shipping Info Notice */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-500/10 rounded-xl p-4 space-y-1"
                >
                  <p className="text-xs text-muted-foreground text-center">
                    <strong className="text-white/80">Türkiye içi kargo:</strong> 2.500 TL üzeri ücretsiz, altı 200 TL
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    <strong className="text-white/80">Uluslararası kargo:</strong> Sabit 2.500 TL (ödeme adımında hesaplanır)
                  </p>
                </motion.div>

                <AnimatePresence mode="popLayout">
                  {cartItemsWithProducts.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors overflow-hidden"
                      data-testid={`cart-item-${item.id}`}
                    >
                      <div className="flex gap-4">
                        <Link href={`/urun/${item.product?.slug}`}>
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="w-28 h-32 bg-zinc-800 rounded-lg overflow-hidden shrink-0 relative"
                          >
                            {item.product?.images?.[0] && (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            )}
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg" />
                          </motion.div>
                        </Link>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <Link href={`/urun/${item.product?.slug}`}>
                              <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-white/80 transition-colors" data-testid={`text-product-name-${item.id}`}>
                                {item.product?.name || 'Ürün'}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {item.variant?.size && (
                                <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/80">
                                  Beden: {item.variant.size}
                                </span>
                              )}
                              {item.variant?.color && (
                                <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/80">
                                  {item.variant.color}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3">
                            <div className="flex items-center bg-black/30 rounded-lg p-0.5 shrink-0">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="w-6 sm:w-7 text-center text-xs sm:text-sm font-medium" data-testid={`text-quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="font-bold text-base sm:text-lg" data-testid={`text-price-${item.id}`}>
                                {(getPricingLine(item.id)?.lineSubtotal ?? (parseFloat(item.variant?.price || item.product?.basePrice || '0') * item.quantity)).toLocaleString('tr-TR')} ₺
                              </p>
                              {(getPricingLine(item.id)?.discountAmount || 0) > 0 && (
                                <p className="text-xs text-emerald-400 mt-0.5">
                                  Kampanya indirimi: -{getPricingLine(item.id)?.discountAmount.toLocaleString('tr-TR')} ₺
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors self-start"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                 {recommendations?.sections.complementary.length ? (
                   <RecommendationSection
                     title="BUNLAR DA İYİ GİDER"
                     description=""
                     products={recommendations.sections.complementary}
                     addingProductId={addingProductId}
                     onAdd={handleRecommendationAdd}
                     onNotify={setNotifyTarget}
                     accent="neutral"
                     showIcon={false}
                     titleSize="large"
                   />
                 ) : null}

                 {recommendations?.sections.campaign.length ? (
                   <RecommendationSection
                     title="KAMPANYAYI TAMAMLA"
                     description={pricing?.remainingItems
                       ? `${pricing.remainingItems} uygun ürün daha ekleyerek kampanya avantajını yakalayın`
                       : 'Kampanyaya uygun ürünleri keşfedin'}
                     products={recommendations.sections.campaign}
                     addingProductId={addingProductId}
                     onAdd={handleRecommendationAdd}
                     onNotify={setNotifyTarget}
                     accent="violet"
                   />
                 ) : null}

                 {recommendations?.sections.freeShipping.length ? (
                   <RecommendationSection
                     title="ÜCRETSİZ KARGOYA ULAŞ"
                     description={`${recommendations.freeShipping.remaining.toLocaleString('tr-TR')} ₺ daha ekleyerek ücretsiz kargodan yararlanın`}
                     products={recommendations.sections.freeShipping}
                     addingProductId={addingProductId}
                     onAdd={handleRecommendationAdd}
                     onNotify={setNotifyTarget}
                     accent="amber"
                   />
                 ) : null}
              </div>

              <div className="lg:col-span-1">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-800/80 to-zinc-900 border border-white/10 rounded-2xl p-4 sm:p-6 sticky top-24 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
                  
                  <h2 className="font-display text-xl tracking-wide mb-6 relative">
                    SİPARİŞ ÖZETİ
                  </h2>

                  <div className="space-y-4 text-sm relative">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ara Toplam ({totalItems} ürün)</span>
                      <span className="font-medium" data-testid="text-subtotal">{subtotal.toLocaleString('tr-TR')} ₺</span>
                    </div>
                    {campaignDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span className="flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          {pricing?.campaign?.name || 'Sepet kampanyası'}
                        </span>
                        <span data-testid="text-campaign-discount">-{campaignDiscount.toLocaleString('tr-TR')} ₺</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kargo</span>
                      <span data-testid="text-shipping" className={shippingCost === 0 ? 'text-green-400 font-medium' : ''}>
                        {shippingCost === 0 ? 'ÜCRETSİZ' : `${shippingCost.toFixed(2)} ₺`}
                      </span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />
                    <div className="flex justify-between text-base">
                      <span className="font-bold">Toplam</span>
                      <span className="font-bold text-xl" data-testid="text-total">{total.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  </div>

                  <Link href="/odeme">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button className="w-full h-14 mt-6 bg-white text-black hover:bg-white/90 font-bold text-sm tracking-wider group rounded-xl" data-testid="button-checkout">
                        ÖDEMEYE GEÇ
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </motion.div>
                  </Link>

                  <Link href="/">
                    <Button variant="ghost" className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground" data-testid="button-continue">
                      Alışverişe Devam Et
                    </Button>
                  </Link>

                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>Güvenli Ödeme</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>14 Gün Ücretsiz İade</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Package className="w-4 h-4 shrink-0" />
                      <span>Hızlı Teslimat (1 İş Günü)</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {notifyTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-notification-title"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="w-11 h-11 rounded-full bg-amber-500/15 text-amber-300 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h2 id="stock-notification-title" className="font-display text-2xl tracking-wide">HABER VER</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {notifyTarget.name} yeniden stokta olduğunda size e-posta gönderelim.
              </p>
              <input
                type="email"
                value={notifyEmail}
                onChange={event => setNotifyEmail(event.target.value)}
                placeholder="E-posta adresiniz"
                className="w-full mt-5 h-11 px-3 rounded-lg bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                data-testid="input-stock-notification-email"
              />
              {notifyStatus && (
                <p className={`text-sm mt-3 ${notifyStatus.startsWith('Stokta') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {notifyStatus}
                </p>
              )}
              <div className="flex gap-3 mt-5">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => { setNotifyTarget(null); setNotifyStatus(null); }}
                >
                  Vazgeç
                </Button>
                <Button
                  className="flex-1 bg-white text-black hover:bg-white/90"
                  disabled={isSubmittingNotification}
                  onClick={handleStockNotification}
                  data-testid="button-submit-stock-notification"
                >
                  {isSubmittingNotification ? <Loader2 className="w-4 h-4 animate-spin" /> : 'BİLDİRİM İSTE'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RecommendationSection({
  title,
  description,
  products,
  addingProductId,
  onAdd,
  onNotify,
  accent = 'emerald',
  showIcon = true,
  titleSize = 'default',
}: {
  title: string;
  description: string;
  products: RecommendationProduct[];
  addingProductId: string | null;
  onAdd: (product: RecommendationProduct) => Promise<void>;
  onNotify: (product: RecommendationProduct) => void;
  accent?: 'emerald' | 'violet' | 'amber' | 'neutral';
  showIcon?: boolean;
  titleSize?: 'default' | 'large';
}) {
  const accentClasses = {
    emerald: 'border-emerald-400/20 from-emerald-500/10',
    violet: 'border-violet-400/20 from-violet-500/10',
    amber: 'border-amber-400/20 from-amber-500/10',
    neutral: 'border-white/10 from-white/[0.04]',
  }[accent];

  return (
    <section className={`rounded-2xl border bg-gradient-to-br ${accentClasses} to-zinc-900/60 p-4 sm:p-5`} data-testid={`recommendation-section-${accent}`}>
      <div className="flex gap-3 mb-4">
        {showIcon && (
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white/80" />
          </div>
        )}
        <div>
          <h2 className={`font-display tracking-wide ${titleSize === 'large' ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg'}`}>{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {products.map(product => (
          <article key={product.id} className="min-w-[82%] snap-start rounded-xl bg-black/25 border border-white/5 p-3 sm:min-w-0">
            <Link href={`/urun/${product.slug}`}>
              <div className="aspect-square overflow-hidden rounded-lg bg-zinc-800">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                ) : null}
              </div>
              <h3 className="text-sm font-medium mt-2 line-clamp-2 hover:text-white/80">{product.name}</h3>
            </Link>
            <p className="font-bold text-sm mt-1">{Number(product.basePrice).toLocaleString('tr-TR')} ₺</p>
            {product.defaultVariantLabel && <p className="text-xs text-muted-foreground mt-1">{product.defaultVariantLabel}</p>}
            {product.isOutOfStock ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNotify(product)}
                className="w-full mt-3 border-amber-400/30 text-amber-200 hover:bg-amber-400/10"
                data-testid={`button-notify-${product.id}`}
              >
                <Bell className="w-3.5 h-3.5 mr-1.5" />
                HABER VER
              </Button>
            ) : product.requiresVariant && !product.defaultVariantId ? (
              <Link href={`/urun/${product.slug}`}>
                <Button size="sm" variant="outline" className="w-full mt-3">İNCELE</Button>
              </Link>
            ) : (
              <Button
                size="sm"
                onClick={() => onAdd(product)}
                disabled={addingProductId === product.id}
                className="w-full mt-3 bg-white text-black hover:bg-white/90"
                data-testid={`button-add-recommendation-${product.id}`}
              >
                {addingProductId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-3.5 h-3.5 mr-1.5" />SEPETE EKLE</>}
              </Button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
