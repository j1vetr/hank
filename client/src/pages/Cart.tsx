import { Link } from 'wouter';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
}

const FREE_SHIPPING_THRESHOLD = 2000;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse">Yükleniyor...</div>
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
            SEPETİM
          </h1>

          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-medium mb-4">Sepetiniz boş</h2>
              <p className="text-muted-foreground mb-8">
                Alışverişe başlamak için ürünleri keşfedin
              </p>
              <Link href="/">
                <Button data-testid="button-continue-shopping">
                  ALIŞVERİŞE DEVAM ET
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {remainingForFreeShipping > 0 && (
                  <div className="bg-accent/30 border border-border rounded-lg p-4 text-center">
                    <p className="text-sm">
                      Ücretsiz kargo için <span className="font-bold">{remainingForFreeShipping.toFixed(2)} TL</span> daha harcayın!
                    </p>
                    <div className="mt-2 h-2 bg-border rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-foreground transition-all duration-300"
                        style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {cartItemsWithProducts.map((item) => (
                  <div 
                    key={item.id}
                    className="flex gap-4 p-4 bg-card border border-border rounded-lg"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="w-24 h-24 bg-accent rounded-lg overflow-hidden shrink-0">
                      {item.product?.images?.[0] && (
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/urun/${item.product?.slug}`}>
                        <h3 className="font-medium truncate hover:underline" data-testid={`text-product-name-${item.id}`}>
                          {item.product?.name || 'Ürün'}
                        </h3>
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.variant.size && `Beden: ${item.variant.size}`}
                          {item.variant.color && ` / Renk: ${item.variant.color}`}
                        </p>
                      )}
                      <p className="font-bold mt-2" data-testid={`text-price-${item.id}`}>
                        {parseFloat(item.variant?.price || item.product?.basePrice || '0').toFixed(2)} TL
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-accent transition-colors"
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-border rounded-lg hover:bg-accent transition-colors"
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="font-display text-xl tracking-wider mb-6">
                    SİPARİŞ ÖZETİ
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ara Toplam ({totalItems} ürün)</span>
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

                  <Link href="/odeme">
                    <Button className="w-full h-12 mt-6 text-sm tracking-wider" data-testid="button-checkout">
                      ÖDEMEYE GEÇ
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button variant="ghost" className="w-full mt-2 text-sm" data-testid="button-continue">
                      Alışverişe Devam Et
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
