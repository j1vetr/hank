import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, RotateCcw, Clock, Package, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const highlights = [
  { icon: RotateCcw, label: '14 Gün Cayma Hakkı', desc: 'Hiçbir gerekçe göstermeden iade', color: 'text-green-400', bg: 'bg-green-500/20' },
  { icon: Clock, label: '7 İş Günü', desc: 'Ücret iadesi süresi', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: Package, label: 'Kolay Değişim', desc: 'Beden ve renk değişimi', color: 'text-purple-400', bg: 'bg-purple-500/20' },
];

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="İptal ve İade Politikası - HANK Athletics"
        description="HANK Athletics ürün iade, değişim ve iptal koşulları."
      />
      <Header />
      
      <main className="pt-28 pb-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-zinc-900/50" />
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
                <span className="text-foreground">İptal ve İade Politikası</span>
              </motion.nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">İade & Değişim</span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wider mb-6">
                  İPTAL VE İADE<br />
                  <span className="text-muted-foreground">POLİTİKASI</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                  Müşteri memnuniyeti önceliğimizdir. Kolay iade ve değişim süreçleriyle alışverişlerinizi güvence altına alıyoruz.
                </p>

                <div className="grid sm:grid-cols-3 gap-4">
                  {highlights.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 text-center hover:border-white/20 transition-colors"
                    >
                      <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                        <item.icon className={`w-7 h-7 ${item.color}`} />
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
          <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="font-display text-lg tracking-wide">İade Edilebilir</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    Kullanılmamış, orijinal ambalajında ürünler
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    Etiketleri sökülmemiş ürünler
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    Fatura ile birlikte gönderilen ürünler
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="font-display text-lg tracking-wide">İade Edilemez</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    Kullanılmış veya yıkanmış ürünler
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    İç çamaşırı, çorap gibi hijyenik ürünler
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    Kişiselleştirilmiş/özel üretim ürünler
                  </li>
                </ul>
              </div>
            </motion.div>

            <div className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 lg:p-10">
              <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:tracking-wide prose-h2:text-xl prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-3 prose-h2:mb-4">
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

                <h2>4) İade Süreci</h2>
                <p>İade süreci şu şekilde işler:</p>
                <ol>
                  <li>İade talebinizi <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine iletin ve <strong>sipariş numaranızı</strong> belirtin.</li>
                  <li>Onay sonrası ürünü <strong>orijinal ambalajında</strong>, fatura ve aksesuarlarıyla birlikte paketleyin.</li>
                  <li>Belirtilen adrese kargo ile gönderin.</li>
                  <li>Ürün tarafımıza ulaştığında kontrol edilir.</li>
                  <li>Kontrol sonrası <strong>en geç 7 iş günü</strong> içinde ücret iadesi yapılır.</li>
                </ol>

                <h2>5) Ücret İadesi</h2>
                <ul>
                  <li>Ücret, ödeme yapılan yönteme (kredi kartı, banka kartı, havale) iade edilir.</li>
                  <li>İade, banka işlem sürelerine bağlı olarak hesabınıza 5-10 iş günü içinde yansıyabilir.</li>
                  <li>Kapıda ödeme ile alınan siparişlerde iade, IBAN bilgilerinize yapılır.</li>
                </ul>

                <h2>6) Ürün Değişimi</h2>
                <p>
                  Beden veya renk değişikliği için yine <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresinden bilgi verebilirsiniz. Değişim için mevcut ürünün iade koşullarını karşılaması gerekir.
                </p>

                <h2>7) Hasarlı veya Hatalı Ürün</h2>
                <p>
                  Teslimat sırasında veya açılışta fark edilen hasar ya da üretim hatasını <strong>24 saat</strong> içinde <a href="mailto:info@hank.com.tr">info@hank.com.tr</a> adresine bildirin. Fotoğraflı belge gönderilmesi süreci hızlandırır.
                </p>

                <h2>8) Kargo Ücreti</h2>
                <ul>
                  <li><strong>Cayma hakkı kullanımında:</strong> Kargo ücreti alıcıya aittir.</li>
                  <li><strong>Hatalı/hasarlı ürün iadesi:</strong> Kargo ücreti tarafımızca karşılanır.</li>
                </ul>

                <h2>9) İletişim</h2>
                <p>İade ve iptal işlemleri için destek ekibimize ulaşabilirsiniz:</p>
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
