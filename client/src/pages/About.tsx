import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Instagram, Dumbbell, Target, Heart, Zap, Award, Users, Truck, ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';

const values = [
  { icon: Dumbbell, label: 'Güç', color: 'from-red-500/20 to-red-600/20', iconColor: 'text-red-400' },
  { icon: Target, label: 'Performans', color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
  { icon: Heart, label: 'Tutku', color: 'from-pink-500/20 to-pink-600/20', iconColor: 'text-pink-400' },
  { icon: Zap, label: 'Stil', color: 'from-yellow-500/20 to-yellow-600/20', iconColor: 'text-yellow-400' },
];

const stats = [
  { number: '10K+', label: 'Mutlu Müşteri' },
  { number: '99%', label: 'Memnuniyet' },
  { number: '24', label: 'Saat Kargo' },
  { number: '100%', label: 'Türk Üretimi' },
];

const features = [
  { icon: Award, title: 'Premium Kalite', desc: 'En yüksek kalite standartlarında üretim' },
  { icon: Users, title: 'Müşteri Odaklı', desc: '7/24 destek ve kolay iade garantisi' },
  { icon: Truck, title: 'Hızlı Teslimat', desc: '2.500₺ üzeri siparişlerde ücretsiz kargo' },
  { icon: ShieldCheck, title: 'Güvenli Alışveriş', desc: 'SSL korumalı ödeme sistemleri' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Hakkımızda - HANK Athletics"
        description="HANK Athletics - Türkiye'nin premium fitness ve bodybuilding giyim markası. Güç, performans ve stil bir arada."
      />
      <Header />
      
      <main className="pt-28 pb-20">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-background to-zinc-900/50" />
          <div className="absolute inset-0 noise-overlay opacity-30" />
          
          <div className="relative px-6 py-16 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <motion.nav 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-muted-foreground mb-10"
              >
                <Link href="/" data-testid="link-home">Ana Sayfa</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground">Hakkımızda</span>
              </motion.nav>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Türkiye'nin Premium Spor Giyim Markası</span>
                  <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl tracking-wider mb-6">
                    HANK<br />
                    <span className="text-muted-foreground">ATHLETICS</span>
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Fitness ve bodybuilding tutkunları için tasarlanmış premium spor giyim. 
                    Türkiye'de üretilen ürünlerimiz, atletik performansı destekleyen ve 
                    şık görünümü bir araya getiren tasarımlara sahiptir.
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    {values.map((value, index) => (
                      <motion.div
                        key={value.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-gradient-to-br ${value.color} border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2`}
                      >
                        <value.icon className={`w-5 h-5 ${value.iconColor}`} />
                        <span className="font-medium">{value.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center hover:border-white/20 transition-colors"
                    >
                      <p className="font-display text-4xl lg:text-5xl tracking-wide text-white mb-2">{stat.number}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Neden Biz?</span>
              <h2 className="font-display text-3xl sm:text-4xl tracking-wider">FARK YARATAN ÖZELLİKLER</h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-zinc-800 rounded-2xl p-6 hover:border-white/20 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors">
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-display text-xl tracking-wide mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 px-6 bg-zinc-900/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4 block">Hikayemiz</span>
              <h2 className="font-display text-3xl sm:text-4xl tracking-wider mb-8">VİZYON & MİSYON</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-display text-2xl tracking-wide mb-4">VİZYONUMUZ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Sporcuların antrenman ve günlük yaşamlarında kendilerini güçlü ve özgüvenli 
                  hissetmelerini sağlamak. Her ürünümüz, vücut hareketlerine uyum sağlayan kesimler, 
                  nefes alan kumaşlar ve dayanıklı dikişlerle üretilmektedir.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="font-display text-2xl tracking-wide mb-4">MİSYONUMUZ</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Kaliteden ödün vermeden, sporcuların ihtiyaçlarını karşılayan ve onları bir adım 
                  öne çıkaran ürünler sunmak. HANK Athletics olarak, her müşterimizin memnuniyetini 
                  ön planda tutuyoruz.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-8 lg:p-10 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                  <Instagram className="w-8 h-8 text-pink-400" />
                </div>
                <h3 className="font-display text-2xl tracking-wider mb-4">BİZİ TAKİP EDİN</h3>
                <p className="text-muted-foreground mb-6">
                  En yeni ürünler, kampanyalar ve ilham verici içerikler için Instagram'da bizi takip edin.
                </p>
                <a 
                  href="https://www.instagram.com/hankathletics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 px-8 rounded-full hover:opacity-90 transition-opacity"
                  data-testid="link-instagram"
                >
                  <Instagram className="w-5 h-5" />
                  @hankathletics
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 lg:p-10"
              >
                <h3 className="font-display text-2xl tracking-wider mb-8">İLETİŞİM BİLGİLERİ</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Adres</p>
                      <p className="font-medium">ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27 İZMİR/GAZİEMİR</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                      <a href="tel:+905321350391" className="font-medium hover:text-white/80 transition-colors">0532 135 03 91</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">E-posta</p>
                      <a href="mailto:info@hank.com.tr" className="font-medium hover:text-white/80 transition-colors">info@hank.com.tr</a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
