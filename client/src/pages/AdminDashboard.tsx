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
  GripVertical,
  Link2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  BarChart3,
  Warehouse,
  Megaphone,
  Tag,
  Mail,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  FileText,
  MessageSquare,
  Calendar,
  Settings,
  Send,
  Server
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
  shippingAddress: {
    address: string;
    city: string;
    district: string;
    postalCode: string;
  };
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

type TabType = 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'woocommerce' | 'analytics' | 'inventory' | 'marketing' | 'settings';

interface WooSettings {
  id: string;
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isActive: boolean;
  lastSync: string | null;
}

interface WooSyncLog {
  id: string;
  status: string;
  productsImported: number;
  categoriesImported: number;
  imagesDownloaded: number;
  errors: string[];
  startedAt: string;
  completedAt: string | null;
}

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
    { id: 'analytics' as TabType, icon: BarChart3, label: 'Analitik' },
    { id: 'products' as TabType, icon: Package, label: 'Ürünler' },
    { id: 'categories' as TabType, icon: Grid3x3, label: 'Kategoriler' },
    { id: 'inventory' as TabType, icon: Warehouse, label: 'Stok Yönetimi' },
    { id: 'orders' as TabType, icon: ShoppingCart, label: 'Siparişler' },
    { id: 'marketing' as TabType, icon: Megaphone, label: 'Pazarlama' },
    { id: 'users' as TabType, icon: Users, label: 'Kullanıcılar' },
    { id: 'woocommerce' as TabType, icon: Link2, label: 'WooCommerce' },
    { id: 'settings' as TabType, icon: Settings, label: 'Ayarlar' },
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
          <img 
            src="https://toov.com.tr/assets/toov_logo-DODYNPrj.png" 
            alt="TOOV" 
            className="h-8 mb-2"
          />
          <p className="text-xs text-zinc-500">Admin Panel</p>
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

          {activeTab === 'woocommerce' && (
            <WooCommercePanel />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPanel />
          )}

          {activeTab === 'inventory' && (
            <InventoryPanel />
          )}

          {activeTab === 'marketing' && (
            <MarketingPanel />
          )}
          
          {activeTab === 'settings' && (
            <SettingsPanel />
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

function OrderDetailModal({ order, onClose, onRefresh }: { order: Order; onClose: () => void; onRefresh?: () => void }) {
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    // Fetch order details including items
    fetch(`/api/admin/orders/${order.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.items) setOrderItems(data.items);
        if (data.trackingNumber) setTrackingNumber(data.trackingNumber);
        if (data.trackingUrl) setTrackingUrl(data.trackingUrl);
      });
    
    // Fetch order notes
    fetch(`/api/admin/orders/${order.id}/notes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setNotes(data));
  }, [order.id]);

  const handleStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      onRefresh?.();
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingNumber, 
          trackingUrl: trackingUrl || `https://www.dhl.com/tr-tr/home/takip.html?tracking-id=${trackingNumber}`,
          shippingCarrier: 'DHL E-Commerce'
        }),
        credentials: 'include',
      });
      
      // Update status to shipped if tracking is added
      if (status !== 'shipped' && status !== 'delivered') {
        await fetch(`/api/admin/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' }),
          credentials: 'include',
        });
        setStatus('shipped');
      }
      onRefresh?.();
    } catch (error) {
      console.error('Tracking update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
        credentials: 'include',
      });
      setStatus('cancelled');
      setShowCancelConfirm(false);
      onRefresh?.();
    } catch (error) {
      console.error('Cancel order failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
        credentials: 'include',
      });
      const note = await res.json();
      setNotes([note, ...notes]);
      setNewNote('');
    } catch (error) {
      console.error('Add note failed:', error);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Beklemede', color: 'bg-yellow-500' },
    { value: 'processing', label: 'Hazırlanıyor', color: 'bg-blue-500' },
    { value: 'shipped', label: 'Kargoya Verildi', color: 'bg-purple-500' },
    { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-500' },
    { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-semibold text-white">Sipariş Detayı</h3>
            <p className="text-sm text-zinc-400 font-mono">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Müşteri</p>
              <p className="text-white font-medium">{order.customerName}</p>
              <p className="text-zinc-400 text-sm">{order.customerEmail}</p>
              <p className="text-zinc-400 text-sm">{order.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-1">Teslimat Adresi</p>
              <p className="text-zinc-300 text-sm">{order.shippingAddress?.address}</p>
              <p className="text-zinc-400 text-sm">{order.shippingAddress?.district}, {order.shippingAddress?.city}</p>
              <p className="text-zinc-400 text-sm">{order.shippingAddress?.postalCode}</p>
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div>
              <p className="text-sm text-zinc-500 mb-2">Sipariş Kalemleri</p>
              <div className="bg-zinc-800 rounded-lg p-3 space-y-2">
                {orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-white">{item.productName}</p>
                      {item.variantDetails && <p className="text-zinc-400 text-xs">{item.variantDetails}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-white">{item.quantity} x {item.price}₺</p>
                      <p className="text-zinc-400 text-xs">{item.subtotal}₺</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t border-zinc-700">
                <span className="text-zinc-400">Toplam</span>
                <span className="text-xl font-bold text-white">{order.total}₺</span>
              </div>
            </div>
          )}

          {/* Status Management */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-sm text-zinc-500 mb-3">Sipariş Durumu</p>
            <div className="flex gap-3 items-center">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={status === 'cancelled'}
                className="flex-1 px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || status === order.status || status === 'cancelled'}
                className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50"
              >
                Güncelle
              </button>
            </div>
          </div>

          {/* DHL Tracking */}
          <div className="bg-zinc-800/50 rounded-lg p-4">
            <p className="text-sm text-zinc-500 mb-3">DHL E-Commerce Kargo</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Takip Numarası"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none"
              />
              <input
                type="text"
                placeholder="Takip URL (opsiyonel - otomatik oluşturulur)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:outline-none"
              />
              <button
                onClick={handleTrackingUpdate}
                disabled={isUpdating || !trackingNumber}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                Kargoya Ver
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm text-zinc-500 mb-2">Notlar</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Not ekle..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
              >
                Ekle
              </button>
            </div>
            {notes.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-zinc-800 rounded-lg p-2 text-sm">
                    <p className="text-white">{note.content}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(note.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancel Order */}
          {status !== 'cancelled' && status !== 'delivered' && (
            <div className="pt-4 border-t border-zinc-800">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30"
                >
                  Siparişi İptal Et
                </button>
              ) : (
                <div className="space-y-3 bg-red-900/20 p-4 rounded-lg border border-red-600/30">
                  <p className="text-red-400 text-sm">Siparişi iptal etmek istediğinize emin misiniz? Stok otomatik olarak iade edilecektir.</p>
                  <input
                    type="text"
                    placeholder="İptal sebebi (opsiyonel)"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                    >
                      Vazgeç
                    </button>
                    <button
                      onClick={handleCancelOrder}
                      disabled={isUpdating}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [stats, setStats] = useState<{
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string | null;
    products: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${user.id}/stats`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [user.id]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg">
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

          {/* Order Stats */}
          {isLoading ? (
            <div className="text-center py-4 text-zinc-400">Yükleniyor...</div>
          ) : stats && (
            <div className="pt-4 border-t border-zinc-800 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                  <p className="text-xs text-zinc-400">Toplam Sipariş</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.totalSpent.toFixed(2)}₺</p>
                  <p className="text-xs text-zinc-400">Toplam Harcama</p>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-white">
                    {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('tr-TR') : '-'}
                  </p>
                  <p className="text-xs text-zinc-400">Son Sipariş</p>
                </div>
              </div>

              {stats.products.length > 0 && (
                <div>
                  <p className="text-sm text-zinc-500 mb-2">Satın Alınan Ürünler</p>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {stats.products.map((product, index) => (
                      <span key={index} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full">
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WooCommercePanel() {
  const queryClient = useQueryClient();
  const [siteUrl, setSiteUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; productCount?: number; categoryCount?: number } | null>(null);
  const [testing, setTesting] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: settings, isLoading: settingsLoading } = useQuery<WooSettings | null>({
    queryKey: ['admin', 'woocommerce', 'settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/woocommerce/settings');
      return res.json();
    },
  });

  const { data: logs = [], refetch: refetchLogs } = useQuery<WooSyncLog[]>({
    queryKey: ['admin', 'woocommerce', 'logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/woocommerce/logs');
      return res.json();
    },
    refetchInterval: importing ? 3000 : false,
  });

  useEffect(() => {
    if (settings) {
      setSiteUrl(settings.siteUrl);
      setConsumerKey(settings.consumerKey);
    }
  }, [settings]);

  useEffect(() => {
    const runningLog = logs.find(l => l.status === 'running');
    if (runningLog) {
      setImporting(true);
    } else {
      setImporting(false);
    }
  }, [logs]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/woocommerce/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, consumerKey, consumerSecret }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, message: 'Bağlantı hatası' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/woocommerce/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, consumerKey, consumerSecret, isActive: true }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'woocommerce', 'settings'] });
        setTestResult({ success: true, message: 'Ayarlar kaydedildi!' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Kayıt hatası' });
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/woocommerce/import', {
        method: 'POST',
      });
      if (res.ok) {
        refetchLogs();
      }
    } catch (error) {
      setImporting(false);
    }
  };

  const runningLog = logs.find(l => l.status === 'running');
  const lastCompletedLog = logs.find(l => l.status === 'completed' || l.status === 'failed');

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">WooCommerce Entegrasyonu</h3>
            <p className="text-sm text-zinc-400">Mevcut WooCommerce sitenizden ürünleri içe aktarın</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Site URL</label>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              data-testid="input-woo-site-url"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Consumer Key</label>
              <input
                type="text"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                placeholder="ck_xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                data-testid="input-woo-consumer-key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Consumer Secret</label>
              <input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                placeholder="cs_xxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                data-testid="input-woo-consumer-secret"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || !siteUrl || !consumerKey || !consumerSecret}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50"
              data-testid="button-test-connection"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              Bağlantıyı Test Et
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={!siteUrl || !consumerKey || !consumerSecret}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              data-testid="button-save-settings"
            >
              Ayarları Kaydet
            </button>
          </div>

          {testResult && (
            <div className={`flex items-start gap-3 p-4 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <div>
                <p className={`font-medium ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult.message}
                </p>
                {testResult.productCount !== undefined && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {testResult.productCount} ürün, {testResult.categoryCount} kategori bulundu
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {settings && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Ürünleri İçe Aktar</h3>
                <p className="text-sm text-zinc-400">
                  {settings.lastSync 
                    ? `Son senkronizasyon: ${new Date(settings.lastSync).toLocaleString('tr-TR')}`
                    : 'Henüz senkronize edilmedi'}
                </p>
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              data-testid="button-import-products"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  İçe Aktarılıyor...
                </>
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  Tüm Ürünleri İçe Aktar
                </>
              )}
            </button>
          </div>

          {runningLog && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="font-medium text-blue-400">İçe aktarma devam ediyor...</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    {runningLog.productsImported} ürün, {runningLog.categoriesImported} kategori, {runningLog.imagesDownloaded} resim
                  </p>
                </div>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-zinc-400 mb-3">Son İşlemler</h4>
              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {log.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                      {log.status === 'running' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                      <div>
                        <p className="text-sm text-white">
                          {log.productsImported} ürün, {log.categoriesImported} kategori
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(log.startedAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.status === 'completed' ? 'Tamamlandı' : log.status === 'failed' ? 'Başarısız' : 'Devam Ediyor'}
                    </span>
                  </div>
                ))}
              </div>

              {lastCompletedLog && lastCompletedLog.errors.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">Bazı hatalar oluştu ({lastCompletedLog.errors.length})</p>
                      <ul className="mt-2 text-xs text-zinc-400 space-y-1">
                        {lastCompletedLog.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {lastCompletedLog.errors.length > 3 && (
                          <li className="text-zinc-500">... ve {lastCompletedLog.errors.length - 3} hata daha</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h4 className="font-medium text-white mb-4">WooCommerce API Anahtarı Nasıl Alınır?</h4>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0">1</span>
            <span>WooCommerce yönetim panelinize gidin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0">2</span>
            <span>WooCommerce → Ayarlar → Gelişmiş → REST API bölümüne gidin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0">3</span>
            <span>"Anahtar Ekle" butonuna tıklayın</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0">4</span>
            <span>İzin olarak "Okuma" seçin ve oluşturun</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-xs shrink-0">5</span>
            <span>Consumer Key ve Consumer Secret değerlerini kopyalayın</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

function AnalyticsPanel() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['admin-sales', period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/sales?period=${period}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sales data');
      return res.json();
    },
  });

  const { data: bestSellers, isLoading: bestSellersLoading } = useQuery({
    queryKey: ['admin-best-sellers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/best-sellers?limit=10', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch best sellers');
      return res.json();
    },
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['admin-comparison'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/comparison', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch comparison');
      return res.json();
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Bu Dönem Gelir</p>
              <p className="text-2xl font-bold text-white mt-1">
                {comparisonLoading ? '...' : formatPrice(comparison?.current?.revenue || 0)}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${comparison?.revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparison?.revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(comparison?.revenueChange || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Bu Dönem Sipariş</p>
              <p className="text-2xl font-bold text-white mt-1">
                {comparisonLoading ? '...' : comparison?.current?.orders || 0}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${comparison?.ordersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparison?.ordersChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              <span className="text-sm font-medium">{Math.abs(comparison?.ordersChange || 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div>
            <p className="text-sm text-zinc-400">Önceki Dönem Gelir</p>
            <p className="text-2xl font-bold text-zinc-500 mt-1">
              {comparisonLoading ? '...' : formatPrice(comparison?.previous?.revenue || 0)}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div>
            <p className="text-sm text-zinc-400">Önceki Dönem Sipariş</p>
            <p className="text-2xl font-bold text-zinc-500 mt-1">
              {comparisonLoading ? '...' : comparison?.previous?.orders || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Satış Grafiği</h3>
          <div className="flex gap-2">
            {(['day', 'week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  period === p ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {p === 'day' ? 'Gün' : p === 'week' ? 'Hafta' : p === 'month' ? 'Ay' : 'Yıl'}
              </button>
            ))}
          </div>
        </div>

        {salesLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : salesData?.labels?.length > 0 ? (
          <div className="h-64 flex items-end gap-2">
            {salesData.revenue.map((rev: number, i: number) => {
              const maxRev = Math.max(...salesData.revenue, 1);
              const height = (rev / maxRev) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${height}%`, minHeight: '4px' }}>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 whitespace-nowrap">
                      {formatPrice(rev)}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 truncate max-w-full">{salesData.labels[i]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-zinc-500">
            Bu dönem için veri bulunamadı
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-lg font-semibold text-white">En Çok Satan Ürünler</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {bestSellersLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : bestSellers?.length > 0 ? (
            bestSellers.map((item: any, index: number) => (
              <div key={item.product.id} className="flex items-center gap-4 p-4">
                <span className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                  {index + 1}
                </span>
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800">
                  {item.product.images?.[0] && (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{item.product.name}</p>
                  <p className="text-xs text-zinc-500">{item.totalSold} adet satıldı</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatPrice(item.revenue)}</p>
                  <p className="text-xs text-zinc-500">toplam gelir</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Henüz satış verisi yok
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InventoryPanel() {
  const queryClient = useQueryClient();
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [selectedVariants, setSelectedVariants] = useState<{ id: string; stock: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: allVariants = [], isLoading: variantsLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json();
    },
  });

  const { data: lowStockVariants = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['admin-low-stock', lowStockThreshold],
    queryFn: async () => {
      const res = await fetch(`/api/admin/inventory/low-stock?threshold=${lowStockThreshold}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch low stock');
      return res.json();
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates: { variantId: string; stock: number; reason?: string }[]) => {
      const res = await fetch('/api/admin/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['admin-low-stock'] });
      setSelectedVariants([]);
    },
  });

  const handleStockChange = (variantId: string, newStock: number) => {
    setSelectedVariants(prev => {
      const existing = prev.find(v => v.id === variantId);
      if (existing) {
        return prev.map(v => v.id === variantId ? { ...v, stock: newStock } : v);
      }
      return [...prev, { id: variantId, stock: newStock }];
    });
  };

  const applyBulkUpdate = () => {
    if (selectedVariants.length === 0) return;
    bulkUpdateMutation.mutate(selectedVariants.map(v => ({
      variantId: v.id,
      stock: v.stock,
      reason: 'Admin panel toplu güncelleme',
    })));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-zinc-400">Toplam Varyant</p>
              <p className="text-2xl font-bold text-white">{allVariants.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-zinc-400">Düşük Stok</p>
              <p className="text-2xl font-bold text-yellow-400">{lowStockVariants.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-zinc-400">Toplam Stok</p>
              <p className="text-2xl font-bold text-white">
                {allVariants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {lowStockVariants.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-400">Düşük Stok Uyarısı</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {lowStockVariants.length} varyantın stoğu {lowStockThreshold} adetten az.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {lowStockVariants.slice(0, 5).map((v: any) => (
                  <span key={v.id} className="px-3 py-1 bg-zinc-800 rounded-lg text-sm text-white">
                    {v.product?.name} - {v.size} ({v.stock} adet)
                  </span>
                ))}
                {lowStockVariants.length > 5 && (
                  <span className="px-3 py-1 bg-zinc-700 rounded-lg text-sm text-zinc-400">
                    +{lowStockVariants.length - 5} daha
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-3 md:mb-0">Stok Yönetimi</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 w-64"
                data-testid="input-inventory-search"
              />
            </div>
            {selectedVariants.length > 0 && (
              <button
                onClick={applyBulkUpdate}
                disabled={bulkUpdateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {bulkUpdateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {selectedVariants.length} Değişikliği Kaydet
              </button>
            )}
          </div>
        </div>

        {variantsLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (() => {
          const filteredVariants = allVariants.filter((v: any) =>
            v.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.size?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.color?.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const totalPages = Math.ceil(filteredVariants.length / itemsPerPage);
          const paginatedVariants = filteredVariants.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          );

          return filteredVariants.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Ürün</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Beden</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Renk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Fiyat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {paginatedVariants.map((v: any) => {
                      const pendingChange = selectedVariants.find(sv => sv.id === v.id);
                      const currentStock = pendingChange?.stock ?? v.stock;
                      return (
                        <tr key={v.id} className={pendingChange ? 'bg-blue-500/5' : ''}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800">
                                {v.product?.images?.[0] && (
                                  <img src={v.product.images[0]} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <span className="text-sm text-white">{v.product?.name || 'Bilinmeyen'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-400">{v.size || '-'}</td>
                          <td className="px-6 py-4 text-sm text-zinc-400">{v.color || '-'}</td>
                          <td className="px-6 py-4 text-sm text-white">{v.price} TL</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={currentStock}
                              onChange={(e) => handleStockChange(v.id, parseInt(e.target.value) || 0)}
                              className={`w-20 px-2 py-1 rounded-lg text-sm ${
                                currentStock <= lowStockThreshold
                                  ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                                  : 'bg-zinc-800 border-zinc-700 text-white'
                              } border`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                  <p className="text-sm text-zinc-400">
                    {filteredVariants.length} sonuçtan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredVariants.length)} arası gösteriliyor
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 text-sm rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-white text-black'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz ürün varyantı yok'}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function MarketingPanel() {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'campaigns' | 'influencers'>('coupons');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [showInfluencerModal, setShowInfluencerModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<any>(null);

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/coupons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch coupons');
      return res.json();
    },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/admin/campaigns', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    },
  });

  const { data: influencers = [], isLoading: influencersLoading } = useQuery({
    queryKey: ['admin-influencer-coupons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/influencer-coupons', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch influencer coupons');
      return res.json();
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete coupon');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const saveCouponMutation = useMutation({
    mutationFn: async (coupon: any) => {
      const isEdit = !!coupon.id;
      const res = await fetch(`/api/admin/coupons${isEdit ? `/${coupon.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(coupon),
      });
      if (!res.ok) throw new Error('Failed to save coupon');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowCouponModal(false);
      setEditingCoupon(null);
    },
  });

  const deleteInfluencerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete influencer coupon');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  const saveInfluencerMutation = useMutation({
    mutationFn: async (influencer: any) => {
      const isEdit = !!influencer.id;
      const couponData = {
        code: influencer.code,
        discountType: influencer.discountType || 'percentage',
        discountValue: influencer.discountValue || '0',
        isActive: influencer.isActive,
        isInfluencerCode: true,
        influencerName: influencer.name,
        influencerInstagram: influencer.instagramHandle,
        commissionType: influencer.commissionType,
        commissionValue: influencer.commissionValue,
      };
      const res = await fetch(`/api/admin/coupons${isEdit ? `/${influencer.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(couponData),
      });
      if (!res.ok) throw new Error('Failed to save influencer coupon');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setShowInfluencerModal(false);
      setEditingInfluencer(null);
    },
  });

  const markInfluencerPaidMutation = useMutation({
    mutationFn: async ({ id }: { id: string; isPaid: boolean }) => {
      const res = await fetch(`/api/admin/influencer-coupons/${id}/pay`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update payment status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-influencer-coupons'] });
    },
  });

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(price) || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === 'coupons' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Kuponlar
        </button>
        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === 'campaigns' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4" />
          Kampanyalar
        </button>
        <button
          onClick={() => setActiveSubTab('influencers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeSubTab === 'influencers' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Influencerlar
        </button>
      </div>

      {activeSubTab === 'coupons' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">İndirim Kuponları</h3>
            <button
              onClick={() => { setEditingCoupon(null); setShowCouponModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Kupon
            </button>
          </div>

          {couponsLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : coupons.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Kod</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">İndirim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Kullanım</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Geçerlilik</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {coupons.map((coupon: any) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-zinc-800 px-2 py-1 rounded text-white">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {coupon.discountType === 'percentage' 
                          ? `%${coupon.discountValue}` 
                          : formatPrice(coupon.discountValue)
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded ${
                          coupon.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {coupon.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {coupon.expiresAt 
                          ? new Date(coupon.expiresAt).toLocaleDateString('tr-TR')
                          : 'Süresiz'
                        }
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setEditingCoupon(coupon); setShowCouponModal(true); }}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) deleteCouponMutation.mutate(coupon.id); }}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              Henüz kupon oluşturulmamış
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'campaigns' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">E-posta Kampanyaları</h3>
            <div className="text-sm text-zinc-500">
              E-posta gönderimi için SendGrid veya Resend entegrasyonu gereklidir
            </div>
          </div>

          {campaignsLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : campaigns.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {campaigns.map((campaign: any) => (
                <div key={campaign.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{campaign.name}</h4>
                    <p className="text-sm text-zinc-400 mt-1">{campaign.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(campaign.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {campaign.status === 'active' ? 'Aktif' :
                         campaign.status === 'completed' ? 'Tamamlandı' : 'Taslak'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Henüz kampanya oluşturulmamış</p>
              <p className="text-xs mt-2">E-posta kampanyaları için önce bir e-posta servisi entegrasyonu yapmanız gerekiyor</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'influencers' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Influencer Takip Sistemi</h3>
              <p className="text-sm text-zinc-500 mt-1">Instagram influencer kodları ve komisyon takibi</p>
            </div>
            <button
              onClick={() => { setEditingInfluencer(null); setShowInfluencerModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Yeni Influencer
            </button>
          </div>

          {influencersLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : influencers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Influencer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Kod</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Komisyon Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Kullanım</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Kazanç</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {influencers.map((inf: any) => (
                    <tr key={inf.id} className="hover:bg-zinc-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {(inf.influencerName || inf.code)?.charAt(0).toUpperCase() || 'I'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">{inf.influencerName || inf.code}</div>
                            {inf.influencerInstagram && (
                              <a 
                                href={`https://instagram.com/${inf.influencerInstagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1"
                              >
                                @{inf.influencerInstagram.replace('@', '')}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm bg-zinc-800 px-2 py-1 rounded text-white">
                          {inf.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {inf.commissionType === 'percentage' && `%${inf.commissionValue} sipariş başına`}
                        {inf.commissionType === 'per_use' && `${formatPrice(inf.commissionValue)} kullanım başına`}
                        {inf.commissionType === 'fixed_total' && `${formatPrice(inf.commissionValue)} toplam`}
                        {!inf.commissionType && 'Belirlenmemiş'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {inf.usageCount || 0} kez
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-400 font-medium">
                          {formatPrice(inf.totalCommissionEarned || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 text-xs rounded w-fit ${
                            inf.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                          }`}>
                            {inf.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded w-fit ${
                            inf.isPaid ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {inf.isPaid ? 'Ödendi' : 'Ödeme Bekliyor'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!inf.isPaid && Number(inf.totalCommissionEarned || 0) > 0 && (
                            <button
                              onClick={() => { 
                                if (confirm(`${inf.influencerName || inf.code} için ${formatPrice(inf.totalCommissionEarned)} tutarını ödendi olarak işaretlemek istiyor musunuz?`))
                                  markInfluencerPaidMutation.mutate({ id: inf.id, isPaid: true });
                              }}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors text-zinc-400 hover:text-green-400"
                              title="Ödendi olarak işaretle"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditingInfluencer(inf); setShowInfluencerModal(true); }}
                            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { 
                              if (confirm('Bu influencer\'ı silmek istediğinize emin misiniz?')) 
                                deleteInfluencerMutation.mutate(inf.id); 
                            }}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Henüz influencer eklenmemiş</p>
              <p className="text-xs mt-2">Influencer kodları ile satışları takip edin ve komisyon hesaplayın</p>
            </div>
          )}
        </div>
      )}

      {showCouponModal && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => { setShowCouponModal(false); setEditingCoupon(null); }}
          onSave={(coupon) => saveCouponMutation.mutate(coupon)}
          isSaving={saveCouponMutation.isPending}
        />
      )}

      {showInfluencerModal && (
        <InfluencerModal
          influencer={editingInfluencer}
          onClose={() => { setShowInfluencerModal(false); setEditingInfluencer(null); }}
          onSave={(influencer) => saveInfluencerMutation.mutate(influencer)}
          isSaving={saveInfluencerMutation.isPending}
        />
      )}
    </div>
  );
}

function InfluencerModal({
  influencer,
  onClose,
  onSave,
  isSaving
}: {
  influencer: any;
  onClose: () => void;
  onSave: (influencer: any) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: influencer?.influencerName || '',
    code: influencer?.code || '',
    instagramHandle: influencer?.influencerInstagram || '',
    commissionType: influencer?.commissionType || 'percentage',
    commissionValue: influencer?.commissionValue || '',
    discountType: influencer?.discountType || 'percentage',
    discountValue: influencer?.discountValue || '10',
    isActive: influencer?.isActive ?? true,
  });

  const handleSubmit = () => {
    onSave({
      ...(influencer?.id && { id: influencer.id }),
      ...formData,
      commissionValue: formData.commissionValue.toString(),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {influencer ? 'Influencer Düzenle' : 'Yeni Influencer Ekle'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">İsim *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Influencer adı"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">İndirim Kodu *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="INFLUENCER20"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
            />
            <p className="text-xs text-zinc-500 mt-1">
              Bu kod kuponla eşleştirilecek ve kullanım takibi yapılacak
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Instagram Kullanıcı Adı</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-zinc-700 border border-r-0 border-zinc-700 rounded-l-lg text-zinc-400">@</span>
              <input
                type="text"
                value={formData.instagramHandle.replace('@', '')}
                onChange={(e) => setFormData(p => ({ ...p, instagramHandle: e.target.value.replace('@', '') }))}
                placeholder="kullaniciadi"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-r-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Komisyon Tipi *</label>
              <select
                value={formData.commissionType}
                onChange={(e) => setFormData(p => ({ ...p, commissionType: e.target.value }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="per_use">Kullanım Başına (TL)</option>
                <option value="fixed_total">Sabit Toplam (TL)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Komisyon Değeri *</label>
              <input
                type="number"
                value={formData.commissionValue}
                onChange={(e) => setFormData(p => ({ ...p, commissionValue: e.target.value }))}
                placeholder={formData.commissionType === 'percentage' ? '10' : '50'}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="border-t border-zinc-700 pt-4 mt-4">
            <h4 className="text-sm font-medium text-zinc-300 mb-3">Müşteri İndirimi</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">İndirim Tipi</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(p => ({ ...p, discountType: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit Tutar (TL)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">İndirim Değeri</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData(p => ({ ...p, discountValue: e.target.value }))}
                  placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Influencer kodu kullanıldığında müşterinin alacağı indirim
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-4 text-sm text-zinc-400">
            <p className="font-medium text-zinc-300 mb-2">Komisyon Hesaplama:</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>Yüzde:</strong> Her siparişten belirtilen yüzde kadar kazanç</li>
              <li>• <strong>Kullanım Başına:</strong> Kod her kullanıldığında sabit tutar</li>
              <li>• <strong>Sabit Toplam:</strong> Tüm dönem için tek seferlik ödeme</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="influencer-active"
              checked={formData.isActive}
              onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 rounded bg-zinc-800 border-zinc-700"
            />
            <label htmlFor="influencer-active" className="text-sm text-zinc-400">
              Aktif (Kod kullanılabilir)
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !formData.name || !formData.code || !formData.commissionValue}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {influencer ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponModal({ 
  coupon, 
  onClose, 
  onSave, 
  isSaving 
}: { 
  coupon: any; 
  onClose: () => void; 
  onSave: (coupon: any) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    discountType: coupon?.discountType || 'percentage',
    discountValue: coupon?.discountValue || '',
    minOrderAmount: coupon?.minOrderAmount || '',
    maxDiscount: coupon?.maxDiscount || '',
    usageLimit: coupon?.usageLimit || '',
    perUserLimit: coupon?.perUserLimit || '',
    startsAt: coupon?.startsAt ? new Date(coupon.startsAt).toISOString().split('T')[0] : '',
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
    isActive: coupon?.isActive ?? true,
  });

  const handleSubmit = () => {
    onSave({
      ...(coupon?.id && { id: coupon.id }),
      ...formData,
      discountValue: formData.discountValue,
      minOrderAmount: formData.minOrderAmount || null,
      maxDiscount: formData.maxDiscount || null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
      startsAt: formData.startsAt ? new Date(formData.startsAt) : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {coupon ? 'Kuponu Düzenle' : 'Yeni Kupon Oluştur'}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Kupon Kodu *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER20"
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">İndirim Tipi *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData(p => ({ ...p, discountType: e.target.value }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit Tutar (TL)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">İndirim Değeri *</label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData(p => ({ ...p, discountValue: e.target.value }))}
                placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Min. Sipariş Tutarı</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData(p => ({ ...p, minOrderAmount: e.target.value }))}
                placeholder="500"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Max. İndirim (TL)</label>
              <input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData(p => ({ ...p, maxDiscount: e.target.value }))}
                placeholder="200"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Kullanım Limiti</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData(p => ({ ...p, usageLimit: e.target.value }))}
                placeholder="100"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Kişi Başı Limit</label>
              <input
                type="number"
                value={formData.perUserLimit}
                onChange={(e) => setFormData(p => ({ ...p, perUserLimit: e.target.value }))}
                placeholder="1"
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Başlangıç Tarihi</label>
              <input
                type="date"
                value={formData.startsAt}
                onChange={(e) => setFormData(p => ({ ...p, startsAt: e.target.value }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Bitiş Tarihi</label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData(p => ({ ...p, expiresAt: e.target.value }))}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
              className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-white"
            />
            <span className="text-sm text-white">Kupon Aktif</span>
          </label>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !formData.code || !formData.discountValue}
            className="flex items-center gap-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {coupon ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: 'false',
    admin_email: '',
    site_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: savedSettings, isLoading } = useQuery<{
    smtp_host?: string;
    smtp_port?: string;
    smtp_user?: string;
    smtp_pass?: string;
    smtp_secure?: string;
    admin_email?: string;
    site_url?: string;
  }>({
    queryKey: ['/api/admin/settings'],
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings(prev => ({
        ...prev,
        ...savedSettings,
      }));
      if (savedSettings.admin_email) {
        setTestEmail(savedSettings.admin_email);
      }
    }
  }, [savedSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Ayarlar kaydedildi!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Ayarlar kaydedilemedi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;
    setIsTesting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Test e-postası gönderildi!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Test e-postası gönderilemedi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Ayarlar</h2>
        <p className="text-zinc-400">E-posta ve sistem ayarlarını yönetin</p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Server className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">SMTP Ayarları</h3>
            <p className="text-sm text-zinc-400">E-posta gönderimi için SMTP sunucu yapılandırması</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">SMTP Sunucu</label>
            <input
              type="text"
              value={settings.smtp_host}
              onChange={(e) => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
              placeholder="mail.example.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-smtp-host"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Port</label>
            <input
              type="text"
              value={settings.smtp_port}
              onChange={(e) => setSettings(s => ({ ...s, smtp_port: e.target.value }))}
              placeholder="587"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-smtp-port"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Kullanıcı Adı (E-posta)</label>
            <input
              type="text"
              value={settings.smtp_user}
              onChange={(e) => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
              placeholder="no-reply@example.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-smtp-user"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Şifre</label>
            <input
              type="password"
              value={settings.smtp_pass}
              onChange={(e) => setSettings(s => ({ ...s, smtp_pass: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-smtp-pass"
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smtp_secure === 'true'}
                onChange={(e) => setSettings(s => ({ ...s, smtp_secure: e.target.checked ? 'true' : 'false' }))}
                className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
              />
              <span className="text-sm text-white">SSL/TLS Kullan (Port 465 için)</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Bildirim Ayarları</h3>
            <p className="text-sm text-zinc-400">Sipariş bildirimleri için admin e-posta adresi</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Admin E-posta</label>
            <input
              type="email"
              value={settings.admin_email}
              onChange={(e) => setSettings(s => ({ ...s, admin_email: e.target.value }))}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-admin-email"
            />
            <p className="text-xs text-zinc-500 mt-1">Yeni sipariş bildirimleri bu adrese gönderilir</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Site URL</label>
            <input
              type="text"
              value={settings.site_url}
              onChange={(e) => setSettings(s => ({ ...s, site_url: e.target.value }))}
              placeholder="https://hank.com.tr"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
              data-testid="input-site-url"
            />
            <p className="text-xs text-zinc-500 mt-1">E-postalardaki bağlantılar için kullanılır</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-800 rounded-lg">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Test E-postası</h3>
            <p className="text-sm text-zinc-400">SMTP ayarlarınızı test edin</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-white transition-colors"
            data-testid="input-test-email"
          />
          <button
            onClick={handleTestEmail}
            disabled={isTesting || !testEmail}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
            data-testid="button-send-test"
          >
            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Test Gönder
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 font-medium"
          data-testid="button-save-settings"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );
}
