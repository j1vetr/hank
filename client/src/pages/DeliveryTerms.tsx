import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Truck, Package, Clock, MapPin, Phone, Mail } from 'lucide-react';

const highlights = [
  { icon: Package, label: 'Hazırlık & Kargo', desc: '1-3 iş günü içinde kargoya verilir', color: 'text-white', bg: 'bg-white/10' },
  { icon: Truck, label: 'Ücretsiz Kargo', desc: '2.500₺ ve üzeri siparişlerde', color: 'text-green-400', bg: 'bg-green-500/20' },
  { icon: Clock, label: 'Teslimat Süresi', desc: 'İstanbul içi 1-2, diğer iller 2-5 iş günü', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: MapPin, label: 'Kargo Takibi', desc: 'E-posta ve SMS ile takip numarası', color: 'text-purple-400', bg: 'bg-purple-500/20' },
];

export default function DeliveryTerms() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="Teslimat Koşulları - HANK Athletics"
        description="HANK Athletics teslimat koşulları, kargo süreleri ve ücretsiz kargo bilgileri."
      />
      <Header />
      
      <main className="pt-28 pb-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-background to-zinc-900/50" />
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
                <span className="text-foreground">Teslimat Koşulları</span>
              </motion.nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Kargo & Teslimat</span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wider mb-6">
                  TESLİMAT<br />
                  <span className="text-muted-foreground">KOŞULLARI</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                  Siparişlerinizi güvenli ve hızlı bir şekilde kapınıza ulaştırıyoruz. Teslimat süreleri ve koşullarımız hakkında tüm detayları aşağıda bulabilirsiniz.
                </p>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {highlights.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-white/20 transition-colors"
                    >
                      <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-4`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <h3 className="font-semibold mb-1">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
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
                <h2>1) Genel Bilgiler</h2>
                <p>
                  Hank Athletics olarak siparişlerinizi güvenli, hızlı ve eksiksiz şekilde teslim etmeyi hedefliyoruz. 
                  Web sitemiz üzerinden yapılan tüm alışverişlerde aşağıdaki koşullar geçerlidir.
                </p>

                <h2>2) Sipariş Onayı ve Hazırlık Süreci</h2>
                <ul>
                  <li>Ödeme onaylandıktan sonra siparişiniz hazırlanmaya başlar.</li>
                  <li>Ürünler genellikle <strong>1-3 iş günü</strong> içinde kargoya verilir.</li>
                  <li>Stok durumu ve yoğunluğa bağlı olarak bu süre değişebilir.</li>
                </ul>

                <h2>3) Tahmini Teslimat Süreleri</h2>
                <ul>
                  <li><strong>İstanbul içi:</strong> 1-2 iş günü</li>
                  <li><strong>Büyükşehirler:</strong> 2-3 iş günü</li>
                  <li><strong>Diğer iller:</strong> 2-5 iş günü</li>
                </ul>
                <p>Kargo firmasının yoğunluğu, hava koşulları ve resmi tatiller gibi faktörler teslimat sürelerini etkileyebilir.</p>

                <h2>4) Kargo Takibi</h2>
                <p>
                  Siparişiniz kargoya verildiğinde, <strong>kargo takip numarası</strong> e-posta ve/veya SMS yoluyla tarafınıza iletilir. Bu numara ile kargo firmasının web sitesinden gönderinizi takip edebilirsiniz.
                </p>

                <h2>5) Ücretsiz Kargo</h2>
                <p>
                  <strong>2.500 ₺ ve üzeri</strong> siparişlerde kargo ücretsizdir. Bu tutarın altındaki siparişlerde standart kargo ücreti uygulanır.
                </p>

                <h2>6) Teslimat Esnasında Dikkat Edilecekler</h2>
                <ul>
                  <li>Ürünü teslim alırken paketi mutlaka kontrol edin.</li>
                  <li>Hasar veya eksiklik durumunda kargo görevlisi eşliğinde <strong>tutanak</strong> tutturun.</li>
                  <li>Hasarlı ürünler için 24 saat içinde <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine bilgi verin.</li>
                </ul>

                <h2>7) Adres Değişikliği</h2>
                <p>
                  Siparişiniz henüz kargoya verilmediyse, teslimat adresinizi değiştirmek için <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresi üzerinden bizimle iletişime geçebilirsiniz.
                </p>

                <h2>8) Alıcı Bulunamadığında</h2>
                <p>
                  Alıcı adreste bulunamadığında, kargo firması genellikle <strong>2-3 teslimat denemesi</strong> yapar. Ulaşılamazsa ürün şubeye bırakılır veya geri döner. Geri dönüş durumunda yeniden gönderim için ek ücret talep edilebilir.
                </p>

                <h2>9) İletişim</h2>
                <p>
                  Kargo ve teslimatla ilgili sorularınız için bizimle iletişime geçebilirsiniz:
                </p>
                <ul>
                  <li><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></li>
                  <li><strong>Telefon:</strong> <a href="tel:+905321350391">0532 135 03 91</a></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
