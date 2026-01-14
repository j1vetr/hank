import { useState } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Edit3,
  Save,
  Phone,
  Mail,
  Calendar,
  ShoppingBag,
  CreditCard,
  Loader2,
  Heart,
  Plus,
  Trash2,
  Home
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useFavorites } from '@/hooks/useFavorites';
import { ProductCard } from '@/components/ProductCard';

type TabType = 'orders' | 'profile' | 'addresses' | 'favorites';

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
  subtotal: string;
  shippingCost: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  productName: string;
  variantDetails: string;
  price: string;
  quantity: number;
  subtotal: string;
}

interface UserAddress {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  postalCode: string | null;
  isDefault: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  pending: { label: 'Beklemede', color: 'text-yellow-400', icon: Clock, bg: 'bg-yellow-400/10' },
  processing: { label: 'İşleniyor', color: 'text-blue-400', icon: Package, bg: 'bg-blue-400/10' },
  shipped: { label: 'Kargoda', color: 'text-purple-400', icon: Truck, bg: 'bg-purple-400/10' },
  completed: { label: 'Tamamlandı', color: 'text-green-400', icon: CheckCircle2, bg: 'bg-green-400/10' },
  cancelled: { label: 'İptal Edildi', color: 'text-red-400', icon: XCircle, bg: 'bg-red-400/10' },
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders/my', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites();

