import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

export default function DistanceSalesAgreement() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mesafeli Satış Sözleşmesi - HANK Athletics"
        description="HANK Athletics mesafeli satış sözleşmesi ve alışveriş koşulları."
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
            <span className="text-foreground">Mesafeli Satış Sözleşmesi</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-8">
              MESAFELİ SATIŞ SÖZLEŞMESİ
            </h1>

            <div className="prose prose-invert prose-zinc max-w-none">
              <h2>1) Taraflar</h2>
              <p><strong>Satıcı:</strong> Hank Athletics</p>
              <p><strong>Adres:</strong> ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27 İZMİR/GAZİEMİR</p>
              <p><strong>Telefon:</strong> <a href="tel:+905321350391">0532 135 03 91</a></p>
              <p><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></p>
              <p><strong>Web Sitesi:</strong> <a href="https://www.hank.com.tr">www.hank.com.tr</a></p>
              <p><strong>Alıcı:</strong> Hank.com.tr üzerinden sipariş veren müşteridir. Alıcının adı, soyadı, adresi ve iletişim bilgileri sipariş formunda yer alır.</p>

              <h2>2) Sözleşmenin Konusu</h2>
              <p>
                Bu sözleşmenin konusu, alıcının <strong>www.hank.com.tr</strong> web sitesinden elektronik ortamda sipariş verdiği ürünün satışı, teslimatı, ödemesi ve tarafların 6502 sayılı Kanun ile Mesafeli Satışlar Yönetmeliği hükümleri doğrultusunda hak ve yükümlülüklerinin belirlenmesidir.
              </p>

              <h2>3) Ürün/Hizmet Bilgileri</h2>
              <p>
                Ürünlerin türü, miktarı, marka/model, renk, satış fiyatı, ödeme şekli ve teslimat bilgileri, alıcı tarafından sistemde onaylanmadan önce görüntülenir. Bu bilgiler sipariş özet ekranında yer alır ve elektronik olarak onaylanır.
              </p>

              <h2>4) Teslimat Şartları</h2>
              <p>
                Ürünler, alıcının belirttiği teslimat adresine gönderilir. Tüm teslimat detayları <Link href="/teslimat-kosullari" className="text-white hover:underline">Teslimat Koşulları</Link> sayfasında açıklanmıştır. Teslimat süresi, stok durumu ve kargo firmasının operasyonel yoğunluğuna göre değişebilir.
              </p>

              <h2>5) Ödeme Yöntemi</h2>
              <p>
                Alıcı, ürünün bedelini kredi kartı, banka kartı, havale/EFT veya sitede sunulan diğer ödeme yöntemleriyle ödeyebilir. Ödeme tamamlanmadan sipariş işleme alınmaz. Promosyon fiyatları ve indirim kodları belirtilen süre ve koşullar için geçerlidir.
              </p>

              <h2>6) Cayma Hakkı</h2>
              <p>
                <strong>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde</strong> herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir. Bu hakkın kullanılabilmesi için ürünün kullanılmamış, orijinal ambalajında ve yeniden satılabilir durumda olması gerekir.
              </p>
              <p>
                Cayma hakkını kullanmak isteyen alıcılar bu süre içinde <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine yazılı olarak bildirmelidir.
              </p>

              <h2>7) Cayma Hakkının Kullanılamayacağı Durumlar</h2>
              <ul>
                <li>Alıcının isteği üzerine özel olarak üretilen veya kişiselleştirilmiş ürünlerde,</li>
                <li>İç çamaşırı, çorap, aksesuar vb. hijyen veya sağlık nedeniyle iade edilemeyecek ürünlerde,</li>
                <li>Ambalajı açılmış, etiketi çıkarılmış, kullanılmış veya yeniden satılamayacak duruma gelmiş ürünlerde,</li>
                <li>Çabuk bozulabilecek veya son kullanma tarihi geçebilecek ürünlerde cayma hakkı kullanılamaz.</li>
              </ul>

              <h2>8) İade Süreci</h2>
              <p>
                Alıcı cayma hakkını kullandığında, ürünün fatura, kutu, aksesuar ve tüm parçalarıyla birlikte eksiksiz olarak Hank Athletics'e iade edilmesi gerekir. Ürün tarafımıza ulaştıktan sonra <strong>en geç 7 iş günü</strong> içinde, alıcının ödeme yaptığı yönteme ücret iadesi yapılır.
              </p>

              <h2>9) Garanti ve Ürün Sorumluluğu</h2>
              <p>
                Satıcı, satılan ürünlerdeki üretim kaynaklı hatalardan sorumludur. Kullanıcı hatası (yıkama talimatlarına uyulmaması, fiziksel hasar, yanlış kullanım vb.) kaynaklı arızalar garanti kapsamı dışındadır. Garanti süreleri ve koşulları ürüne göre değişebilir.
              </p>

              <h2>10) Gizlilik ve Kişisel Verilerin Korunması</h2>
              <p>
                Alıcının kişisel verileri, <Link href="/kvkk" className="text-white hover:underline">KVKK Aydınlatma Metni</Link>'nde belirtilen ilkeler doğrultusunda işlenir. Satıcı, müşterilerin kişisel bilgilerini üçüncü kişilerle paylaşmaz; paylaşım yalnızca teslimat ve ödeme süreçlerinde zorunlu olduğu ölçüde gerçekleşebilir.
              </p>

              <h2>11) Mücbir Sebepler</h2>
              <p>
                Doğal afet, savaş, salgın, grev, kargo firması kaynaklı gecikmeler gibi öngörülemeyen durumlarda taraflar, yükümlülüklerini yerine getirememelerinden dolayı sorumlu tutulamaz.
              </p>

              <h2>12) Uyuşmazlık Çözümü</h2>
              <p>
                Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı'nın açıkladığı parasal limitler dahilinde alıcı veya satıcının yerleşim yerindeki <strong>Tüketici Hakem Heyetleri</strong> veya <strong>Tüketici Mahkemeleri</strong> yetkilidir.
              </p>

              <h2>13) Yürürlük</h2>
              <p>
                Alıcı, <strong>www.hank.com.tr</strong> üzerinden sipariş vererek bu sözleşmenin tüm şartlarını elektronik olarak kabul etmiş sayılır. Bu sözleşme, siparişin tamamlanmasıyla yürürlüğe girer.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
