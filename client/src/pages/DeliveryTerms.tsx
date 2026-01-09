import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Truck, Package, Clock, MapPin, Phone, Mail } from 'lucide-react';

export default function DeliveryTerms() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Teslimat Koşulları - HANK Athletics"
        description="HANK Athletics teslimat koşulları, kargo süreleri ve ücretsiz kargo bilgileri."
      />
      <Header />
      
      <main className="pt-36 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground mb-8"
          >
            <Link href="/" data-testid="link-home">Ana Sayfa</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Teslimat Koşulları</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-8">
              TESLİMAT KOŞULLARI
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Hazırlık & Kargo</h3>
                </div>
                <p className="text-sm text-muted-foreground">Ödeme onayından sonra genellikle 1-3 iş günü içinde kargoya verilir.</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-semibold">Ücretsiz Kargo</h3>
                </div>
                <p className="text-sm text-muted-foreground">2.500 ₺ ve üzeri siparişlerde kargo ücretsizdir.</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Teslimat Süresi</h3>
                </div>
                <p className="text-sm text-muted-foreground">İstanbul içi 1-2 iş günü, diğer illere 2-5 iş günü.</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold">Kargo Takibi</h3>
                </div>
                <p className="text-sm text-muted-foreground">Sipariş kargoya verildiğinde takip numarası e-posta/SMS ile gönderilir.</p>
              </div>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none">
              <h2>1) Genel Bilgiler</h2>
              <p>
                Hank Athletics olarak siparişlerinizi güvenli, hızlı ve eksiksiz şekilde teslim etmeyi hedefliyoruz. 
                Web sitemiz üzerinden yapılan tüm alışverişlerde aşağıdaki koşullar geçerlidir.
              </p>

              <h2>2) Sipariş Onayı ve Hazırlık Süreci</h2>
              <ul>
                <li>Ödemesi onaylanan siparişler <strong>1-3 iş günü</strong> içinde kargoya verilir.</li>
                <li>Yoğun dönemlerde/kampanyalarda hazırlık süresi <strong>5 iş gününe</strong> kadar uzayabilir.</li>
                <li>Stokta olmayan veya ön siparişli ürünlerde müşteri temsilcimiz sizinle iletişime geçer.</li>
              </ul>

              <h2>3) Kargo Ücreti ve Ücretsiz Kargo Politikası</h2>
              <p>
                <strong>Ücretsiz Kargo:</strong> 2.500 ₺ ve üzeri siparişlerde kargo ücreti alınmaz.
              </p>
              <p>
                2.500 ₺ altı siparişlerde kargo ücreti, ödeme sayfasında sistem tarafından otomatik hesaplanarak toplama eklenir. 
                Sezonluk ücretsiz kargo kampanyaları ana sayfa/ödeme ekranında duyurulur.
              </p>

              <h2>4) Kargo ve Teslimat Süreci</h2>
              <ul>
                <li>Gönderiler, operasyonel uygunluğa göre anlaşmalı kargo firmalarıyla (örn. Yurtiçi/MNG/Aras) yapılır.</li>
                <li>Türkiye'nin tüm illerine teslimat yapılmaktadır.</li>
                <li>Kargo çıkışı yapıldığında <strong>takip numarası</strong> e-posta/SMS ile paylaşılır.</li>
                <li>Teslimat süresi kargo yoğunluğu, mesafe ve hava koşullarına göre değişebilir.</li>
              </ul>

              <h2>5) Teslimat Adresi ve Sorumluluk</h2>
              <ul>
                <li>Teslimat, sipariş sırasında belirttiğiniz adrese yapılır. Eksik/hatalı adresler teslimatı geciktirebilir.</li>
                <li>Alıcı adreste bulunamazsa paket en yakın şubeye yönlendirilebilir; kargo firması bilgi notu bırakır.</li>
                <li>Belirlenen sürede teslim alınmayan gönderiler depomuza geri döner; yeniden gönderim kargo ücreti alıcıya aittir.</li>
              </ul>

              <h2>6) Hasarlı veya Eksik Ürün Teslimi</h2>
              <p>
                <strong>Teslim anında paketi kontrol ediniz.</strong> Hasarlı/ezik/yırtık paketleri kargo görevlisine 
                <strong> tutanak</strong> tutturarak teslim almayınız.
              </p>
              <p>
                Eksik veya yanlış ürün için teslimden itibaren <strong>24 saat</strong> içinde sipariş numaranızla birlikte 
                <a href="mailto:info@hank.com.tr"> info@hank.com.tr</a> adresine yazınız.
              </p>

              <h2>7) Kargo Takibi</h2>
              <p>
                Takip numaranızla kargo firmasının web sitesinden gerçek zamanlı izleme yapabilirsiniz. 
                "Hesabım &gt; Siparişlerim" sayfasından da durumu görebilirsiniz.
              </p>

              <h2>8) Teslim Edilemeyen Siparişler</h2>
              <ul>
                <li>Alıcıya ulaşılamadığında paket belirli süre şubede bekletilir.</li>
                <li>Süre içinde teslim alınmazsa depomuza döner; yeniden gönderim ücreti alıcıya aittir.</li>
                <li>İade durumunda ürün depoya ulaştığında süreç başlatılır.</li>
              </ul>

              <h2>9) Uluslararası Teslimatlar</h2>
              <p>
                Şu an için teslimatlar yalnızca <strong>Türkiye</strong> sınırları içinde yapılmaktadır. 
                Yurt dışı gönderim altyapısı üzerinde çalışmalar devam etmektedir.
              </p>

              <h2>10) İletişim</h2>
              <p>Teslimatla ilgili tüm sorularınız için bize ulaşabilirsiniz:</p>
              <ul>
                <li><strong>Telefon:</strong> <a href="tel:+905321350391">0532 135 03 91</a></li>
                <li><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></li>
                <li><strong>Web:</strong> <a href="https://www.hank.com.tr">www.hank.com.tr</a></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