  const { data: orderDetail, isLoading: orderDetailLoading } = useQuery<Order>({
    queryKey: ['my-order', selectedOrder?.id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/my/${selectedOrder?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch order');
      return res.json();
    },
    enabled: !!selectedOrder?.id,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; phone: string }) => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      toast({ title: 'Başarılı', description: 'Profil bilgileriniz güncellendi.' });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Profil güncellenemedi.', variant: 'destructive' });
    },
  });

  // Address management state
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    postalCode: '',
    isDefault: false,
  });

  const { data: addresses = [], isLoading: addressesLoading } = useQuery<UserAddress[]>({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const res = await fetch('/api/auth/addresses', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to create address');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({ title: 'Başarılı', description: 'Adres eklendi.' });
      setShowAddressForm(false);
      resetAddressForm();
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Adres eklenemedi.', variant: 'destructive' });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof addressForm }) => {
      const res = await fetch(`/api/auth/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update address');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({ title: 'Başarılı', description: 'Adres güncellendi.' });
      setEditingAddress(null);
      setShowAddressForm(false);
      resetAddressForm();
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Adres güncellenemedi.', variant: 'destructive' });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/auth/addresses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete address');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast({ title: 'Başarılı', description: 'Adres silindi.' });
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Adres silinemedi.', variant: 'destructive' });
    },
  });

  const resetAddressForm = () => {
    setAddressForm({
      title: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      isDefault: false,
    });
  };

  const handleEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      title: addr.title,
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      district: addr.district,
      postalCode: addr.postalCode || '',
      isDefault: addr.isDefault,
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: (user as any)?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-36 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </main>
      </div>
    );
  }

  if (!user) {
    navigate('/giris');
    return null;
  }

  const tabs = [
    { id: 'orders' as TabType, label: 'Siparişlerim', icon: Package, count: orders.length },
    { id: 'favorites' as TabType, label: 'Favorilerim', icon: Heart, count: favorites.length },
    { id: 'profile' as TabType, label: 'Profil Bilgileri', icon: User },
    { id: 'addresses' as TabType, label: 'Adreslerim', icon: MapPin, count: addresses.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-36 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl tracking-wide" data-testid="text-page-title">
                  HESABIM
                </h1>
                <p className="text-muted-foreground mt-2">
                  Hoş geldin, {user.firstName || user.email.split('@')[0]}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Çıkış Yap</span>
              </button>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 sticky top-28">
                <div className="flex flex-col items-center mb-6 pb-6 border-b border-zinc-800">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white to-zinc-400 flex items-center justify-center text-black text-2xl font-bold mb-3">
                    {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </div>

                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-white text-black'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                      </div>
                      {tab.count !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeTab === tab.id ? 'bg-black/20' : 'bg-zinc-800'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-3"
            >
              <AnimatePresence mode="wait">
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Siparişlerim</h2>
                      <p className="text-sm text-zinc-500">{orders.length} sipariş</p>
                    </div>

                    {ordersLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-semibold text-white mb-2">Henüz siparişiniz yok</h3>
                        <p className="text-zinc-500 mb-6">Alışverişe başlayarak ilk siparişinizi oluşturun.</p>
                        <button
                          onClick={() => navigate('/')}
                          className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                          data-testid="button-start-shopping"
                        >
                          Alışverişe Başla
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const status = statusConfig[order.status] || statusConfig.pending;
                          const StatusIcon = status.icon;
                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
                              data-testid={`order-card-${order.id}`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-mono text-white font-semibold">
                                      #{order.orderNumber}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                      <StatusIcon className="w-3.5 h-3.5" />
                                      {status.label}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      {format(new Date(order.createdAt), 'd MMMM yyyy', { locale: tr })}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <CreditCard className="w-4 h-4" />
                                      {order.total}₺
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-white transition-colors"
                                  data-testid={`button-view-order-${order.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  Detaylar
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'favorites' && (
                  <motion.div
                    key="favorites"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-xl font-semibold text-white mb-6">Favorilerim</h2>
                    
                    {favoritesLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                      </div>
                    ) : favorites.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Heart className="w-8 h-8 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Henüz favori ürününüz yok</h3>
                        <p className="text-zinc-500 mb-6">Beğendiğiniz ürünleri favorilere ekleyin, daha sonra kolayca bulun.</p>
                        <Link href="/">
                          <button className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors">
                            Alışverişe Başla
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {favorites.map((product) => (
                          <ProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Profil Bilgileri</h2>
                      {!isEditing && (
                        <button
                          onClick={handleEditProfile}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium text-white transition-colors"
                          data-testid="button-edit-profile"
                        >
                          <Edit3 className="w-4 h-4" />
                          Düzenle
                        </button>
                      )}
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">Ad</label>
                              <input
                                type="text"
                                value={profileForm.firstName}
                                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Adınız"
                                data-testid="input-firstName"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">Soyad</label>
                              <input
                                type="text"
                                value={profileForm.lastName}
                                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Soyadınız"
                                data-testid="input-lastName"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Telefon</label>
                            <input
                              type="tel"
                              value={profileForm.phone}
                              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="05XX XXX XX XX"
                              data-testid="input-phone"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="flex-1 px-4 py-3 border border-zinc-700 rounded-xl text-white hover:bg-zinc-800 transition-colors"
                              data-testid="button-cancel-edit"
                            >
                              İptal
                            </button>
                            <button
                              onClick={handleSaveProfile}
                              disabled={updateProfileMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                              data-testid="button-save-profile"
                            >
                              {updateProfileMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid sm:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                <User className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Ad Soyad</p>
                                <p className="text-white font-medium">
                                  {user.firstName} {user.lastName || '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">E-posta</p>
                                <p className="text-white font-medium">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                <Phone className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Telefon</p>
                                <p className="text-white font-medium">{(user as any)?.phone || '-'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                              <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-wider">Üyelik Tarihi</p>
                                <p className="text-white font-medium">
                                  {(user as any)?.createdAt 
                                    ? format(new Date((user as any).createdAt), 'd MMMM yyyy', { locale: tr })
                                    : '-'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'addresses' && (
                  <motion.div
                    key="addresses"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Adreslerim</h2>
                      {!showAddressForm && (
                        <button
                          onClick={() => {
                            resetAddressForm();
                            setEditingAddress(null);
                            setShowAddressForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors"
                          data-testid="button-add-address"
                        >
                          <Plus className="w-4 h-4" />
                          Yeni Adres
                        </button>
                      )}
                    </div>

                    {showAddressForm ? (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Adres Başlığı *</label>
                            <input
                              type="text"
                              value={addressForm.title}
                              onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="Ev, İş, vb."
                              data-testid="input-address-title"
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">Ad *</label>
                              <input
                                type="text"
                                value={addressForm.firstName}
                                onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Adınız"
                                data-testid="input-address-firstName"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">Soyad *</label>
                              <input
                                type="text"
                                value={addressForm.lastName}
                                onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Soyadınız"
                                data-testid="input-address-lastName"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Telefon *</label>
                            <input
                              type="tel"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="05XX XXX XX XX"
                              data-testid="input-address-phone"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Adres *</label>
                            <input
                              type="text"
                              value={addressForm.address}
                              onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="Sokak, Mahalle, Bina No, Daire No"
                              data-testid="input-address-address"
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">İl *</label>
                              <input
                                type="text"
                                value={addressForm.city}
                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="İstanbul"
                                data-testid="input-address-city"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-zinc-400 mb-2">İlçe *</label>
                              <input
                                type="text"
                                value={addressForm.district}
                                onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                                placeholder="Kadıköy"
                                data-testid="input-address-district"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Posta Kodu</label>
                            <input
                              type="text"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-white transition-colors"
                              placeholder="34000"
                              data-testid="input-address-postalCode"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id="isDefault"
                              checked={addressForm.isDefault}
                              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                              className="w-5 h-5 rounded bg-zinc-800 border-zinc-700"
                              data-testid="checkbox-address-default"
                            />
                            <label htmlFor="isDefault" className="text-sm text-zinc-400">
                              Varsayılan adres olarak ayarla
                            </label>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={() => {
                                setShowAddressForm(false);
                                setEditingAddress(null);
                                resetAddressForm();
                              }}
                              className="flex-1 px-4 py-3 border border-zinc-700 rounded-xl text-white hover:bg-zinc-800 transition-colors"
                              data-testid="button-cancel-address"
                            >
                              İptal
                            </button>
                            <button
                              onClick={handleSaveAddress}
                              disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                              data-testid="button-save-address"
                            >
                              {(createAddressMutation.isPending || updateAddressMutation.isPending) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Kaydet
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : addressesLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                        <MapPin className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-xl font-semibold text-white mb-2">Henüz adresiniz yok</h3>
                        <p className="text-zinc-500 mb-6">
                          Siparişlerinizi hızlandırmak için adres ekleyin.
                        </p>
                        <button
                          onClick={() => {
                            resetAddressForm();
                            setShowAddressForm(true);
                          }}
                          className="px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                          data-testid="button-add-first-address"
                        >
                          İlk Adresimi Ekle
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors"
                            data-testid={`address-card-${addr.id}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Home className="w-4 h-4 text-zinc-500" />
                                  <span className="font-semibold text-white">{addr.title}</span>
                                  {addr.isDefault && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                      Varsayılan
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-300">{addr.firstName} {addr.lastName}</p>
                                <p className="text-zinc-500">{addr.address}</p>
                                <p className="text-zinc-500">{addr.district}, {addr.city} {addr.postalCode}</p>
                                <p className="text-zinc-500 mt-1">{addr.phone}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditAddress(addr)}
                                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                  data-testid={`button-edit-address-${addr.id}`}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
                                      deleteAddressMutation.mutate(addr.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                                  data-testid={`button-delete-address-${addr.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Sipariş #{selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    {format(new Date(selectedOrder.createdAt), 'd MMMM yyyy, HH:mm', { locale: tr })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  data-testid="button-close-order-modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  {(() => {
                    const status = statusConfig[selectedOrder.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {status.label}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Ürünler</h4>
                  {orderDetailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderDetail?.items?.map((item) => (
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
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Teslimat Adresi</h4>
                  <div className="p-4 bg-zinc-800/50 rounded-xl">
                    <p className="text-white">{selectedOrder.customerName}</p>
                    <p className="text-zinc-400">{selectedOrder.shippingAddress.address}</p>
                    <p className="text-zinc-400">
                      {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city} {selectedOrder.shippingAddress.postalCode}
                    </p>
                    <p className="text-zinc-400 mt-2">{selectedOrder.customerPhone}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">Özet</h4>
                  <div className="p-4 bg-zinc-800/50 rounded-xl space-y-2">
                    <div className="flex justify-between text-zinc-400">
                      <span>Ara Toplam</span>
                      <span>{selectedOrder.subtotal}₺</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Kargo</span>
                      <span>{parseFloat(selectedOrder.shippingCost) === 0 ? 'Ücretsiz' : `${selectedOrder.shippingCost}₺`}</span>
                    </div>
                    <div className="flex justify-between text-white font-semibold text-lg pt-2 border-t border-zinc-700">
                      <span>Toplam</span>
                      <span>{selectedOrder.total}₺</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
