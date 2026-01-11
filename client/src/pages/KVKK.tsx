import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Shield, Lock, Eye, FileText } from 'lucide-react';

const highlights = [
  { icon: Shield, label: 'Veri Güvenliği', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { icon: Lock, label: 'SSL Koruması', color: 'text-green-400', bg: 'bg-green-500/20' },
  { icon: Eye, label: 'Şeffaflık', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { icon: FileText, label: 'Yasal Uyum', color: 'text-orange-400', bg: 'bg-orange-500/20' },
];

export default function KVKK() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO 
        title="KVKK Aydınlatma Metni - HANK Athletics"
        description="HANK Athletics kişisel verilerin korunması kanunu aydınlatma metni."
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
                <span className="text-foreground">KVKK Aydınlatma Metni</span>
              </motion.nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Kişisel Veri Koruma</span>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-wider mb-6">
                  KVKK<br />
                  <span className="text-muted-foreground">AYDINLATMA METNİ</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında bilgilendirme.
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
                <h2>1) Veri Sorumlusu</h2>
                <p>
                  KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında kişisel verilerinizi işleyen veri sorumlusu aşağıdaki şekildedir:
                </p>
                <p><strong>Hank Athletics</strong></p>
                <p><strong>Web Sitesi:</strong> <a href="https://www.hank.com.tr">www.hank.com.tr</a></p>
                <p><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></p>
                <p><strong>Telefon:</strong> <a href="tel:+905321350391">0532 135 03 91</a></p>
                <p><strong>Adres:</strong> ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27 İZMİR/GAZİEMİR</p>

                <h2>2) Kişisel Verilerin Toplanma Yöntemi</h2>
                <p>
                  Kişisel verileriniz; <strong>www.hank.com.tr</strong> web sitesi, sosyal medya hesaplarımız, müşteri destek hattı, e-posta veya fiziksel formlar aracılığıyla tamamen veya kısmen otomatik yollarla toplanmaktadır.
                </p>

                <h2>3) Kişisel Verilerin İşlenme Amaçları</h2>
                <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                <ul>
                  <li>Ürün ve hizmet satış süreçlerinin yönetimi,</li>
                  <li>Sipariş, teslimat, iade ve ödeme işlemlerinin gerçekleştirilmesi,</li>
                  <li>Müşteri memnuniyeti, destek ve şikayet yönetimi,</li>
                  <li>Kampanya, indirim, bilgilendirme ve pazarlama faaliyetlerinin yürütülmesi,</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi,</li>
                  <li>Sistem güvenliği, dolandırıcılık önleme ve kayıt saklama yükümlülükleri.</li>
                </ul>

                <h2>4) İşlenen Kişisel Veri Kategorileri</h2>
                <ul>
                  <li>Kimlik bilgileri (ad, soyad, TC kimlik no vb.)</li>
                  <li>İletişim bilgileri (telefon, e-posta, adres vb.)</li>
                  <li>Finansal veriler (ödeme bilgileri, fatura bilgileri)</li>
                  <li>Alışveriş geçmişi ve sipariş detayları</li>
                  <li>Web sitesi kullanım verileri, IP adresi ve çerez bilgileri</li>
                </ul>

                <h2>5) Kişisel Verilerin Aktarımı</h2>
                <p>Kişisel verileriniz yalnızca aşağıdaki durumlarda paylaşılmaktadır:</p>
                <ul>
                  <li>Kargo firmaları (teslimat süreçleri için),</li>
                  <li>Bankalar ve ödeme hizmeti sağlayıcıları (ödeme işlemleri için),</li>
                  <li>Resmi kurumlar, yasal yükümlülükler kapsamında,</li>
                  <li>Bilgi altyapısı ve barındırma hizmeti sağlayıcıları (sunucu, e-posta, güvenlik hizmetleri).</li>
                </ul>
                <p>Kişisel veriler ticari amaçlarla üçüncü kişilerle paylaşılmaz veya satılmaz.</p>

                <h2>6) Saklama Süresi</h2>
                <p>
                  Kişisel verileriniz, yasal yükümlülükler ve ilgili mevzuatın öngördüğü süre boyunca saklanır. Bu sürenin ardından veriler güvenli bir şekilde silinir, yok edilir veya anonimleştirilir.
                </p>

                <h2>7) Kişisel Verilerin Güvenliği</h2>
                <p>
                  Hank Athletics, kişisel verilerinizi korumak için gerekli tüm teknik ve idari tedbirleri almaktadır. Verileriniz SSL sertifikaları, güvenli sunucular ve erişim yetkilendirme sistemleriyle korunmaktadır.
                </p>

                <h2>8) İlgili Kişi Olarak Haklarınız</h2>
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu'nun 11. maddesi uyarınca, ilgili kişi olarak aşağıdaki haklara sahipsiniz:
                </p>
                <ul>
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
                  <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                  <li>KVKK'ya aykırı işlenmiş verilerin silinmesini veya yok edilmesini isteme,</li>
                  <li>Otomatik sistemlerle yapılan analiz sonucu aleyhinize çıkan bir sonuca itiraz etme,</li>
                  <li>Hukuka aykırı işleme nedeniyle zarara uğramanız halinde tazminat talep etme.</li>
                </ul>

                <h2>9) Başvuru Yöntemi</h2>
                <p>
                  KVKK kapsamındaki haklarınızı kullanmak için, kimliğinizi doğrulayacak belgelerle birlikte aşağıdaki yöntemlerle başvuru yapabilirsiniz:
                </p>
                <ul>
                  <li><strong>E-posta:</strong> <a href="mailto:info@hank.com.tr">info@hank.com.tr</a></li>
                  <li><strong>Adres:</strong> ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27 İZMİR/GAZİEMİR</li>
                </ul>
                <p>
                  <strong>Başvuru sonucunuz en geç 30 gün</strong> içinde ücretsiz olarak tarafınıza bildirilir.
                </p>

                <h2>10) Çerez Kullanımı</h2>
                <p>
                  Web sitemiz, kullanıcı deneyimini iyileştirmek ve site performansını ölçmek için çerezler kullanmaktadır. Çerez tercihlerinizi tarayıcınız üzerinden istediğiniz zaman değiştirebilirsiniz.
                </p>

                <h2>11) Güncellemeler ve Değişiklikler</h2>
                <p>
                  Bu Aydınlatma Metni, mevzuat değişiklikleri ve şirket politikalarına uygun olarak güncellenebilir. Güncel versiyon her zaman <strong>www.hank.com.tr</strong> adresinde yayınlanır.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
