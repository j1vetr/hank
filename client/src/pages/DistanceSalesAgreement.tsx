import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, FileText, Shield, CheckCircle, Clock } from 'lucide-react';

const highlights = [
  { icon: FileText, label: 'Yasal Sözleşme', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: Shield, label: '6502 Sayılı Kanun', color: 'text-green-400', bg: 'bg-green-500/20' },
  { icon: CheckCircle, label: 'Güvence', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { icon: Clock, label: '14 Gün Cayma', color: 'text-orange-400', bg: 'bg-orange-500/20' },
];

export default function DistanceSalesAgreement() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Mesafeli Satış Sözleşmesi - HANK Athletics"
        description="HANK Athletics mesafeli satış sözleşmesi ve alışveriş koşulları."
      />
      <Header />
      
      <main className="pt-28 pb-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-background to-zinc-900/50" />
          <div className="absolute inset-0 noise-overlay opacity-30" />
          
          <div className="relative px-4 sm:px-6 py-12 lg:py-16">
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
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Yasal Bilgiler</span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wider mb-6">
                  MESAFELİ SATIŞ<br />
                  <span className="text-muted-foreground">SÖZLEŞMESİ</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                  6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında hazırlanmış resmi sözleşme metnidir.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {highlights.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center hover:border-white/20 transition-colors"
                    >
                      <div className={`w-10 h-10 ${item.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <p className="text-xs font-medium">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:tracking-wide prose-h2:text-xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-3 prose-h2:mb-4">
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
