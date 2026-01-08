import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Grid3x3, 
  Users, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  X,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Upload,
  ImageIcon,
  Loader2,
  GripVertical
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  basePrice: string;
  categoryId: string;
  images: string[];
  availableSizes: string[];
  availableColors: { name: string; hex: string }[];
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  displayOrder: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  total: string;
  status: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
}

interface Stats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  price: string;
  stock: number;
}

type TabType = 'dashboard' | 'products' | 'categories' | 'orders' | 'users';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: adminUser, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: async () => {
      const response = await fetch('/api/admin/me');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    },
    retry: false,
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      return response.json();
    },
    enabled: !!adminUser,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const response = await fetch('/api/admin/products');
      return response.json();
    },
    enabled: !!adminUser,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      return response.json();
    },
    enabled: !!adminUser,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders');
      return response.json();
    },
    enabled: !!adminUser,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['admin', 'users', searchQuery],
    queryFn: async () => {
      const url = searchQuery ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}` : '/api/admin/users';
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!adminUser,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      return response.json();
    },
    onSuccess: () => setLocation('/toov-admin/login'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const saveProductMutation = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const method = product.id ? 'PATCH' : 'POST';
      const url = product.id ? `/api/admin/products/${product.id}` : '/api/admin/products';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setShowProductModal(false);
      setEditingProduct(null);
    },
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const method = category.id ? 'PATCH' : 'POST';
      const url = category.id ? `/api/admin/categories/${category.id}` : '/api/admin/categories';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
  });

  useEffect(() => {
    if (!userLoading && !adminUser) {
      setLocation('/toov-admin/login');
    }
  }, [adminUser, userLoading, setLocation]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-lg text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (!adminUser) return null;

  const sidebarItems = [
    { id: 'dashboard' as TabType, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products' as TabType, icon: Package, label: 'Ürünler' },
    { id: 'categories' as TabType, icon: Grid3x3, label: 'Kategoriler' },
    { id: 'orders' as TabType, icon: ShoppingCart, label: 'Siparişler' },
    { id: 'users' as TabType, icon: Users, label: 'Kullanıcılar' },
  ];

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-yellow-500/20 text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'processing': return 'İşleniyor';
      case 'shipped': return 'Kargoda';
      case 'cancelled': return 'İptal';
      default: return 'Beklemede';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <h1 className="font-display text-2xl tracking-wide text-white">HANK</h1>
          <p className="text-xs text-zinc-500 mt-1">Admin Panel</p>
        </div>
        
        <nav className="flex-1 p-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-black'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
              data-testid={`tab-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
              {adminUser.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{adminUser.username}</p>
              <p className="text-xs text-zinc-500">Yönetici</p>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-zinc-900/50 border-b border-zinc-800 px-8 py-6">
          <h2 className="text-2xl font-semibold text-white">
            {sidebarItems.find(i => i.id === activeTab)?.label}
          </h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Package className="w-8 h-8 text-blue-400" />
                    <span className="text-xs text-zinc-500">Toplam</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats?.totalProducts || 0}</p>
                  <p className="text-sm text-zinc-400 mt-1">Ürün</p>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <ShoppingCart className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs text-zinc-500">Toplam</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats?.totalOrders || 0}</p>
                  <p className="text-sm text-zinc-400 mt-1">Sipariş</p>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="w-8 h-8 text-purple-400" />
                    <span className="text-xs text-zinc-500">Toplam</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
                  <p className="text-sm text-zinc-400 mt-1">Kullanıcı</p>
                </div>
                
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                    <span className="text-xs text-zinc-500">Toplam</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{(stats?.totalRevenue || 0).toLocaleString('tr-TR')}₺</p>
                  <p className="text-sm text-zinc-400 mt-1">Gelir</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Son Siparişler</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      Tümü <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{order.orderNumber}</p>
                          <p className="text-sm text-zinc-400">{order.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{order.total}₺</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-center text-zinc-500 py-8">Henüz sipariş yok</p>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Hızlı İstatistikler</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-yellow-400" />
                        <span className="text-zinc-300">Bekleyen Siparişler</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{stats?.pendingOrders || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Grid3x3 className="w-5 h-5 text-blue-400" />
                        <span className="text-zinc-300">Kategoriler</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{stats?.totalCategories || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <span className="text-zinc-300">Aktif Ürünler</span>
                      </div>
                      <span className="text-2xl font-bold text-white">{products.filter(p => p.isActive).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 w-64"
                    data-testid="input-search-products"
                  />
                </div>
                <button
                  onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Ürün
                </button>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Ürün</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Kategori</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Fiyat</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Durum</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t border-zinc-800 hover:bg-zinc-800/30" data-testid={`row-product-${product.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                            )}
                            <div>
                              <p className="font-medium text-white">{product.name}</p>
                              <p className="text-sm text-zinc-500">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                          {categories.find(c => c.id === product.categoryId)?.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-white font-medium">{product.basePrice}₺</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {product.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                            {product.isFeatured && (
                              <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">Öne Çıkan</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              data-testid={`button-edit-product-${product.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) deleteProductMutation.mutate(product.id); }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                              data-testid={`button-delete-product-${product.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          Ürün bulunamadı
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
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                  data-testid="button-add-category"
                >
                  <Plus className="w-4 h-4" />
                  Yeni Kategori
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group" data-testid={`card-category-${category.id}`}>
                    {category.image && (
                      <div className="aspect-video relative overflow-hidden">
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-semibold text-lg text-white mb-2">{category.name}</h3>
                      <p className="text-sm text-zinc-500 mb-4">Slug: {category.slug}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingCategory(category); setShowCategoryModal(true); }}
                          className="flex-1 py-2 text-sm text-center bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-white"
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => { if (confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) deleteCategoryMutation.mutate(category.id); }}
                          className="p-2 bg-zinc-800 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <div className="col-span-full text-center text-zinc-500 py-12">
                    Henüz kategori eklenmemiş
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Sipariş No</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Müşteri</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Toplam</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Durum</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Tarih</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-zinc-800 hover:bg-zinc-800/30" data-testid={`row-order-${order.id}`}>
                        <td className="px-6 py-4 font-mono text-white">{order.orderNumber}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{order.customerName}</p>
                            <p className="text-sm text-zinc-500">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white">{order.total}₺</td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatusMutation.mutate({ id: order.id, status: e.target.value })}
                            className={`px-3 py-1 rounded text-sm bg-transparent border border-zinc-700 focus:outline-none cursor-pointer ${getStatusColor(order.status)}`}
                            data-testid={`select-status-${order.id}`}
                          >
                            <option value="pending" className="bg-zinc-900 text-white">Beklemede</option>
                            <option value="processing" className="bg-zinc-900 text-white">İşleniyor</option>
                            <option value="shipped" className="bg-zinc-900 text-white">Kargoda</option>
                            <option value="completed" className="bg-zinc-900 text-white">Tamamlandı</option>
                            <option value="cancelled" className="bg-zinc-900 text-white">İptal</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <button
                              onClick={() => setViewingOrder(order)}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              data-testid={`button-view-order-${order.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          Henüz sipariş yok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Kullanıcı ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 w-64"
                    data-testid="input-search-users"
                  />
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Kullanıcı</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">E-posta</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Telefon</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Kayıt Tarihi</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/30" data-testid={`row-user-${user.id}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                        <td className="px-6 py-4 text-zinc-400">{user.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm text-zinc-400">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setViewingUser(user)}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              data-testid={`button-view-user-${user.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) deleteUserMutation.mutate(user.id); }}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          Kullanıcı bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={(product) => saveProductMutation.mutate(product)}
          isSaving={saveProductMutation.isPending}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSave={(category) => saveCategoryMutation.mutate(category)}
          isSaving={saveCategoryMutation.isPending}
        />
      )}

      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
        />
      )}

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
        />
      )}
    </div>
  );
}

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

