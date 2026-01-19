import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'wouter';
import { 
  ChevronLeft, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  MapPin,
  Phone,
  Mail,
  Tag,
  Hash,
  Calendar,
  MessageSquare,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantDetails?: string;
  sku?: string;
  productImage?: string;
  quantity: number;
  price: string;
  subtotal: string;
}

interface OrderNote {
  id: string;
  content: string;
  createdAt: string;
  authorId?: string;
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
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  couponCode?: string;
  total: string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  createdAt: string;
  items: OrderItem[];
}

const statusOptions = [
  { value: 'pending', label: 'Beklemede', color: 'bg-yellow-500', icon: Clock },
  { value: 'processing', label: 'Hazırlanıyor', color: 'bg-blue-500', icon: Package },
  { value: 'shipped', label: 'Kargoya Verildi', color: 'bg-purple-500', icon: Truck },
  { value: 'delivered', label: 'Teslim Edildi', color: 'bg-green-500', icon: CheckCircle },
  { value: 'cancelled', label: 'İptal Edildi', color: 'bg-red-500', icon: XCircle },
];

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [couponInfo, setCouponInfo] = useState<{ isInfluencerCode: boolean; influencerInstagram?: string } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${params.id}`, { credentials: 'include' });
        if (!res.ok) {
          setLocation('/toov-admin');
          return;
        }
        const data = await res.json();
        setOrder(data);
        setStatus(data.status);
        setTrackingNumber(data.trackingNumber || '');
        setTrackingUrl(data.trackingUrl || '');
        
        if (data.couponCode) {
          const couponRes = await fetch(`/api/admin/coupons/by-code/${data.couponCode}`, { credentials: 'include' });
          if (couponRes.ok) {
            const couponData = await couponRes.json();
            setCouponInfo(couponData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        setLocation('/toov-admin');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/admin/orders/${params.id}/notes`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
        }
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    };

    fetchOrder();
    fetchNotes();
  }, [params.id, setLocation]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const payload: any = { status };
      if (status === 'shipped' && trackingNumber) {
        payload.trackingNumber = trackingNumber;
      }
      
      await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      setOrder({ ...order, status });
    } catch (error) {
      console.error('Status update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTrackingUpdate = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const finalTrackingUrl = trackingUrl || `https://www.dhl.com/tr-tr/home/takip.html?tracking-id=${trackingNumber}`;
      
      await fetch(`/api/admin/orders/${order.id}/tracking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trackingNumber, 
          trackingUrl: finalTrackingUrl,
          shippingCarrier: 'DHL E-Commerce'
        }),
        credentials: 'include',
      });
      
      let newStatus = status;
      if (status !== 'shipped' && status !== 'delivered') {
        await fetch(`/api/admin/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' }),
          credentials: 'include',
        });
        newStatus = 'shipped';
        setStatus('shipped');
      }
      
      setOrder({ ...order, status: newStatus, trackingNumber, trackingUrl: finalTrackingUrl });
    } catch (error) {
      console.error('Tracking update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
        credentials: 'include',
      });
      setStatus('cancelled');
      setOrder({ ...order, status: 'cancelled' });
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancel order failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !order) return;
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

  const currentStatus = statusOptions.find(s => s.value === status);
  const StatusIcon = currentStatus?.icon || Clock;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Sipariş bulunamadı</p>
          <Link href="/toov-admin" className="text-purple-400 hover:underline">
            Admin Panele Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/toov-admin" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-5 h-5" />
          Admin Panele Dön
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Sipariş #{order.orderNumber}</h1>
                  <p className="text-zinc-400 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.createdAt).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className={`${currentStatus?.color} text-white px-4 py-2 rounded-full flex items-center gap-2`}>
                  <StatusIcon className="w-4 h-4" />
                  <span className="font-medium">{currentStatus?.label}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Müşteri Bilgileri
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                    <p className="text-white font-medium">{order.customerName}</p>
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {order.customerEmail}
                    </p>
                    <p className="text-zinc-400 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {order.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Teslimat Adresi
                  </h3>
                  <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                    <p className="text-zinc-300">{order.shippingAddress?.address}</p>
                    <p className="text-zinc-400 text-sm">
                      {order.shippingAddress?.district}, {order.shippingAddress?.city}
                    </p>
                    {order.shippingAddress?.postalCode && (
                      <p className="text-zinc-500 text-sm">{order.shippingAddress.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sipariş Kalemleri
              </h3>
              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={item.id || index} className="bg-zinc-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-4 flex-1">
                        {item.productImage && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-700 shrink-0">
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.productName}</p>
                          {item.variantDetails && (
                            <p className="text-zinc-400 text-sm mt-1">{item.variantDetails}</p>
                          )}
                          {item.sku && (
                            <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              SKU: {item.sku}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-medium">{item.quantity} x {parseFloat(item.price).toFixed(2)}₺</p>
                        <p className="text-zinc-400 text-sm">{parseFloat(item.subtotal).toFixed(2)}₺</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-700 space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Ara Toplam</span>
                  <span>{parseFloat(order.subtotal).toFixed(2)}₺</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kargo</span>
                  <span>{parseFloat(order.shippingCost || '0').toFixed(2)}₺</span>
                </div>
                {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      İndirim {order.couponCode && `(${order.couponCode})`}
                    </span>
                    <span>-{parseFloat(order.discountAmount).toFixed(2)}₺</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-zinc-700">
                  <span>Toplam</span>
                  <span>{parseFloat(order.total).toFixed(2)}₺</span>
                </div>
              </div>

              {order.couponCode && couponInfo?.isInfluencerCode && (
                <div className="mt-4 p-3 bg-purple-900/30 border border-purple-600/30 rounded-lg">
                  <p className="text-purple-300 text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Influencer Kodu Kullanıldı: <span className="font-bold">{order.couponCode}</span>
                    {couponInfo.influencerInstagram && (
                      <a 
                        href={`https://instagram.com/${couponInfo.influencerInstagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        @{couponInfo.influencerInstagram.replace('@', '')}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Notlar
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Not ekle..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-600"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                >
                  Ekle
                </button>
              </div>
              {notes.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-white text-sm">{note.content}</p>
                      <p className="text-zinc-500 text-xs mt-1">
                        {new Date(note.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Henüz not eklenmemiş.</p>
              )}
            </div>
          </div>

          <div className="lg:w-80 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sipariş Durumu</h3>
              <div className="space-y-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={status === 'cancelled'}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-600"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || status === order.status || status === 'cancelled'}
                  className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                DHL E-Commerce Kargo
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Takip Numarası"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-600"
                />
                <input
                  type="text"
                  placeholder="Takip URL (opsiyonel)"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-600"
                />
                <button
                  onClick={handleTrackingUpdate}
                  disabled={isUpdating || !trackingNumber}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  Kargoya Ver
                </button>
                {order.trackingNumber && order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-center hover:bg-zinc-700 transition-colors"
                  >
                    Kargo Takibi <ExternalLink className="w-4 h-4 inline ml-1" />
                  </a>
                )}
              </div>
            </div>

            {status !== 'cancelled' && status !== 'delivered' && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Siparişi İptal Et</h3>
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Siparişi İptal Et
                  </button>
                ) : (
                  <div className="space-y-3">
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
                        className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors"
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={handleCancelOrder}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
    </div>
  );
}
