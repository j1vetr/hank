import { useState, useEffect } from 'react';
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
  Package, Lock, ClipboardCheck, Edit3, AlertCircle, Loader2,
  CheckCircle2, UserPlus
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
  { id: 1, title: 'İletişim', icon: User },
  { id: 2, title: 'Teslimat', icon: MapPin },
  { id: 3, title: 'Ödeme', icon: CreditCard },
  { id: 4, title: 'Onay', icon: ClipboardCheck },
];

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [createAccount, setCreateAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});

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
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
      }));
    }
  }, [user]);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49.90;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStepErrors({});
  };

  const validateStep = (step: number): boolean => {
    const errors: string[] = [];
    
    if (step === 1) {
      if (!formData.customerName.trim()) errors.push('Ad Soyad gerekli');
      if (!formData.customerEmail.trim()) errors.push('E-posta gerekli');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) errors.push('Geçerli bir e-posta girin');
      if (!formData.customerPhone.trim()) errors.push('Telefon gerekli');
    }
    
    if (step === 2) {
      if (!formData.address.trim()) errors.push('Adres gerekli');
      if (!formData.city.trim()) errors.push('İl gerekli');
      if (!formData.district.trim()) errors.push('İlçe gerekli');
    }

    if (errors.length > 0) {
      setStepErrors({ [step]: errors });
      return false;
    }
    return true;
  };

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      return;
    }
    
    for (let i = 1; i < step; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }
    setCurrentStep(step);
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
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
          paymentMethod: paymentMethod === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı',
          createAccount: createAccount && !user,
          accountPassword: createAccount && !user ? accountPassword : undefined,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Sipariş oluşturulamadı');
      }

      const order = await res.json();
      setOrderNumber(order.orderNumber);
      setOrderComplete(true);
      clearCart();
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

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-36 pb-20 px-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="font-display text-3xl tracking-wider mb-4" data-testid="text-order-success">
              SİPARİŞİNİZ ALINDI!
            </h1>
            <p className="text-muted-foreground mb-2">
              Siparişiniz başarıyla oluşturuldu.
            </p>
            <p className="text-lg font-mono font-bold text-white mb-8">
              Sipariş No: #{orderNumber}
            </p>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-white mb-4">Sipariş Detayları</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-posta</span>
                  <span>{formData.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teslimat Adresi</span>
                  <span className="text-right">{formData.district}, {formData.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödeme Yöntemi</span>
                  <span>{paymentMethod === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı'}</span>
                </div>
                <div className="h-px bg-zinc-800 my-3" />
                <div className="flex justify-between font-semibold">
                  <span>Toplam</span>
                  <span>{total.toLocaleString('tr-TR')} ₺</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              Sipariş onayı <strong>{formData.customerEmail}</strong> adresine gönderilecektir.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {user ? (
                <Link href="/hesabim" className="flex-1">
                  <Button className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 font-bold tracking-wide">
                    SİPARİŞLERİM
                  </Button>
                </Link>
              ) : null}
              <Link href="/" className="flex-1">
                <Button className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group">
                  ALIŞVERİŞE DEVAM ET
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-36 pb-20 px-6">
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

      <main className="pt-36 pb-20 px-6 relative z-10">
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
            
            <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-2xl mx-auto px-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 sm:flex-none">
                  <motion.button 
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => goToStep(step.id)}
                    disabled={step.id > currentStep + 1}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full transition-all w-full sm:w-auto ${
                      currentStep === step.id 
                        ? 'bg-white text-black' 
                        : currentStep > step.id
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10'
                    } ${step.id > currentStep + 1 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    data-testid={`step-${step.id}`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    ) : (
                      <step.icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium truncate">{step.title}</span>
                  </motion.button>
                  {index < steps.length - 1 && (
                    <div className={`w-2 sm:w-6 h-px mx-0.5 sm:mx-1 shrink-0 ${currentStep > step.id ? 'bg-green-500' : 'bg-white/10'}`} />
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
                        <div>
                          <h2 className="font-display text-xl tracking-wide">
                            İLETİŞİM BİLGİLERİ
                          </h2>
                          {!user && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Hesap oluşturmadan devam edebilirsiniz
                            </p>
                          )}
                        </div>
                      </div>

                      {!user && (
                        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                          <div className="flex items-start gap-3">
                            <UserPlus className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-400">Zaten üye misiniz?</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Link href="/giris" className="text-blue-400 hover:underline">Giriş yapın</Link> ve bilgilerinizi otomatik doldurun.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {stepErrors[1] && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-400">
                              {stepErrors[1].map((err, i) => <p key={i}>{err}</p>)}
                            </div>
                          </div>
                        </div>
                      )}
                      
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
                          onClick={handleNextStep}
                          className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group rounded-lg"
                          data-testid="button-next-step1"
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

                      {stepErrors[2] && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-400">
                              {stepErrors[2].map((err, i) => <p key={i}>{err}</p>)}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-medium">Adres *</Label>
                          <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Sokak, Mahalle, Bina No, Daire No"
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
                            onClick={handleNextStep}
                            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group rounded-lg"
                            data-testid="button-next-step2"
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
                        <motion.button 
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setPaymentMethod('cash_on_delivery')}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            paymentMethod === 'cash_on_delivery'
                              ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                          data-testid="payment-cash"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === 'cash_on_delivery' ? 'border-amber-400' : 'border-white/30'
                            }`}>
                              {paymentMethod === 'cash_on_delivery' && (
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">Kapıda Ödeme</span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Nakit veya kredi kartı ile ödeme
                              </p>
                            </div>
                            {paymentMethod === 'cash_on_delivery' && (
                              <span className="text-xs text-amber-400 font-medium px-2 py-1 bg-amber-500/10 rounded">
                                Seçili
                              </span>
                            )}
                          </div>
                        </motion.button>

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
                            type="button"
                            onClick={handleNextStep}
                            className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide group rounded-lg"
                            data-testid="button-next-step3"
                          >
                            SİPARİŞİ İNCELE
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <h2 className="font-display text-xl tracking-wide">
                            SİPARİŞ ÖZETİ
                          </h2>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-start gap-3">
                              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">İletişim</p>
                                <p className="font-medium">{formData.customerName}</p>
                                <p className="text-sm text-muted-foreground">{formData.customerEmail}</p>
                                <p className="text-sm text-muted-foreground">{formData.customerPhone}</p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setCurrentStep(1)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Teslimat Adresi</p>
                                <p className="font-medium">{formData.address}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formData.district}, {formData.city} {formData.postalCode}
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setCurrentStep(2)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-start justify-between p-4 bg-zinc-800/50 rounded-xl">
                            <div className="flex items-start gap-3">
                              <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Ödeme Yöntemi</p>
                                <p className="font-medium">
                                  {paymentMethod === 'cash_on_delivery' ? 'Kapıda Ödeme' : 'Kredi Kartı'}
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setCurrentStep(3)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6">
                        <h3 className="font-semibold mb-4">Ürünler</h3>
                        <div className="space-y-3">
                          {cartItemsWithProducts.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3 bg-zinc-800/50 rounded-xl">
                              <div className="w-16 h-20 bg-zinc-700 rounded-lg overflow-hidden shrink-0">
                                {item.product?.images?.[0] && (
                                  <img 
                                    src={item.product.images[0]} 
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product?.name || 'Ürün'}</p>
                                {item.variant && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.variant.size && `Beden: ${item.variant.size}`}
                                    {item.variant.color && ` | Renk: ${item.variant.color}`}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm text-muted-foreground">Adet: {item.quantity}</span>
                                  <span className="font-bold">
                                    {(parseFloat(item.variant?.price || item.product?.basePrice || '0') * item.quantity).toLocaleString('tr-TR')} ₺
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {!user && (
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-white/10 rounded-2xl p-6">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id="createAccount"
                              checked={createAccount}
                              onChange={(e) => setCreateAccount(e.target.checked)}
                              className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-white focus:ring-white"
                              data-testid="checkbox-create-account"
                            />
                            <div className="flex-1">
                              <label htmlFor="createAccount" className="font-medium cursor-pointer">
                                Hesap oluştur
                              </label>
                              <p className="text-sm text-muted-foreground mt-1">
                                Siparişlerinizi takip edin ve bir sonraki alışverişinizde bilgilerinizi yeniden girmek zorunda kalmayın.
                              </p>
                              
                              {createAccount && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-4"
                                >
                                  <Label htmlFor="accountPassword" className="text-sm font-medium">Şifre Oluştur</Label>
                                  <Input
                                    id="accountPassword"
                                    type="password"
                                    value={accountPassword}
                                    onChange={(e) => setAccountPassword(e.target.value)}
                                    placeholder="En az 6 karakter"
                                    className="mt-2 h-12 bg-zinc-900/50 border-white/10 focus:border-white/30 rounded-lg"
                                    data-testid="input-account-password"
                                  />
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setCurrentStep(3)}
                          className="flex-1 h-14 border-white/20 hover:bg-white/5 rounded-xl"
                        >
                          Geri
                        </Button>
                        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-[2]">
                          <Button 
                            type="submit"
                            disabled={loading || (createAccount && accountPassword.length < 6)}
                            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold tracking-wide text-lg group rounded-xl disabled:opacity-50"
                            data-testid="button-place-order"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                SİPARİŞ VERİLİYOR...
                              </>
                            ) : (
                              <>
                                SİPARİŞİ TAMAMLA
                                <span className="ml-2 text-green-200">{total.toLocaleString('tr-TR')} ₺</span>
                              </>
                            )}
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
                  {shippingCost > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {FREE_SHIPPING_THRESHOLD.toLocaleString('tr-TR')} ₺ üzeri siparişlerde kargo ücretsiz!
                    </p>
                  )}
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
