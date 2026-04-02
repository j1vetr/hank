import { Link } from 'wouter';
import { Instagram } from 'lucide-react';
import { useCategories } from '@/hooks/useProducts';

export function Footer() {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="bg-black text-white py-16 lg:py-20 px-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-16 mb-16">
          <div className="col-span-2 lg:col-span-1">
            <img
              src="/uploads/branding/hank-logo.svg"
              alt="HANK"
              className="h-10 mb-8"
              loading="lazy"
            />
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Premium fitness ve bodybuilding giyim markası.
              Güç, performans ve stil bir arada.
            </p>
            <a
              href="https://www.instagram.com/hankathletics"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
              <Instagram className="w-4 h-4" />
              @hankathletics
            </a>
            <div className="mt-6 text-xs text-white/30 space-y-1">
              <p>ATIFBEY MAH. 67 SK. No:33/27</p>
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
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-6">Alışveriş</h4>
            <ul className="space-y-4 text-sm text-white/60">
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
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-6">Destek</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link href="/teslimat-kosullari" className="hover:text-white transition-colors">Teslimat Koşulları</Link></li>
              <li><Link href="/iptal-ve-iade" className="hover:text-white transition-colors">İptal ve İade</Link></li>
              <li><Link href="/mesafeli-satis-sozlesmesi" className="hover:text-white transition-colors">Mesafeli Satış</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40 mb-6">Kurumsal</h4>
            <ul className="space-y-4 text-sm text-white/60">
              <li><Link href="/hakkimizda" className="hover:text-white transition-colors">Hakkımızda</Link></li>
              <li><Link href="/kvkk" className="hover:text-white transition-colors">KVKK</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">© 2025 HANK. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>Geliştirici & Tasarım:</span>
            <a href="https://toov.com.tr" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <img src="https://toov.com.tr/assets/toov_logo-DODYNPrj.png" alt="TOOV" className="h-4" loading="lazy" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
