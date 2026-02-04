import { Link } from 'wouter';
import { Instagram } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';

export function Footer() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="relative bg-black border-t border-white/10 py-16 lg:py-20 px-6">
      <div className="absolute inset-0 noise-overlay opacity-30" />
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <img
              src="/uploads/branding/hank-logo.svg"
              alt="HANK"
              className="h-10 invert mb-6"
              loading="lazy"
            />
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Premium fitness ve bodybuilding giyim markası. 
              Güç, performans ve stil bir arada.
            </p>
            <div className="flex items-center gap-4 mb-6">
              <a 
                href="https://www.instagram.com/hankathletics" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center hover:from-pink-500/40 hover:to-purple-500/40 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="text-xs text-white/40 space-y-1">
              <p>ATIFBEY MAH. 67 SK. Dış kapı no: 33 İç kapı no: 27</p>
              <p>İZMİR / GAZİEMİR</p>
              <p className="mt-2">
                <a href="tel:+905321350391" className="hover:text-white transition-colors">0532 135 03 91</a>
              </p>
              <p>
                <a href="mailto:info@hank.com.tr" className="hover:text-white transition-colors">info@hank.com.tr</a>
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-display text-lg tracking-wider mb-6">ALIŞVERİŞ</h4>
            <ul className="space-y-4 text-sm text-white/50">
              {categories.slice(0, 4).map(cat => (
                <li key={cat.id}>
                  <Link href={`/kategori/${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-lg tracking-wider mb-6">DESTEK</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/teslimat-kosullari" className="hover:text-white transition-colors">Teslimat Koşulları</Link></li>
              <li><Link href="/iptal-ve-iade" className="hover:text-white transition-colors">İptal ve İade Politikası</Link></li>
              <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-lg tracking-wider mb-6">KURUMSAL</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
              <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © 2025 HANK. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span>Geliştirici & Tasarım:</span>
            <a 
              href="https://toov.com.tr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <img 
                src="https://toov.com.tr/assets/toov_logo-DODYNPrj.png" 
                alt="TOOV" 
                className="h-5"
                loading="lazy"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
