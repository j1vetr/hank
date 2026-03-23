import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ShoppingBag, Clock, TrendingUp, CheckCircle2, XCircle,
  Truck, Search, Eye, BarChart3, ArrowUpRight, ChevronDown,
  Package, RefreshCw
} from 'lucide-react';

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

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending', label: 'Beklemede' },
  { value: 'processing', label: 'İşleniyor' },
  { value: 'shipped', label: 'Kargoda' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  pending:    { label: 'Beklemede',  color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',   dot: 'bg-amber-400',   icon: Clock },
  processing: { label: 'İşleniyor', color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',     dot: 'bg-blue-400',    icon: RefreshCw },
  shipped:    { label: 'Kargoda',   color: 'text-purple-400',  bg: 'bg-purple-500/15 border-purple-500/30', dot: 'bg-purple-400',  icon: Truck },
  completed:  { label: 'Tamamlandı',color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30',dot: 'bg-emerald-400', icon: CheckCircle2 },
  cancelled:  { label: 'İptal',     color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30',       dot: 'bg-red-400',     icon: XCircle },
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function formatCurrency(amount: string | number): string {
  return Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADIENTS = [
  'from-violet-600 to-purple-600',
  'from-blue-600 to-cyan-600',
  'from-emerald-600 to-teal-600',
  'from-orange-600 to-amber-600',
  'from-rose-600 to-pink-600',
  'from-indigo-600 to-blue-600',
];

function avatarGradient(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
}

function StatusSelect({ orderId, currentStatus, onChange }: { orderId: string; currentStatus: string; onChange: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} cursor-pointer hover:opacity-80 transition-opacity`}
        data-testid={`select-status-${orderId}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${currentStatus === 'pending' ? 'animate-pulse' : ''}`} />
        {cfg.label}
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden min-w-[140px]">
            {Object.entries(STATUS_CONFIG).map(([val, conf]) => (
              <button
                key={val}
                onClick={(e) => { e.stopPropagation(); onChange(orderId, val); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors ${val === currentStatus ? conf.color : 'text-zinc-300'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                {conf.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrdersPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const r = await fetch('/api/admin/orders', { credentials: 'include' });
      return r.json();
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthOrders = orders.filter(o => new Date(o.createdAt) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) < thisMonthStart);

    const thisMonthRevenue = thisMonthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
    const lastMonthRevenue = lastMonthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);

    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => o.status === 'completed').length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0);
    const avgOrder = orders.length ? totalRevenue / orders.length : 0;

    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : null;

    return { pending, processing, completed, thisMonthRevenue, lastMonthRevenue, revenueGrowth, avgOrder, totalRevenue, thisMonthOrders: thisMonthOrders.length };
  }, [orders]);

  const monthlyData = useMemo(() => {
    const months: { label: string; revenue: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthOrders = orders.filter(o => {
        const od = new Date(o.createdAt);
        return od.getFullYear() === y && od.getMonth() === m && o.status !== 'cancelled';
      });
      months.push({
        label: d.toLocaleDateString('tr-TR', { month: 'short' }),
        revenue: monthOrders.reduce((s, o) => s + Number(o.total), 0),
        count: monthOrders.length,
      });
    }
    return months;
  }, [orders]);

  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'all') list = list.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.shippingAddress?.city || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-zinc-500">Bu ay</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.thisMonthOrders}</p>
          <p className="text-xs text-zinc-500 mt-1">Sipariş alındı</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            {stats.pending > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Dikkat
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
          <p className="text-xs text-zinc-500 mt-1">Beklemede</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            {stats.revenueGrowth !== null && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <ArrowUpRight className={`w-3 h-3 ${stats.revenueGrowth < 0 ? 'rotate-180' : ''}`} />
                {Math.abs(stats.revenueGrowth).toFixed(0)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white">₺{formatCurrency(stats.thisMonthRevenue)}</p>
          <p className="text-xs text-zinc-500 mt-1">Bu ay ciro</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">₺{formatCurrency(stats.avgOrder)}</p>
          <p className="text-xs text-zinc-500 mt-1">Ortalama sepet</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">Aylık Ciro</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Son 6 ay (iptal edilen siparişler hariç)</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">₺{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-zinc-500">Toplam</p>
          </div>
        </div>
        <div className="flex items-end gap-3 h-28">
          {monthlyData.map((m, i) => {
            const height = maxRevenue > 0 ? Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 8 : 0) : 0;
            const isCurrent = i === monthlyData.length - 1;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 group relative ${isCurrent ? 'bg-white' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                    style={{ height: `${height}%`, minHeight: m.revenue > 0 ? '6px' : '0px' }}
                  >
                    {m.revenue > 0 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-xl z-10">
                        ₺{formatCurrency(m.revenue)} · {m.count} sipariş
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${isCurrent ? 'text-white' : 'text-zinc-500'}`}>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-1 flex-wrap">
          {STATUS_OPTIONS.map(opt => {
            const count = statusCounts[opt.value] || 0;
            const active = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                data-testid={`filter-status-${opt.value}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white text-black'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {opt.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold min-w-[16px] text-center ${active ? 'text-black/60' : opt.value === 'pending' && count > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Sipariş no, müşteri, şehir..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            data-testid="input-search-orders"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package className="w-10 h-10 text-zinc-700" />
            <p className="text-zinc-500 text-sm">
              {search || statusFilter !== 'all' ? 'Eşleşen sipariş bulunamadı' : 'Henüz sipariş yok'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Müşteri</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sipariş</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Şehir</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Durum</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Tutar</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Tarih</th>
                    <th className="text-right px-5 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors group" data-testid={`row-order-${order.id}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarGradient(order.customerName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(order.customerName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[140px]">{order.customerName}</p>
                            <p className="text-xs text-zinc-500 truncate max-w-[140px]">{order.customerEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm text-zinc-300">{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm text-zinc-400">{order.shippingAddress?.city || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusSelect
                          orderId={order.id}
                          currentStatus={order.status}
                          onChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-white">₺{formatCurrency(order.total)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm text-zinc-400">{timeAgo(order.createdAt)}</p>
                          <p className="text-[11px] text-zinc-600">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <Link
                            href={`/toov-admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detay
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-zinc-800">
              {filtered.map(order => (
                <div key={order.id} className="p-4" data-testid={`card-order-${order.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${avatarGradient(order.customerName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {getInitials(order.customerName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{order.customerName}</p>
                        <p className="text-xs text-zinc-500 font-mono">{order.orderNumber}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-white shrink-0">₺{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusSelect
                        orderId={order.id}
                        currentStatus={order.status}
                        onChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                      />
                      <span className="text-xs text-zinc-500">{order.shippingAddress?.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{timeAgo(order.createdAt)}</span>
                      <Link
                        href={`/toov-admin/orders/${order.id}`}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        data-testid={`button-view-order-mobile-${order.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {filtered.length} sipariş {statusFilter !== 'all' || search ? `(toplam ${orders.length})` : ''}
              </p>
              {statusFilter !== 'all' || search ? (
                <button
                  onClick={() => { setStatusFilter('all'); setSearch(''); }}
                  className="text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Filtreyi temizle
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
