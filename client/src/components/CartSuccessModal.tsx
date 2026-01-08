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

const FREE_SHIPPING_THRESHOLD = 2000;

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg px-4"
          >
            <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </motion.div>

              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
                data-testid="button-close-modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pt-10 pb-6 px-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mb-6"
                >
                  <h3 className="font-display text-xl tracking-wide mb-1">SEPETE EKLENDİ</h3>
                  <p className="text-sm text-muted-foreground">Harika seçim!</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex gap-4 bg-black/30 rounded-xl p-4 border border-white/5"
                >
                  <div className="relative w-24 h-28 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                    <motion.img
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-medium text-sm leading-snug line-clamp-2 mb-2" data-testid="text-modal-product-name">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      {product.size && (
                        <span className="px-2 py-0.5 bg-white/5 rounded">Beden: {product.size}</span>
                      )}
                      <span className="px-2 py-0.5 bg-white/5 rounded">Adet: {product.quantity}</span>
                    </div>
                    <p className="font-bold text-lg" data-testid="text-modal-price">
                      {product.price.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4"
                >
                  {remainingForFreeShipping > 0 ? (
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-amber-400" />
                        <span className="text-xs">
                          Ücretsiz kargo için <span className="font-bold text-amber-400">{remainingForFreeShipping.toFixed(0)} TL</span> daha ekleyin!
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${shippingProgress}%` }}
                          transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">
                          Ücretsiz kargo kazandınız!
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-between mt-4 py-3 border-t border-white/5"
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Sepetinizde {cartItemCount} ürün</span>
                  </div>
                  <span className="font-bold">{cartTotal.toLocaleString('tr-TR')} ₺</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex gap-3 mt-4"
                >
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 h-12 border-white/20 hover:bg-white/5"
                    data-testid="button-continue-shopping"
                  >
                    Alışverişe Devam Et
                  </Button>
                  <Link href="/sepet" className="flex-1">
                    <Button
                      className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group"
                      data-testid="button-go-to-cart"
                    >
                      Sepete Git
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent origin-left"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
