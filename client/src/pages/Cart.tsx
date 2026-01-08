import { Link } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, ShoppingBag, Truck, Shield, RotateCcw, ArrowRight, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
}

const FREE_SHIPPING_THRESHOLD = 2500;

export default function Cart() {
  const { items, isLoading, updateQuantity, removeItem, totalItems, subtotal } = useCart();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
  });

  const cartItemsWithProducts = items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  });

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49.90;
  const total = subtotal + shippingCost;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

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
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-transparent to-transparent h-64 pointer-events-none" />
        <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
      </div>

      <main className="pt-36 pb-20 px-6 relative z-10">
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
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
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

                <AnimatePresence mode="popLayout">
                  {cartItemsWithProducts.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
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
                            {item.variant && (
                              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2">
                                {item.variant.size && (
                                  <span className="px-2 py-0.5 bg-white/5 rounded">Beden: {item.variant.size}</span>
                                )}
                                {item.variant.color && (
                                  <span className="px-2 py-0.5 bg-white/5 rounded">{item.variant.color}</span>
                                )}
                              </p>
                            )}
                          </div>

                          <div className="flex items-end justify-between mt-3">
                            <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <span className="w-8 text-center text-sm font-medium" data-testid={`text-quantity-${item.id}`}>
                                {item.quantity}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-lg" data-testid={`text-price-${item.id}`}>
                                {(parseFloat(item.variant?.price || item.product?.basePrice || '0') * item.quantity).toLocaleString('tr-TR')} ₺
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  Adet: {parseFloat(item.variant?.price || item.product?.basePrice || '0').toLocaleString('tr-TR')} ₺
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
              </div>

              <div className="lg:col-span-1">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-zinc-900 via-zinc-800/80 to-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24"
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
                      <span>Güvenli ödeme</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>14 gün ücretsiz iade</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Package className="w-4 h-4 shrink-0" />
                      <span>Hızlı teslimat (2-4 iş günü)</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
