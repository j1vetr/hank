import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, X, User, LogOut, ChevronDown, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { SearchOverlay } from '@/components/SearchOverlay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuItemData {
  id: string;
  title: string;
  type: 'category' | 'link' | 'submenu';
  categoryId: string | null;
  url: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  openInNewTab: boolean;
  category?: { id: string; name: string; slug: string } | null;
  children?: MenuItemData[];
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
    exit: { y: -40, opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
  },
};

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 48));

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const { data: menuItems = [] } = useQuery<MenuItemData[]>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await fetch('/api/menu');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const getHref = (item: MenuItemData) => {
    if (item.type === 'category' && item.category) return `/kategori/${item.category.slug}`;
    if (item.type === 'link' && item.url) return item.url;
    return '#';
  };

  const topItems = menuItems.slice(0, Math.ceil(menuItems.length / 2));
  const bottomItems = menuItems.slice(Math.ceil(menuItems.length / 2));

  const DesktopNavLink = ({ item }: { item: MenuItemData }) => {
    const href = getHref(item);
    const isActive = location === href;
    const hasChildren = item.type === 'submenu' && item.children?.length;

    if (hasChildren) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`relative inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.18em] uppercase transition-colors ${isActive ? 'text-black' : 'text-black/70 hover:text-black'} nav-link-hover`}>
              {item.title}
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-white border-black/8 shadow-lg rounded-none min-w-[180px]">
            {item.children!.map(child => (
              <DropdownMenuItem key={child.id} onClick={() => navigate(getHref(child))}
                className="text-[11px] tracking-wider uppercase text-black hover:bg-black/5 cursor-pointer py-2.5">
                {child.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const isExternal = item.type === 'link' && item.url?.startsWith('http');
    const cls = `relative inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.18em] uppercase transition-colors nav-link-hover ${isActive ? 'text-black' : 'text-black/70 hover:text-black'}`;

    if (isExternal || item.openInNewTab) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} data-testid={`link-nav-${item.title}`}>{item.title}<ArrowUpRight className="w-2.5 h-2.5 opacity-50" /></a>;
    }
    return <Link href={href} className={cls} data-testid={`link-nav-${item.title}`}>{item.title}</Link>;
  };

  return (
    <>
      {/* ── Announcement bar ── */}
      <div className="hidden lg:flex bg-black h-9 items-center justify-center gap-0">
        <div className="flex items-center gap-8 px-10">
          <div className="flex items-center gap-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50 shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span className="text-[10px] tracking-[0.28em] uppercase text-white/70 font-medium">World Wide Shipping</span>
          </div>
          <span className="w-px h-3 bg-white/15" />
          <div className="flex items-center gap-2.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50 shrink-0">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <span className="text-[10px] tracking-[0.28em] uppercase text-white/70 font-medium">2.500 TL Üstü Ücretsiz Kargo</span>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <motion.header
        initial={false}
        animate={{ height: scrolled ? 56 : 68 }}
        transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
        className="fixed lg:static top-0 left-0 right-0 z-40 bg-white border-b border-black/8 flex items-center"
        style={{ willChange: 'height' }}
      >
        <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* Left: hamburger (mobile) + nav (desktop) */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <button
                data-testid="button-mobile-menu"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden flex flex-col gap-[5px] p-1 -ml-1 group"
                aria-label="Menü"
              >
                <span className="block h-px w-5 bg-black transition-all group-hover:w-6" />
                <span className="block h-px w-4 bg-black transition-all group-hover:w-6" />
                <span className="block h-px w-6 bg-black" />
              </button>

              <nav className="hidden lg:flex items-center gap-7">
                {topItems.length > 0
                  ? topItems.map(item => <DesktopNavLink key={item.id} item={item} />)
                  : (
                    <>
                      <Link href="/magaza" className={`relative text-[11px] font-medium tracking-[0.18em] uppercase nav-link-hover ${location === '/magaza' ? 'text-black' : 'text-black/70 hover:text-black'}`}>Mağaza</Link>
                      <Link href="/kategori/tshirt" className="relative text-[11px] font-medium tracking-[0.18em] uppercase text-black/70 hover:text-black transition-colors nav-link-hover">T-Shirt</Link>
                    </>
                  )
                }
              </nav>
            </div>

            {/* Center: Logo */}
            <Link href="/" data-testid="link-logo" className="shrink-0">
              <motion.div whileHover={{ opacity: 0.75 }} transition={{ duration: 0.2 }}>
                <img
                  src="/uploads/branding/hank-logo.svg"
                  alt="HANK"
                  className="h-8 lg:h-11"
                  data-testid="img-logo"
                />
              </motion.div>
            </Link>

            {/* Right: nav (desktop) + icons */}
            <div className="flex items-center gap-6 flex-1 justify-end">
              <nav className="hidden lg:flex items-center gap-7">
                {bottomItems.length > 0
                  ? bottomItems.map(item => <DesktopNavLink key={item.id} item={item} />)
                  : (
                    <>
                      <Link href="/kategori/esofman" className="relative text-[11px] font-medium tracking-[0.18em] uppercase text-black/70 hover:text-black transition-colors nav-link-hover">Eşofman</Link>
                      <Link href="/kategori/sort" className="relative text-[11px] font-medium tracking-[0.18em] uppercase text-black/70 hover:text-black transition-colors nav-link-hover">Şort</Link>
                    </>
                  )
                }
              </nav>

              {/* Icons */}
              <div className="flex items-center gap-0.5">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 text-black/45 hover:text-black transition-colors"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4" />
                </motion.button>

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button whileTap={{ scale: 0.9 }} className="p-2.5 text-black/45 hover:text-black transition-colors" data-testid="button-account">
                        <User className="w-4 h-4" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-black/8 shadow-lg rounded-none min-w-[160px]">
                      <DropdownMenuItem disabled className="text-[10px] tracking-widest text-black/30 uppercase">{user.firstName || user.email}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/hesabim')} className="text-[11px] tracking-wider uppercase text-black hover:bg-black/5 cursor-pointer py-2.5">
                        <User className="w-3.5 h-3.5 mr-2" />Hesabım
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-[11px] tracking-wider uppercase text-black hover:bg-black/5 cursor-pointer py-2.5">
                        <LogOut className="w-3.5 h-3.5 mr-2" />Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/giris">
                    <motion.button whileTap={{ scale: 0.9 }} className="p-2.5 text-black/45 hover:text-black transition-colors" data-testid="button-account">
                      <User className="w-4 h-4" />
                    </motion.button>
                  </Link>
                )}

                <Link href="/sepet">
                  <motion.button whileTap={{ scale: 0.9 }} className="p-2.5 text-black/45 hover:text-black transition-colors relative" data-testid="button-cart">
                    <ShoppingBag className="w-4 h-4" />
                    <AnimatePresence>
                      {totalItems > 0 && (
                        <motion.span
                          key="badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black text-white text-[8px] font-bold flex items-center justify-center rounded-full"
                        >
                          {totalItems > 9 ? '9+' : totalItems}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile fullscreen menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden"
          >
            {/* Background HANK watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
              <span className="font-display text-[280px] leading-none text-white/[0.025] tracking-tighter">
                HANK
              </span>
            </div>

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-5 pb-6 border-b border-white/8">
              <Link href="/" onClick={() => setMobileOpen(false)}>
                <img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-8 invert" />
              </Link>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(false)}
                className="p-2 text-white/40 hover:text-white transition-colors"
                data-testid="button-close-menu"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Nav links */}
            <nav className="relative z-10 flex-1 overflow-y-auto px-6 py-8">
              <motion.div
                variants={stagger.container}
                initial="initial"
                animate="animate"
                exit="initial"
                className="flex flex-col"
              >
                {/* Default home link */}
                <motion.div variants={stagger.item}>
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="block py-5 border-b border-white/8 group"
                    data-testid="link-mobile-home"
                  >
                    <span className="font-display text-[44px] leading-none text-white/70 group-hover:text-white transition-colors tracking-wide">
                      ANA SAYFA
                    </span>
                  </Link>
                </motion.div>

                <motion.div variants={stagger.item}>
                  <Link
                    href="/magaza"
                    onClick={() => setMobileOpen(false)}
                    className="block py-5 border-b border-white/8 group"
                    data-testid="link-mobile-magaza"
                  >
                    <span className="font-display text-[44px] leading-none text-white/70 group-hover:text-white transition-colors tracking-wide">
                      MAĞAZA
                    </span>
                  </Link>
                </motion.div>

                {menuItems.map((item, i) => {
                  const href = getHref(item);
                  const hasChildren = item.type === 'submenu' && item.children?.length;

                  return (
                    <motion.div key={item.id} variants={stagger.item}>
                      {hasChildren ? (
                        <div>
                          <button
                            onClick={() => setExpandedMobileItem(expandedMobileItem === item.id ? null : item.id)}
                            className="w-full flex items-center justify-between py-5 border-b border-white/8 group"
                            data-testid={`button-mobile-sub-${item.id}`}
                          >
                            <span className="font-display text-[44px] leading-none text-white/70 group-hover:text-white transition-colors tracking-wide">
                              {item.title.toUpperCase()}
                            </span>
                            <motion.span
                              animate={{ rotate: expandedMobileItem === item.id ? 45 : 0 }}
                              className="text-white/30 text-3xl font-light leading-none"
                            >
                              +
                            </motion.span>
                          </button>
                          <AnimatePresence>
                            {expandedMobileItem === item.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pl-4 bg-white/[0.02]"
                              >
                                {item.children!.map(child => (
                                  <Link
                                    key={child.id}
                                    href={getHref(child)}
                                    onClick={() => setMobileOpen(false)}
                                    className="block py-3.5 text-sm text-white/40 hover:text-white tracking-[0.15em] uppercase transition-colors border-b border-white/5"
                                  >
                                    {child.title}
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={href}
                          onClick={() => setMobileOpen(false)}
                          className="block py-5 border-b border-white/8 group"
                          data-testid={`link-mobile-${item.id}`}
                        >
                          <span className="font-display text-[44px] leading-none text-white/70 group-hover:text-white transition-colors tracking-wide">
                            {item.title.toUpperCase()}
                          </span>
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </nav>

            {/* Bottom: account + cart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative z-10 flex items-center justify-between px-6 py-6 border-t border-white/8"
            >
              <div className="flex items-center gap-5">
                {user ? (
                  <>
                    <Link href="/hesabim" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors">
                      <User className="w-3.5 h-3.5" />
                      Hesabım
                    </Link>
                    <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }} className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors">
                      <LogOut className="w-3.5 h-3.5" />
                      Çıkış
                    </button>
                  </>
                ) : (
                  <Link href="/giris" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors">
                    <User className="w-3.5 h-3.5" />
                    Giriş Yap
                  </Link>
                )}
              </div>

              <Link href="/sepet" onClick={() => setMobileOpen(false)}>
                <div className="relative flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/40 hover:text-white transition-colors">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Sepet
                  {totalItems > 0 && (
                    <span className="w-4 h-4 bg-white text-black text-[9px] font-bold flex items-center justify-center rounded-full">
                      {totalItems}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
