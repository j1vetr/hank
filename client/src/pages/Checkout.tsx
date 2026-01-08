import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, CreditCard, Truck, Shield, 
  RotateCcw, Check, ArrowRight, ShoppingBag, ChevronRight,
  Package, Lock
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
}

const FREE_SHIPPING_THRESHOLD = 2500;

const steps = [
  { id: 1, title: 'Bilgiler', icon: User },
  { id: 2, title: 'Teslimat', icon: MapPin },
  { id: 3, title: 'Ödeme', icon: CreditCard },
];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const [formData, setFormData] = useState({
    customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    customerEmail: user?.email || '',
    customerPhone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
  });

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49.90;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast({ 
        title: 'Hata', 
        description: 'Sepetiniz boş',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          shippingAddress: {
            address: formData.address,
            city: formData.city,
            district: formData.district,
            postalCode: formData.postalCode,
          },
          subtotal: subtotal.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: 'Kapıda Ödeme',
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Sipariş oluşturulamadı');
      }

      const order = await res.json();
      toast({ 
        title: 'Sipariş Alındı!', 
        description: `Sipariş numaranız: ${order.orderNumber}` 
      });
      navigate('/');
    } catch (error: any) {
      toast({ 
        title: 'Hata', 
        description: error.message || 'Sipariş oluşturulamadı',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="font-display text-3xl tracking-wider mb-4">
              SEPETİNİZ BOŞ
            </h1>
            <p className="text-muted-foreground mb-8">
              Ödeme yapabilmek için önce sepetinize ürün eklemelisiniz.
            </p>
            <Link href="/">
              <Button className="h-12 px-8 bg-white text-black hover:bg-white/90 font-bold tracking-wide group">
                ALIŞVERİŞE BAŞLA
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
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

      <main className="pt-28 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-6"
          >
            <Link href="/">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/sepet">Sepet</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Ödeme</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-6" data-testid="text-page-title">
              ÖDEME
            </h1>
            
            <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${
                      currentStep === step.id 
                        ? 'bg-white text-black' 
                        : currentStep > step.id
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-px mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <h2 className="font-display text-xl tracking-wide">
                          İLETİŞİM BİLGİLERİ
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerName" className="text-sm font-medium">Ad Soyad *</Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="customerName"
                              name="customerName"
                              value={formData.customerName}
                              onChange={handleChange}
                              required
                              data-testid="input-customerName"
                              className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                              placeholder="Adınız Soyadınız"
                            />
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerEmail" className="text-sm font-medium">E-posta *</Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="customerEmail"
                                name="customerEmail"
                                type="email"
                                value={formData.customerEmail}
                                onChange={handleChange}
                                required
                                data-testid="input-customerEmail"
                                className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                                placeholder="ornek@email.com"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="customerPhone" className="text-sm font-medium">Telefon *</Label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                id="customerPhone"
                                name="customerPhone"
                                type="tel"
                                value={formData.customerPhone}
                                onChange={handleChange}
                                required
                                data-testid="input-customerPhone"
                                className="h-12 pl-11 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                                placeholder="05XX XXX XX XX"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="mt-6">
                        <Button 
                          type="button" 
                          onClick={() => setCurrentStep(2)}
                          className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group rounded-lg"
                        >
                          DEVAM ET
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className="font-display text-xl tracking-wide">
                          TESLİMAT ADRESİ
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-medium">Adres *</Label>
                          <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Sokak, Mahalle, Bina No, Daire No"
                            required
                            data-testid="input-address"
                            className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-sm font-medium">İl *</Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              required
                              data-testid="input-city"
                              className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                              placeholder="İstanbul"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="district" className="text-sm font-medium">İlçe *</Label>
                            <Input
                              id="district"
                              name="district"
                              value={formData.district}
                              onChange={handleChange}
                              required
                              data-testid="input-district"
                              className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                              placeholder="Kadıköy"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="postalCode" className="text-sm font-medium">Posta Kodu</Label>
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            data-testid="input-postalCode"
                            className="h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                            placeholder="34000"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                          className="flex-1 h-12 border-white/20 hover:bg-white/5 rounded-lg"
                        >
                          Geri
                        </Button>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
                          <Button 
                            type="button" 
                            onClick={() => setCurrentStep(3)}
                            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group rounded-lg"
                          >
                            DEVAM ET
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <h2 className="font-display text-xl tracking-wide">
                          ÖDEME YÖNTEMİ
                        </h2>
                      </div>
                      
                      <div className="space-y-3">
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border-2 border-amber-500/30 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">Kapıda Ödeme</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Nakit veya kredi kartı ile ödeme
                              </p>
                            </div>
                            <span className="text-xs text-amber-400 font-medium px-2 py-1 bg-amber-500/10 rounded">
                              Önerilen
                            </span>
                          </div>
                        </motion.div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 opacity-50 cursor-not-allowed">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                            <div className="flex-1">
                              <span className="font-medium">Kredi Kartı</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Yakında aktif olacak
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-400">Güvenli Alışveriş</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Tüm bilgileriniz güvenli bir şekilde korunmaktadır.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setCurrentStep(2)}
                          className="flex-1 h-12 border-white/20 hover:bg-white/5 rounded-lg"
                        >
                          Geri
                        </Button>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1">
                          <Button 
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold tracking-wide group rounded-lg"
                            data-testid="button-place-order"
                          >
                            {loading ? 'SİPARİŞ VERİLİYOR...' : 'SİPARİŞİ TAMAMLA'}
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            <div className="lg:col-span-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-zinc-900 via-zinc-800/80 to-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-24"
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none" />
                
                <h2 className="font-display text-lg tracking-wide mb-4 relative">
                  SİPARİŞ ÖZETİ
                </h2>

                <div className="space-y-3 pb-4 border-b border-white/5 relative max-h-48 overflow-y-auto">
                  {cartItemsWithProducts.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                        {item.product?.images?.[0] && (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.product?.name || 'Ürün'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Adet: {item.quantity}</p>
                        <p className="text-sm font-bold mt-1">
                          {(parseFloat(item.variant?.price || item.product?.basePrice || '0') * item.quantity).toLocaleString('tr-TR')} ₺
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm py-4 relative">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span data-testid="text-subtotal">{subtotal.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kargo</span>
                    <span data-testid="text-shipping" className={shippingCost === 0 ? 'text-green-400 font-medium' : ''}>
                      {shippingCost === 0 ? 'ÜCRETSİZ' : `${shippingCost.toFixed(2)} ₺`}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Toplam</span>
                    <span className="font-bold text-xl" data-testid="text-total">{total.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5 relative">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 shrink-0 text-green-400" />
                    <span>Güvenli ödeme</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span>Hızlı teslimat (2-4 iş günü)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>14 gün ücretsiz iade</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
