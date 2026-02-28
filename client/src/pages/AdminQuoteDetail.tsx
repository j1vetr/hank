import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Building2, Calendar, CreditCard, FileText, Download, Send, Check, X, Package, Loader2, Printer } from "lucide-react";

interface Dealer {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface QuoteItem {
  id: string;
  quoteId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productImage: string | null;
  variantDetails: string | null;
  quantity: number;
  unitPrice: string;
  discountPercent: string;
  lineTotal: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  dealerId: string;
  status: string;
  validUntil: string | null;
  paymentTerms: string | null;
  notes: string | null;
  subtotal: string;
  discountTotal: string;
  grandTotal: string;
  includesVat: boolean;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  dealer?: Dealer;
  items?: QuoteItem[];
}

export default function AdminQuoteDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: quote, isLoading, error } = useQuery<Quote>({
    queryKey: ['admin', 'quote', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/quotes/${params.id}`, { credentials: 'include' });
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/toov-admin/login');
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch quote');
      }
      return res.json();
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/quotes/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quote', params.id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotes'] });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Taslak', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
      case 'sent': return { label: 'Gönderildi', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'accepted': return { label: 'Kabul Edildi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'rejected': return { label: 'Reddedildi', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'expired': return { label: 'Süresi Doldu', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      default: return { label: status, color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
    }
  };

  const getPaymentTermsLabel = (terms: string | null) => {
    switch (terms) {
      case 'cash': return 'Peşin';
      case 'net15': return '15 Gün Vadeli';
      case 'net30': return '30 Gün Vadeli';
      case 'net45': return '45 Gün Vadeli';
      case 'net60': return '60 Gün Vadeli';
      default: return terms || 'Belirtilmemiş';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/admin/quotes/${params.id}/pdf`, { credentials: 'include' });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Teklif-${quote?.quoteNumber || params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('PDF oluşturulurken hata oluştu');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Teklif bulunamadı</p>
          <button
            onClick={() => navigate('/toov-admin')}
            className="text-white hover:underline"
          >
            Admin paneline dön
          </button>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(quote.status);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button
            onClick={() => navigate('/toov-admin')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Tekliflere Dön</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Yazdır
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              PDF İndir
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden print:border-none print:rounded-none print:bg-white">
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-8 border-b border-zinc-800 print:from-white print:to-white print:border-zinc-200">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center print:bg-black">
                    <span className="text-2xl font-black text-black print:text-white tracking-tighter">HANK</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white print:text-black">TEKLİF</h1>
                    <p className="text-zinc-400 font-mono text-lg print:text-zinc-600">{quote.quoteNumber}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border ${status.color} print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300`}>
                  {status.label}
                </span>
                <p className="text-zinc-500 text-sm mt-2 print:text-zinc-600">
                  Oluşturulma: {new Date(quote.createdAt).toLocaleDateString('tr-TR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-800/50 rounded-xl p-6 print:bg-zinc-50 print:border print:border-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center print:bg-zinc-200">
                    <Building2 className="w-5 h-5 text-zinc-300 print:text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white print:text-black">Bayi Bilgileri</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium text-lg print:text-black">{quote.dealer?.name || 'Bilinmeyen Bayi'}</p>
                  {quote.dealer?.contactPerson && (
                    <p className="text-zinc-400 print:text-zinc-600">{quote.dealer.contactPerson}</p>
                  )}
                  {quote.dealer?.email && (
                    <p className="text-zinc-500 print:text-zinc-500">{quote.dealer.email}</p>
                  )}
                  {quote.dealer?.phone && (
                    <p className="text-zinc-500 print:text-zinc-500">{quote.dealer.phone}</p>
                  )}
                  {quote.dealer?.address && (
                    <p className="text-zinc-500 text-sm print:text-zinc-500">{quote.dealer.address}</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-6 print:bg-zinc-50 print:border print:border-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center print:bg-zinc-200">
                    <FileText className="w-5 h-5 text-zinc-300 print:text-zinc-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-white print:text-black">Teklif Detayları</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 print:text-zinc-600">Geçerlilik Tarihi</span>
                    <span className="text-white font-medium print:text-black">
                      {quote.validUntil 
                        ? new Date(quote.validUntil).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : 'Belirtilmemiş'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 print:text-zinc-600">Ödeme Koşulu</span>
                    <span className="text-white font-medium print:text-black">{getPaymentTermsLabel(quote.paymentTerms)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 print:text-zinc-600">KDV</span>
                    <span className="text-white font-medium print:text-black">{quote.includesVat ? 'Dahil' : 'Hariç'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 print:text-black">Ürünler</h3>
              <div className="border border-zinc-800 rounded-xl overflow-hidden print:border-zinc-300">
                <table className="w-full">
                  <thead className="bg-zinc-800/70 print:bg-zinc-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">Ürün</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">Beden</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">Adet</th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">Birim Fiyat</th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">İskonto</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print:text-zinc-600">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 print:divide-zinc-200">
                    {quote.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/30 print:hover:bg-transparent">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {item.productImage ? (
                              <img 
                                src={item.productImage} 
                                alt={item.productName} 
                                className="w-16 h-16 object-cover rounded-lg border border-zinc-700 print:border-zinc-300"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 print:bg-zinc-100 print:border-zinc-300">
                                <Package className="w-6 h-6 text-zinc-500" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium print:text-black">{item.productName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-white font-medium print:text-black">{item.variantDetails || '-'}</td>
                        <td className="px-4 py-4 text-center text-white font-medium print:text-black">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-white print:text-black">
                          {parseFloat(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                        <td className="px-4 py-4 text-center">
                          {parseFloat(item.discountPercent) > 0 ? (
                            <span className="inline-flex px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded print:bg-emerald-50 print:text-emerald-600">
                              %{item.discountPercent}
                            </span>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-white font-semibold print:text-black">
                          {parseFloat(item.lineTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="bg-zinc-800/50 px-6 py-4 print:bg-zinc-50">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex justify-between w-64">
                      <span className="text-zinc-400 print:text-zinc-600">Ara Toplam:</span>
                      <span className="text-white print:text-black">
                        {parseFloat(quote.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                    {parseFloat(quote.discountTotal) > 0 && (
                      <div className="flex justify-between w-64">
                        <span className="text-emerald-400 print:text-emerald-600">Toplam İskonto:</span>
                        <span className="text-emerald-400 print:text-emerald-600">
                          -{parseFloat(quote.discountTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between w-64 pt-2 border-t border-zinc-700 print:border-zinc-300">
                      <span className="text-white font-semibold text-lg print:text-black">Genel Toplam:</span>
                      <span className="text-white font-bold text-xl print:text-black">
                        {parseFloat(quote.grandTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {quote.notes && (
              <div className="bg-zinc-800/30 rounded-xl p-6 print:bg-zinc-50 print:border print:border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-400 mb-3 print:text-zinc-600">Notlar</h3>
                <p className="text-zinc-300 whitespace-pre-wrap print:text-zinc-700">{quote.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-zinc-800 print:hidden">
              <div className="text-sm text-zinc-500">
                Son güncelleme: {new Date(quote.updatedAt).toLocaleString('tr-TR')}
              </div>
              
              {quote.status === 'draft' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateStatusMutation.mutate('sent')}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Teklifi Gönder
                  </button>
                </div>
              )}

              {quote.status === 'sent' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateStatusMutation.mutate('rejected')}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors font-medium disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reddet
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate('accepted')}
                    disabled={updateStatusMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Kabul Et
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-zinc-600 text-sm print:mt-12">
          <p>HANK Spor Giyim</p>
          <p>www.hank.com.tr • info@hank.com.tr</p>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
