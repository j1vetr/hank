import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, RotateCcw, Clock, Package, AlertCircle } from 'lucide-react';

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="İptal ve İade Politikası - HANK Athletics"
        description="HANK Athletics ürün iade, değişim ve iptal koşulları."
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
            <span className="text-foreground">İptal ve İade Politikası</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-8">
              İPTAL VE İADE POLİTİKASI
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold mb-1">14 Gün Cayma Hakkı</h3>
                <p className="text-xs text-muted-foreground">Hiçbir gerekçe göstermeden iade</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold mb-1">7 İş Günü</h3>
                <p className="text-xs text-muted-foreground">Ücret iadesi süresi</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-semibold mb-1">Kolay Değişim</h3>
                <p className="text-xs text-muted-foreground">Beden ve renk değişimi</p>
              </div>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none">
              <h2>1) Genel İlkeler</h2>
              <ul>
                <li>İade/iptal işlemleri 6502 sayılı Kanun ve Mesafeli Satış Sözleşmeleri Yönetmeliği'ne uygun şekilde yürütülür.</li>
                <li>İşlem için sipariş numaranızı hazır bulundurunuz.</li>
                <li>Tüm başvurular <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine yazılı olarak yapılmalıdır.</li>
              </ul>

              <h2>2) Sipariş İptali</h2>
              <ul>
                <li><strong>Kargo çıkışından önce:</strong> Sipariş numaranızla birlikte <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine yazarak iptal talebinde bulunabilirsiniz. Mümkünse aynı gün işleme alınır.</li>
                <li><strong>Kargo çıkışından sonra:</strong> İptal yapılamaz. Bu durumda <strong>iade</strong> süreci uygulanır.</li>
              </ul>

              <h2>3) Cayma Hakkı (14 Gün)</h2>
              <p>
                <strong>Ürünü teslim aldığınız tarihten itibaren 14 gün içinde</strong> herhangi bir gerekçe göstermeksizin cayma hakkınızı kullanabilirsiniz.
              </p>
              <ul>
                <li>Ürün kullanılmamış, orijinal ambalajında, etiketleri tam ve yeniden satılabilir durumda olmalıdır.</li>
                <li>Fatura, aksesuar, hediye/promosyon ürünleri ve tüm parçalar eksiksiz gönderilmelidir.</li>
                <li>Cayma hakkı bildirimi <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine yazılı olarak yapılmalıdır.</li>
              </ul>

              <h2>4) Cayma Hakkının Kullanılamayacağı Durumlar</h2>
              <ul>
                <li>Kişiye özel üretilen/kişiselleştirilen ürünlerde,</li>
                <li>Hijyen nedeniyle iade edilemeyecek ürünlerde (iç çamaşırı, çorap, aksesuar vb.) ambalajı açılmış olanlarda,</li>
                <li>Ambalajı açılmış, etiketi çıkarılmış, kullanılmış veya değiştirilmiş ürünlerde,</li>
                <li>Çabuk bozulabilecek veya son kullanma tarihi geçebilecek ürünlerde.</li>
              </ul>

              <h2>5) İade Nasıl Yapılır?</h2>
              <ol>
                <li><strong>İade talebi oluşturun:</strong> Sipariş numarası ve iade nedeninizle birlikte <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine e-posta gönderin.</li>
                <li><strong>Onay ve Kargo Bilgisi:</strong> İade uygunluğunuz onaylandıktan sonra gönderim bilgileri iletilir.</li>
                <li><strong>Paketleme:</strong> Ürünü orijinal kutusuyla, fatura ve aksesuarlarıyla birlikte güvenli şekilde paketleyin.</li>
                <li><strong>Gönderim:</strong> Belirtilen adrese anlaşmalı kargo firmasıyla gönderin ve <strong>takip numarasını</strong> bizimle paylaşın.</li>
              </ol>
              <p>
                <strong>İade Kargo Ücreti:</strong> Cayma hakkına dayalı iade gönderilerinde kargo ücreti <strong>alıcıya</strong> aittir. 
                <strong>Ayıplı/hasarlı/yanlış ürün</strong> kaynaklı iadelerde kargo ücreti <strong>Hank Athletics</strong> tarafından karşılanır.
              </p>

              <h2>6) Ücret İadesi Süresi</h2>
              <p>
                Ürün iadeniz depoya ulaşıp uygunluk kontrolü tamamlandıktan sonra <strong>en geç 7 iş günü</strong> içinde ücret iadesi, siparişte kullandığınız ödeme yöntemine yapılır.
              </p>
              <ul>
                <li>Banka/kart işlem süreleri bankanıza göre değişebilir.</li>
                <li>Taksitli alışverişlerde iade, banka tarafından taksitli olarak yansıtılabilir.</li>
                <li>Havale/EFT ile yapılan ödemeler, gönderen IBAN'a iade edilir.</li>
              </ul>

              <h2>7) Değişim (Beden/Renk)</h2>
              <ul>
                <li>Değişim talepleri stok uygunluğuna göre karşılanır.</li>
                <li>Değişim için ürünün kullanılmamış ve yeniden satılabilir durumda olması gerekir.</li>
                <li>Stok yoksa iade süreci uygulanır.</li>
                <li>Değişim kargo ücretleri, kusur kaynaklı değilse alıcıya aittir.</li>
              </ul>

              <h2>8) Ayıplı / Hasarlı / Yanlış Ürün</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 not-prose mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-400 mb-1">Önemli!</p>
                    <p className="text-sm text-muted-foreground">
                      Teslim anında paketi kontrol ediniz. Hasarlı/ezik/yırtık paketleri kargo görevlisine 
                      <strong> tutanak</strong> tutturarak teslim almayınız.
                    </p>
                  </div>
                </div>
              </div>
              <p>
                Ürün kaynaklı kusur/yanlışlık tespit ederseniz, teslimden itibaren <strong>24 saat</strong> içinde fotoğraf ve açıklamayla 
                <a href="mailto:info@hank.com.tr"> info@hank.com.tr</a> adresine bildiriniz. Onaylanan durumlarda kargo ücreti bize aittir ve değişim/para iadesi seçenekleri sunulur.
              </p>

              <h2>9) Kampanya, Hediye ve Set Ürünleri</h2>
              <ul>
                <li>Kampanyalı ürün iadelerinde, kampanya şartları (minimum sepet tutarı, ikinci ürüne indirim vb.) bozulursa ilgili indirimler iptal edilerek net tutar yeniden hesaplanır.</li>
                <li>Hediye/promosyon ürünleri varsa, iade ile birlikte eksiksiz gönderilmelidir.</li>
                <li>Set ürünlerde iade, setin <strong>tamamı</strong> için yapılır (aksi belirtilmedikçe).</li>
              </ul>

              <h2>10) Muhasebe ve Fatura</h2>
              <ul>
                <li>Fatura aslı veya e-fatura bilgisi iade paketine eklenmelidir.</li>
                <li>Kurumsal alışverişlerde iade için iade faturası düzenlenmesi gerekebilir.</li>
              </ul>

              <h2>11) İade Adresi ve İletişim</h2>
              <p><em>İade adresi ve depo bilgisi, talebiniz onaylandığında e-posta ile paylaşılır.</em></p>
              <ul>
                <li><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></li>
                <li><strong>Telefon:</strong> <a href="tel:+905321350391">0532 135 03 91</a></li>
                <li><strong>Web:</strong> <a href="https://www.hank.com.tr">www.hank.com.tr</a></li>
              </ul>

              <h2>12) İlgili Belgeler</h2>
              <ul>
                <li><Link href="/mesafeli-satis-sozlesmesi" className="text-white hover:underline">Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link href="/teslimat-kosullari" className="text-white hover:underline">Teslimat Koşulları</Link></li>
                <li><Link href="/kvkk" className="text-white hover:underline">KVKK Aydınlatma Metni</Link></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
