import { useState } from 'react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  createdAt: string;
  total: string;
  shippingCost: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
  items: Array<{
    id: string;
    productName: string;
    variantDetails: string;
    quantity: number;
    subtotal: string;
  }>;
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  icon: React.ElementType; 
  bg: string;
  description: string;
  step: number;
}> = {
  pending: { 
    label: 'Beklemede', 
    color: 'text-yellow-400', 
    icon: Clock, 
    bg: 'bg-yellow-400/10',
    description: 'Siparişiniz onay bekliyor',
    step: 1
  },
  processing: { 
    label: 'Hazırlanıyor', 
    color: 'text-blue-400', 
    icon: Package, 
    bg: 'bg-blue-400/10',
    description: 'Siparişiniz hazırlanıyor',
    step: 2
  },
  shipped: { 
    label: 'Kargoda', 
    color: 'text-purple-400', 
    icon: Truck, 
    bg: 'bg-purple-400/10',
    description: 'Siparişiniz kargoya verildi',
    step: 3
  },
  completed: { 
    label: 'Teslim Edildi', 
    color: 'text-green-400', 
    icon: CheckCircle2, 
    bg: 'bg-green-400/10',
    description: 'Siparişiniz teslim edildi',
    step: 4
  },
  cancelled: { 
    label: 'İptal Edildi', 
    color: 'text-red-400', 
    icon: XCircle, 
    bg: 'bg-red-400/10',
    description: 'Sipariş iptal edildi',
    step: 0
  },
};

const steps = [
  { id: 1, label: 'Onaylandı', icon: CheckCircle2 },
  { id: 2, label: 'Hazırlanıyor', icon: Package },
  { id: 3, label: 'Kargoda', icon: Truck },
  { id: 4, label: 'Teslim Edildi', icon: MapPin },
];

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      setError('Sipariş numarası girin');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const params = new URLSearchParams({ orderNumber: orderNumber.trim() });
      if (email.trim()) {
        params.append('email', email.trim());
      }
      
      const res = await fetch(`/api/orders/track?${params.toString()}`);
      const data = await res.json();
      
      if (res.ok) {
        setOrder(data);
      } else {
        setError(data.error || 'Sipariş bulunamadı');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = order ? statusConfig[order.status] || statusConfig.pending : null;
  const currentStep = currentStatus?.step || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-display text-3xl sm:text-4xl tracking-wide mb-4" data-testid="text-page-title">
              SİPARİŞ TAKİP
            </h1>
            <p className="text-muted-foreground">
              Sipariş numaranızı girerek siparişinizin durumunu öğrenin
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch}
            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8"
          >
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Sipariş Numarası *
                </label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="HANK-XXXXXX"
                  className="h-12 bg-zinc-800 border-zinc-700 focus:border-white"
                  data-testid="input-order-number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  E-posta (Opsiyonel)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="h-12 bg-zinc-800 border-zinc-700 focus:border-white"
                  data-testid="input-email"
                />
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold tracking-wide"
              data-testid="button-search-order"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  SİPARİŞİMİ BUL
                </>
              )}
            </Button>
          </motion.form>

          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Sipariş #{order.orderNumber}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {currentStatus && (
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${currentStatus.bg} ${currentStatus.color}`}>
                      <currentStatus.icon className="w-4 h-4" />
                      {currentStatus.label}
                    </span>
                  )}
                </div>

                {order.status !== 'cancelled' && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center relative">
                      <div className="absolute left-0 right-0 top-1/2 h-1 bg-zinc-800 -translate-y-1/2 z-0" />
                      <div 
                        className="absolute left-0 top-1/2 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                      />
                      {steps.map((step, index) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        const StepIcon = step.icon;
                        return (
                          <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted ? 'bg-green-500 text-white' :
                              isCurrent ? 'bg-white text-black' :
                              'bg-zinc-800 text-zinc-500'
                            }`}>
                              <StepIcon className="w-5 h-5" />
                            </div>
                            <span className={`text-xs mt-2 ${
                              isCompleted || isCurrent ? 'text-white' : 'text-zinc-500'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {order.trackingNumber && (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6">
                    <p className="text-sm text-zinc-400 mb-1">Kargo Takip Numarası</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-mono font-bold text-white">
                        {order.trackingNumber}
                      </p>
                      {order.trackingUrl && (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
                        >
                          Kargo Takibi
                        </a>
                      )}
                    </div>
                    {order.shippingCarrier && (
                      <p className="text-sm text-zinc-500 mt-1">{order.shippingCarrier}</p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Ürünler</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                        <div>
                          <p className="font-medium text-white">{item.productName}</p>
                          {item.variantDetails && (
                            <p className="text-sm text-zinc-500">{item.variantDetails}</p>
                          )}
                          <p className="text-sm text-zinc-400">Adet: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-white">{item.subtotal}₺</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Teslimat Adresi</h3>
                      <div className="p-4 bg-zinc-800/50 rounded-xl">
                        <p className="text-white">{order.customerName}</p>
                        <p className="text-zinc-400">{order.shippingAddress.address}</p>
                        <p className="text-zinc-400">
                          {order.shippingAddress.district}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">Özet</h3>
                      <div className="p-4 bg-zinc-800/50 rounded-xl space-y-2">
                        <div className="flex justify-between text-zinc-400">
                          <span>Kargo</span>
                          <span>{parseFloat(order.shippingCost) === 0 ? 'Ücretsiz' : `${order.shippingCost}₺`}</span>
                        </div>
                        <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-zinc-700">
                          <span>Toplam</span>
                          <span>{order.total}₺</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