const COLOR_OPTIONS = [
  { name: 'Siyah', hex: '#000000' },
  { name: 'Beyaz', hex: '#FFFFFF' },
  { name: 'Gri', hex: '#6B7280' },
  { name: 'Lacivert', hex: '#1E3A5F' },
  { name: 'Kırmızı', hex: '#EF4444' },
  { name: 'Mavi', hex: '#3B82F6' },
  { name: 'Yeşil', hex: '#22C55E' },
  { name: 'Sarı', hex: '#EAB308' },
  { name: 'Turuncu', hex: '#F97316' },
  { name: 'Mor', hex: '#A855F7' },
  { name: 'Pembe', hex: '#EC4899' },
  { name: 'Kahverengi', hex: '#92400E' },
  { name: 'Bej', hex: '#D4C4A8' },
  { name: 'Bordo', hex: '#7C2D12' },
  { name: 'Antrasit', hex: '#374151' },
  { name: 'Haki', hex: '#6B8E23' },
];

function ProductModal({ 
  product, 
  categories, 
  onClose, 
  onSave, 
  isSaving 
}: { 
  product: Product | null; 
  categories: Category[];
  onClose: () => void; 
  onSave: (product: Partial<Product>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    sku: product?.sku || '',
    basePrice: product?.basePrice || '',
    categoryId: product?.categoryId || '',
    images: product?.images || [] as string[],
    availableSizes: product?.availableSizes || [],
    availableColors: product?.availableColors || [],
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    isNew: product?.isNew ?? false,
  });

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const [previewSize, setPreviewSize] = useState<string | null>(formData.availableSizes[0] || null);
  const [previewColor, setPreviewColor] = useState<{name: string; hex: string} | null>(formData.availableColors[0] || null);
  const [previewImage, setPreviewImage] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const toggleSize = (size: string) => {
    setFormData(prev => {
      const isRemoving = prev.availableSizes.includes(size);
      const newSizes = isRemoving
        ? prev.availableSizes.filter(s => s !== size)
        : [...prev.availableSizes, size];
      
      if (isRemoving && previewSize === size) {
        setPreviewSize(newSizes[0] || null);
      } else if (!isRemoving && newSizes.length === 1) {
        setPreviewSize(size);
      }
      
      return { ...prev, availableSizes: newSizes };
    });
  };

  const toggleColor = (color: { name: string; hex: string }) => {
    setFormData(prev => {
      const isRemoving = prev.availableColors.some(c => c.name === color.name);
      const newColors = isRemoving
        ? prev.availableColors.filter(c => c.name !== color.name)
        : [...prev.availableColors, color];
      
      if (isRemoving && previewColor?.name === color.name) {
        setPreviewColor(newColors[0] || null);
      } else if (!isRemoving && newColors.length === 1) {
        setPreviewColor(color);
      }
      
      return { ...prev, availableColors: newColors };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setPendingFiles(prev => [...prev, ...files]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
    let uploadedUrls: string[] = [];
    
    if (pendingFiles.length > 0) {
      setIsUploading(true);
      try {
        const formDataUpload = new FormData();
        pendingFiles.forEach(file => formDataUpload.append('images', file));
        
        const response = await fetch('/api/admin/upload/products', {
          method: 'POST',
          body: formDataUpload,
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedUrls = data.urls;
          setPendingFiles([]);
        } else {
          setUploadError('Resim yüklenemedi. Lütfen tekrar deneyin.');
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error('Upload failed:', error);
        setUploadError('Resim yüklenemedi. Lütfen tekrar deneyin.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    
    onSave({
      ...product,
      ...formData,
      images: [...formData.images, ...uploadedUrls],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold text-white">
            {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showPreview ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
              data-testid="button-toggle-preview"
            >
              <Eye className="w-4 h-4" />
              Önizleme
            </button>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className={`flex ${showPreview ? 'flex-row' : 'flex-col'}`}>
        <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${showPreview ? 'w-1/2 border-r border-zinc-800' : 'w-full'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Ürün Adı</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                required
                data-testid="input-product-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Stok Kodu (SKU)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                placeholder="Örn: HNK-001"
                data-testid="input-product-sku"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              required
              data-testid="input-product-slug"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              placeholder="Ürün açıklaması..."
              data-testid="input-product-description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Fiyat (₺)</label>
              <input
                type="text"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                required
                data-testid="input-product-price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Kategori</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                required
                data-testid="select-product-category"
              >
                <option value="">Seçin</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Bedenler</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.availableSizes.includes(size)
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                  data-testid={`button-size-${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Renkler</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggleColor(color)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.availableColors.some(c => c.name === color.name)
                      ? 'bg-zinc-700 ring-2 ring-white'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                  data-testid={`button-color-${color.name}`}
                >
                  <span 
                    className="w-4 h-4 rounded-full border border-zinc-600" 
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-zinc-300">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Ürün Resimleri</label>
            
            {uploadError && (
              <div className="mb-3 p-3 bg-red-900/30 border border-red-600 rounded-lg text-red-400 text-sm">
                {uploadError}
              </div>
            )}
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-white bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-upload"
                data-testid="input-product-images"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  Resimleri sürükleyip bırakın veya <span className="text-white underline">seçin</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP (max 10MB)</p>
              </label>
            </div>

            {(formData.images.length > 0 || pendingFiles.length > 0) && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {formData.images.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group aspect-square">
                    <img
                      src={image}
                      alt={`Ürün ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-medium">
                        Ana
                      </span>
                    )}
                  </div>
                ))}
                {pendingFiles.map((file, index) => (
                  <div key={`pending-${index}`} className="relative group aspect-square">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Yeni ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg ring-2 ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => removePendingFile(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">
                      Yeni
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4"
              />
              Öne Çıkan
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-4 h-4"
              />
              Yeni
            </label>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              data-testid="button-save-product"
            >
              {(isSaving || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Yükleniyor...' : isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
        
        {showPreview && (
          <div className="w-1/2 p-6 bg-zinc-950/50 max-h-[calc(90vh-80px)] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-sm py-2 mb-4 -mt-2 z-10">
              <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Müşteri Görünümü Önizlemesi
              </h4>
            </div>
            
            <div className="space-y-6">
              {(formData.images.length > 0 || pendingFiles.length > 0) && (
                <div className="space-y-3">
                  <div className="aspect-[4/5] bg-zinc-800 rounded-xl overflow-hidden">
                    {formData.images[previewImage] ? (
                      <img 
                        src={formData.images[previewImage]} 
                        alt="Önizleme" 
                        className="w-full h-full object-cover"
                      />
                    ) : pendingFiles[0] ? (
                      <img 
                        src={URL.createObjectURL(pendingFiles[0])} 
                        alt="Yeni" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Package className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  {formData.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {formData.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewImage(idx)}
                          className={`w-16 h-20 rounded-lg overflow-hidden shrink-0 transition-all ${
                            previewImage === idx ? 'ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  {formData.sku || 'SKU'}
                </p>
                <h3 className="text-xl font-bold text-white">
                  {formData.name || 'Ürün Adı'}
                </h3>
                <p className="text-2xl font-bold text-white mt-2">
                  {formData.basePrice ? `${parseFloat(formData.basePrice).toLocaleString('tr-TR')} ₺` : '0 ₺'}
                </p>
              </div>
              
              {formData.availableColors.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">
                    Renk: <span className="text-white">{previewColor?.name || formData.availableColors[0]?.name}</span>
                  </p>
                  <div className="flex gap-2">
                    {formData.availableColors.map((color) => {
                      const isSelected = previewColor?.name === color.name || (!previewColor && color.name === formData.availableColors[0]?.name);
                      const isLight = color.hex === '#FFFFFF' || color.hex === '#D4C4A8';
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setPreviewColor(color)}
                          className={`w-8 h-8 rounded-full transition-all ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''} ${isLight ? 'border border-zinc-600' : ''}`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              
              {formData.availableSizes.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">
                    Beden: <span className="text-white">{previewSize || formData.availableSizes[0]}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.availableSizes.map((size) => {
                      const isSelected = previewSize === size || (!previewSize && size === formData.availableSizes[0]);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setPreviewSize(size)}
                          className={`min-w-[48px] h-10 px-3 rounded-lg text-sm font-medium transition-all ${
                            isSelected 
                              ? 'bg-white text-black' 
                              : 'bg-zinc-800 text-white hover:bg-zinc-700'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {formData.description && (
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Açıklama</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {formData.description}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 h-12 bg-white text-black rounded-xl font-bold text-sm"
                  disabled
                >
                  SEPETE EKLE
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <p className="text-xs text-zinc-500">
                  Bu önizleme, müşterilerin ürün sayfasında göreceği görünümü yansıtır. 
                  Kaydet'e tıkladığınızda seçtiğiniz bedenler ve renkler ürün sayfasında görünecektir.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ 
  category, 
  onClose, 
  onSave, 
  isSaving 
}: { 
  category: Category | null; 
  onClose: () => void; 
  onSave: (category: Partial<Category>) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    image: category?.image || '',
    displayOrder: category?.displayOrder || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...category,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold text-white">
            {category ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Kategori Adı</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              required
              data-testid="input-category-name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              required
              data-testid="input-category-slug"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Görsel URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              data-testid="input-category-image"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Sıralama</label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              data-testid="input-category-order"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              data-testid="button-save-category"
            >
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold text-white">Sipariş Detayı</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Sipariş No</p>
              <p className="font-mono text-white">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Tarih</p>
              <p className="text-white">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-zinc-500 mb-1">Müşteri</p>
            <p className="text-white font-medium">{order.customerName}</p>
            <p className="text-zinc-400">{order.customerEmail}</p>
            <p className="text-zinc-400">{order.customerPhone}</p>
          </div>
          
          <div>
            <p className="text-sm text-zinc-500 mb-1">Teslimat Adresi</p>
            <p className="text-zinc-300">{order.shippingAddress}</p>
          </div>
          
          <div className="pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Toplam</span>
              <span className="text-2xl font-bold text-white">{order.total}₺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-semibold text-white">Kullanıcı Detayı</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{user.firstName} {user.lastName}</p>
              <p className="text-zinc-400">{user.email}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500">Telefon</p>
              <p className="text-white">{user.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Kayıt Tarihi</p>
              <p className="text-white">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
