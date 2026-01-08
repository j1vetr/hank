import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Package, ShoppingCart, Grid3x3, LogOut } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  categoryId: string;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders'>('products');
  const queryClient = useQueryClient();

  const { data: adminUser, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/admin/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      return response.json();
    },
    enabled: activeTab === 'products',
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      return response.json();
    },
    enabled: activeTab === 'categories',
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders');
      return response.json();
    },
    enabled: activeTab === 'orders',
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => {
      setLocation('/toov-admin/login');
    },
  });

  useEffect(() => {
    if (!userLoading && !adminUser) {
      setLocation('/toov-admin/login');
    }
  }, [adminUser, userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl tracking-wide">HANK ADMIN</h1>
            <p className="text-sm text-muted-foreground">Hoşgeldin, {adminUser.username}</p>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent rounded transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'products'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-products"
          >
            <Package className="w-4 h-4" />
            Ürünler ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-categories"
          >
            <Grid3x3 className="w-4 h-4" />
            Kategoriler ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="tab-orders"
          >
            <ShoppingCart className="w-4 h-4" />
            Siparişler ({orders.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Ürünler</h2>
              <button
                onClick={() => setLocation('/toov-admin/products/new')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4" />
                Yeni Ürün
              </button>
            </div>

            <div className="bg-card border border-border rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Ürün</th>
                    <th className="text-left px-6 py-4 font-medium">Kategori</th>
                    <th className="text-left px-6 py-4 font-medium">Fiyat</th>
                    <th className="text-left px-6 py-4 font-medium">Durum</th>
                    <th className="text-right px-6 py-4 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-border hover:bg-muted/30" data-testid={`row-product-${product.id}`}>
                      <td className="px-6 py-4">{product.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {categories.find(c => c.id === product.categoryId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">{product.basePrice} TL</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {product.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setLocation(`/toov-admin/products/${product.id}`)}
                            className="p-2 hover:bg-accent rounded transition-colors"
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Henüz ürün eklenmemiş
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Kategoriler</h2>
              <button
                onClick={() => setLocation('/toov-admin/categories/new')}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                data-testid="button-add-category"
              >
                <Plus className="w-4 h-4" />
                Yeni Kategori
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-card border border-border p-6 rounded hover:border-primary transition-colors" data-testid={`card-category-${category.id}`}>
                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Slug: {category.slug}</p>
                  <button
                    onClick={() => setLocation(`/toov-admin/categories/${category.id}`)}
                    className="text-sm text-primary hover:underline"
                    data-testid={`button-edit-category-${category.id}`}
                  >
                    Düzenle
                  </button>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  Henüz kategori eklenmemiş
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Siparişler</h2>

            <div className="bg-card border border-border rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Sipariş No</th>
                    <th className="text-left px-6 py-4 font-medium">Müşteri</th>
                    <th className="text-left px-6 py-4 font-medium">Toplam</th>
                    <th className="text-left px-6 py-4 font-medium">Durum</th>
                    <th className="text-left px-6 py-4 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-border hover:bg-muted/30" data-testid={`row-order-${order.id}`}>
                      <td className="px-6 py-4 font-mono">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{order.total} TL</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-500">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        Henüz sipariş yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
