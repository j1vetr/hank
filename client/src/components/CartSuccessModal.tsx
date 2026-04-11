import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

interface CartSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    image: string;
    price: number;
    size?: string;
    quantity: number;
  } | null;
  cartTotal: number;
  cartItemCount: number;
}

const FREE_SHIPPING_THRESHOLD = 2500;

export function CartSuccessModal({ isOpen, onClose, product, cartTotal, cartItemCount }: CartSuccessModalProps) {
  if (!product) return null;

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const shippingProgress = Math.min((cartTotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg px-4"
          >
            <div className="relative pt-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/25 z-10"
              >
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </motion.div>

              <div className="relative bg-white border border-black/8 rounded-xl overflow-hidden shadow-xl shadow-black/8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-black/4 hover:bg-black/8 flex items-center justify-center transition-colors z-10 rounded-full"
                  data-testid="button-close-modal"
                >
                  <X className="w-4 h-4 text-black/50" />
                </button>

                <div className="pt-10 pb-6 px-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-6"
                  >
                    <h3 className="font-display text-xl tracking-wide mb-1 text-black">SEPETE EKLENDİ</h3>
                    <p className="text-sm text-black/40">Harika seçim!</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-4 bg-stone-50 rounded-lg p-4 border border-black/6"
                  >
                    <div className="relative w-24 h-28 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                      <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-medium text-sm leading-snug line-clamp-2 mb-2 text-black" data-testid="text-modal-product-name">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-black/45 mb-2">
                        {product.size && (
                          <span className="px-2 py-0.5 bg-black/5 rounded text-black/60">Beden: {product.size}</span>
                        )}
                        <span className="px-2 py-0.5 bg-black/5 rounded text-black/60">Adet: {product.quantity}</span>
                      </div>
                      <p className="font-bold text-lg text-black" data-testid="text-modal-price">
                        {product.price.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4"
                  >
                    {remainingForFreeShipping > 0 ? (
                      <div className="bg-amber-50 border border-amber-200/70 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-black/60">
                            Ücretsiz kargo için <span className="font-bold text-amber-600">{remainingForFreeShipping.toFixed(0)} TL</span> daha ekleyin!
                          </span>
                        </div>
                        <div className="h-1.5 bg-black/6 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shippingProgress}%` }}
                            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200/70 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            Ücretsiz kargo kazandınız!
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between mt-4 py-3 border-t border-black/6"
                  >
                    <div className="flex items-center gap-2 text-sm text-black/40">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Sepetinizde {cartItemCount} ürün</span>
                    </div>
                    <span className="font-bold text-black">{cartTotal.toLocaleString('tr-TR')} ₺</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex gap-3 mt-4"
                  >
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1 h-12 border-black/15 text-black hover:bg-black/4 rounded-none"
                      data-testid="button-continue-shopping"
                    >
                      Alışverişe Devam Et
                    </Button>
                    <Link href="/sepet" onClick={onClose} className="flex-1">
                      <Button
                        className="w-full h-12 bg-black text-white hover:bg-black/85 font-bold tracking-wide group rounded-none"
                        data-testid="button-go-to-cart"
                      >
                        Sepete Git
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-3"
                  >
                    <Link href="/odeme" onClick={onClose} className="block">
                      <Button
                        variant="ghost"
                        className="w-full h-10 text-sm text-black/35 hover:text-black hover:bg-transparent"
                        data-testid="button-go-to-checkout"
                      >
                        ÖDEMEYE GEÇ
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent origin-left"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
