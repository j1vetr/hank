import { useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const FREE_SHIPPING_THRESHOLD = 2000;

export default function Checkout() {
  const [, navigate] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-display text-4xl tracking-wider mb-8">
              SEPETİNİZ BOŞ
            </h1>
            <Button onClick={() => navigate('/')}>
              ALIŞVERİŞE BAŞLA
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl tracking-wider text-center mb-8" data-testid="text-page-title">
            ÖDEME
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-lg tracking-wider mb-4">
                    İLETİŞİM BİLGİLERİ
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Ad Soyad *</Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleChange}
                        required
                        data-testid="input-customerName"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerEmail">E-posta *</Label>
                        <Input
                          id="customerEmail"
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          required
                          data-testid="input-customerEmail"
                          className="bg-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone">Telefon *</Label>
                        <Input
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          required
                          data-testid="input-customerPhone"
                          className="bg-background border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-lg tracking-wider mb-4">
                    TESLİMAT ADRESİ
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Sokak, Mahalle, Bina No, Daire No"
                        required
                        data-testid="input-address"
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">İl *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          required
                          data-testid="input-city"
                          className="bg-background border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">İlçe *</Label>
                        <Input
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          required
                          data-testid="input-district"
                          className="bg-background border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Posta Kodu</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        data-testid="input-postalCode"
                        className="bg-background border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-display text-lg tracking-wider mb-4">
                    ÖDEME YÖNTEMİ
                  </h2>
                  
                  <div className="p-4 bg-accent/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-foreground flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-foreground" />
                      </div>
                      <span className="font-medium">Kapıda Ödeme</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 ml-7">
                      Siparişinizi teslim alırken nakit veya kredi kartı ile ödeme yapabilirsiniz.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-sm tracking-wider"
                  disabled={loading}
                  data-testid="button-place-order"
                >
                  {loading ? 'SİPARİŞ VERİLİYOR...' : 'SİPARİŞİ TAMAMLA'}
                </Button>
              </form>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h2 className="font-display text-lg tracking-wider mb-4">
                  SİPARİŞ ÖZETİ
                </h2>

                <div className="space-y-3 text-sm border-b border-border pb-4 mb-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex justify-between">
                      <span className="text-muted-foreground truncate mr-2">
                        {item.quantity}x Ürün #{index + 1}
                      </span>
                      <span>{(parseFloat(item.variant?.price || '0') * item.quantity).toFixed(2)} TL</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span data-testid="text-subtotal">{subtotal.toFixed(2)} TL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kargo</span>
                    <span data-testid="text-shipping" className={shippingCost === 0 ? 'text-green-500' : ''}>
                      {shippingCost === 0 ? 'ÜCRETSİZ' : `${shippingCost.toFixed(2)} TL`}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-base">
                    <span>Toplam</span>
                    <span data-testid="text-total">{total.toFixed(2)} TL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
