import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Instagram, Dumbbell, Target, Heart, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Hakkımızda - HANK Athletics"
        description="HANK Athletics - Türkiye'nin premium fitness ve bodybuilding giyim markası. Güç, performans ve stil bir arada."
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
            <span className="text-foreground">Hakkımızda</span>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider mb-8">
              HAKKIMIZDA
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <p className="font-semibold">Güç</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6" />
                </div>
                <p className="font-semibold">Performans</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="font-semibold">Tutku</p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="font-semibold">Stil</p>
              </div>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none mb-12">
              <h2>HANK Athletics</h2>
              <p>
                HANK Athletics, fitness ve bodybuilding tutkunları için tasarlanmış premium spor giyim markasıdır. 
                Türkiye'de üretilen ürünlerimiz, en yüksek kalite standartlarında, atletik performansı destekleyen 
                ve şık görünümü bir araya getiren tasarımlara sahiptir.
              </p>

              <h2>Vizyonumuz</h2>
              <p>
                Sporcuların antrenman ve günlük yaşamlarında kendilerini güçlü ve özgüvenli hissetmelerini sağlamak. 
                Her ürünümüz, vücut hareketlerine uyum sağlayan kesimler, nefes alan kumaşlar ve dayanıklı dikişlerle 
                üretilmektedir.
              </p>

              <h2>Misyonumuz</h2>
              <p>
                Kaliteden ödün vermeden, sporcuların ihtiyaçlarını karşılayan ve onları bir adım öne çıkaran 
                ürünler sunmak. HANK Athletics olarak, her müşterimizin memnuniyetini ön planda tutuyoruz.
              </p>

              <h2>Değerlerimiz</h2>
              <ul>
                <li><strong>Kalite:</strong> Her ürünümüzde premium malzeme ve işçilik</li>
                <li><strong>Performans:</strong> Atletik ihtiyaçlara özel tasarım</li>
                <li><strong>Stil:</strong> Salondan sokağa uyumlu modern çizgiler</li>
                <li><strong>Müşteri Odaklılık:</strong> Kolay iade, hızlı teslimat, 7/24 destek</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl p-8 text-center">
              <h3 className="font-display text-2xl tracking-wider mb-4">BİZİ TAKİP EDİN</h3>
              <p className="text-muted-foreground mb-6">
                En yeni ürünler, kampanyalar ve ilham verici içerikler için Instagram'da bizi takip edin.
              </p>
              <a 
                href="https://www.instagram.com/hankathletics"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
                data-testid="link-instagram"
              >
                <Instagram className="w-5 h-5" />
                @hankathletics
              </a>
            </div>

            <div className="mt-12 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">İletişim Bilgileri</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-white">Adres:</strong> ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27 İZMİR/GAZİEMİR</p>
                <p><strong className="text-white">Telefon:</strong> <a href="tel:+905321350391" className="text-white hover:underline">0532 135 03 91</a></p>
                <p><strong className="text-white">E-posta:</strong> <a href="mailto:info@hank.com.tr" className="text-white hover:underline">info@hank.com.tr</a></p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
