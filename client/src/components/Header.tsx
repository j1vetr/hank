import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: MenuItemData[];
}

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  
  const { data: menuItems = [] } = useQuery<MenuItemData[]>({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await fetch('/api/menu');
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });
  
  const getMenuItemHref = (item: MenuItemData): string => {
    if (item.type === 'category' && item.category) {
      return `/kategori/${item.category.slug}`;
    }
    if (item.type === 'link' && item.url) {
      return item.url;
    }
    return '#';
  };

  const hasMenuItems = menuItems.length > 0;
  // Split menu: up to 4 items on the LEFT of the logo, up to 3 on the RIGHT (max 7 visible)
  const leftMenuItems = hasMenuItems ? menuItems.slice(0, 4) : [];
  const rightMenuItems = hasMenuItems ? menuItems.slice(4, 7) : [];

  const renderNavItem = (item: MenuItemData, dropdownAlign: 'start' | 'end') => {
    const href = getMenuItemHref(item);
    const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;
    const baseClass = `relative text-[10.5px] tracking-[0.14em] xl:text-[12px] xl:tracking-[0.18em] uppercase font-medium transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white whitespace-nowrap ${
      location === href ? 'text-white' : 'text-white/70'
    }`;

    if (hasChildren) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <button
              data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
              className={`${baseClass} flex items-center gap-1 group`}
            >
              {item.title}
              <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={dropdownAlign} className="w-48 bg-zinc-900 border-white/10">
            {item.children!.map((child) => (
              <DropdownMenuItem
                key={child.id}
                onClick={() => navigate(getMenuItemHref(child))}
                data-testid={`link-dropdown-${child.title.toLowerCase().replace(/\s/g, '-')}`}
              >
                {child.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const isExternal = item.type === 'link' && item.url?.startsWith('http');
    const innerSpan = (
      <span className={`${baseClass} group`}>
        {item.title}
        <motion.span
          className="absolute -bottom-1.5 left-0 right-0 h-px bg-white origin-left"
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
        {location === href && (
          <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-white" />
        )}
      </span>
    );

    if (isExternal || item.openInNewTab) {
      return (
        <a
          key={item.id}
          href={href}
          target={item.openInNewTab ? '_blank' : undefined}
          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
          data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
        >
          {innerSpan}
        </a>
      );
    }

    return (
      <Link key={item.id} href={href} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
        {innerSpan}
      </Link>
    );
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 lg:overflow-visible">
        <div className="bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-xl border-b border-white/5 lg:overflow-visible">
          <div className="hidden lg:block border-b border-white/5 overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
            <div className="relative h-9 flex items-center">
              <div className="absolute inset-0 flex items-center animate-marquee-slow whitespace-nowrap">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-16 mx-12">
                    <span className="flex items-center gap-2 text-xs tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-white font-medium">WORLDWIDE SHIPPING</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span className="text-white font-medium">2.500₺ ÜZERİ ÜCRETSİZ KARGO</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* MOBILE LAYOUT: 3-zone flex with absolute centered logo */}
            <div className="lg:hidden flex items-center justify-between h-20 relative">
              <button
                data-testid="button-mobile-menu"
                className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>

              <Link href="/" data-testid="link-logo-mobile-wrap" className="absolute left-1/2 -translate-x-1/2">
                <img
                  src="/uploads/branding/hank-icon.png"
                  alt="HANK"
                  className="h-11 w-11"
                  data-testid="img-logo-mobile"
                />
              </Link>

              <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-full border border-white/10">
                <button
                  data-testid="button-search"
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-4 h-4" />
                </button>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button data-testid="button-account" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                        <User className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10">
                      <DropdownMenuItem disabled className="text-muted-foreground">
                        {user.firstName || user.email}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/hesabim')}>
                        <User className="w-4 h-4 mr-2" /> Hesabım
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                        <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/giris">
                    <button data-testid="button-account" className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                      <User className="w-4 h-4" />
                    </button>
                  </Link>
                )}
                <Link href="/sepet">
                  <button data-testid="button-cart" className="p-1.5 hover:bg-white/10 rounded-full transition-colors relative">
                    <ShoppingBag className="w-4 h-4" />
                    {totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black text-[10px] font-bold flex items-center justify-center rounded-full"
                      >
                        {totalItems}
                      </motion.span>
                    )}
                  </button>
                </Link>
              </div>
            </div>

            {/* DESKTOP LAYOUT — "Crown Medallion":
                Pure 3-column grid [1fr | logo | 1fr] keeps the logo at viewport center.
                Logo is rendered as a circular medallion that protrudes BELOW the bar.
                Actions float absolutely top-right; an invisible mirror floats top-left
                to keep the visual mass perfectly symmetric. Supports up to 8 nav items. */}
            <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] items-center h-20 relative">
              {/* INVISIBLE LEFT MIRROR (matches actions pill exactly) — preserves perceived symmetry */}
              <div
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 invisible pointer-events-none"
              >
                <div className="flex items-center gap-1 p-1.5 rounded-full border border-white/10">
                  <div className="p-2.5"><Search className="w-[18px] h-[18px]" /></div>
                  <div className="p-2.5"><User className="w-[18px] h-[18px]" /></div>
                  <div className="p-2.5"><ShoppingBag className="w-[18px] h-[18px]" /></div>
                </div>
              </div>

              {/* LEFT NAV: up to 4 items, right-aligned next to logo.
                  Padding leaves room for the invisible left mirror so items never collide with it. */}
              <nav className="flex items-center gap-x-3 xl:gap-x-4 justify-end min-w-0 pl-[160px] pr-2">
                {!hasMenuItems && (
                  <Link href="/magaza" data-testid="link-nav-magaza">
                    <span className={`relative text-[11px] tracking-[0.2em] uppercase font-medium transition-colors hover:text-white group whitespace-nowrap ${
                      location === '/magaza' ? 'text-white' : 'text-white/70'
                    }`}>
                      MAĞAZA
                      <motion.span
                        className="absolute -bottom-1.5 left-0 right-0 h-px bg-white origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {location === '/magaza' && (
                        <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-white" />
                      )}
                    </span>
                  </Link>
                )}
                {hasMenuItems && leftMenuItems.map((item) => renderNavItem(item, 'start'))}
              </nav>

              {/* CENTER LOGO: HANK wordmark, perfectly centered, with a downward chevron
                  protrusion that extends below the bar into the hero — premium "banner" accent. */}
              <Link
                href="/"
                data-testid="link-logo"
                className="relative block px-8 xl:px-12 group"
                aria-label="HANK ana sayfa"
              >
                {/* Soft ambient glow behind the wordmark on hover */}
                <div className="absolute inset-0 -inset-x-4 bg-white/[0.04] blur-2xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Chevron protrusion: V-shape extending below the header bar */}
                <svg
                  aria-hidden="true"
                  className="absolute left-1/2 -translate-x-1/2 top-full -mt-px pointer-events-none"
                  width="180"
                  height="36"
                  viewBox="0 0 180 36"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  {/* Solid background that matches the header bar — gives the V a "carved" look */}
                  <path
                    d="M0 0 L90 32 L180 0 Z"
                    className="fill-background/95"
                  />
                  {/* Subtle outline */}
                  <path
                    d="M0 0 L90 32 L180 0"
                    className="stroke-white/10"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>

                <motion.div
                  whileHover={{ scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="relative"
                >
                  <img
                    src="/uploads/branding/hank-logo.svg"
                    alt="HANK"
                    className="h-11 invert drop-shadow-[0_2px_12px_rgba(255,255,255,0.08)]"
                    data-testid="img-logo"
                  />
                </motion.div>
              </Link>

              {/* RIGHT NAV: up to 4 items, left-aligned next to logo.
                  Padding leaves room for the actions pill so items never collide with it. */}
              <nav className="flex items-center gap-x-3 xl:gap-x-4 justify-start min-w-0 pl-2 pr-[160px]">
                {hasMenuItems && rightMenuItems.map((item) => renderNavItem(item, 'end'))}
              </nav>

              {/* ACTIONS: floating glass pill, absolute top-right of the bar */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                <div className="flex items-center gap-1 p-1.5 bg-white/[0.04] rounded-full border border-white/10 backdrop-blur-md shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)]">
                  <button
                    data-testid="button-search-desktop"
                    className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Ara"
                  >
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          data-testid="button-account-desktop"
                          className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                          aria-label="Hesap"
                        >
                          <User className="w-[18px] h-[18px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10">
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          {user.firstName || user.email}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/hesabim')}>
                          <User className="w-4 h-4 mr-2" /> Hesabım
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                          <LogOut className="w-4 h-4 mr-2" /> Çıkış Yap
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href="/giris">
                      <button
                        data-testid="button-account-desktop"
                        className="p-2.5 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Giriş yap"
                      >
                        <User className="w-[18px] h-[18px]" />
                      </button>
                    </Link>
                  )}
                  <Link href="/sepet">
                    <button
                      data-testid="button-cart-desktop"
                      className="p-2.5 hover:bg-white/10 rounded-full transition-colors relative"
                      aria-label="Sepet"
                    >
                      <ShoppingBag className="w-[18px] h-[18px]" />
                      {totalItems > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[11px] font-bold flex items-center justify-center rounded-full"
                        >
                          {totalItems}
                        </motion.span>
                      )}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-gradient-to-b from-zinc-900 to-black z-50 lg:hidden overflow-y-auto"
            >
              <div className="absolute inset-0 noise-overlay opacity-30 pointer-events-none" />
              
              <div className="relative">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                    <img
                      src="/uploads/branding/hank-logo.svg"
                      alt="HANK"
                      className="h-8 invert"
                    />
                  </Link>
                  <button
                    data-testid="button-close-menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <nav className="p-6">
                  <Link
                    href="/"
                    data-testid="link-mobile-nav-home"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.span 
                      className="block font-display text-3xl tracking-wider hover:text-muted-foreground transition-colors mb-6"
                      whileHover={{ x: 10 }}
                    >
                      ANA SAYFA
                    </motion.span>
                  </Link>
                  
                  <Link
                    href="/magaza"
                    data-testid="link-mobile-nav-magaza"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <motion.span 
                      className="block font-display text-3xl tracking-wider hover:text-muted-foreground transition-colors mb-6"
                      whileHover={{ x: 10 }}
                    >
                      MAĞAZA
                    </motion.span>
                  </Link>
                  
                  <div className="h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent mb-6" />
                  
                  {hasMenuItems ? (
                    <>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Menü</p>
                      {menuItems.map((item, index) => {
                        const href = getMenuItemHref(item);
                        const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;
                        
                        if (hasChildren) {
                          return (
                            <div key={item.id}>
                              <button
                                onClick={() => setExpandedSubmenu(expandedSubmenu === item.id ? null : item.id)}
                                className="w-full flex items-center justify-between py-3 border-b border-white/5"
                                data-testid={`button-mobile-submenu-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                              >
                                <motion.span
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="font-display text-2xl tracking-wider hover:text-muted-foreground transition-colors"
                                >
                                  {item.title.toUpperCase()}
                                </motion.span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSubmenu === item.id ? 'rotate-180' : ''}`} />
                              </button>
                              <AnimatePresence>
                                {expandedSubmenu === item.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden pl-4"
                                  >
                                    {item.children!.map((child, childIndex) => (
                                      <Link
                                        key={child.id}
                                        href={getMenuItemHref(child)}
                                        onClick={() => setMobileMenuOpen(false)}
                                        data-testid={`link-mobile-submenu-${child.title.toLowerCase().replace(/\s/g, '-')}`}
                                      >
                                        <motion.span
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: childIndex * 0.05 }}
                                          className="block font-display text-xl tracking-wider hover:text-muted-foreground transition-colors py-2 border-b border-white/5"
                                        >
                                          {child.title.toUpperCase()}
                                        </motion.span>
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        }
                        
                        const isExternal = item.type === 'link' && item.url?.startsWith('http');
                        
                        if (isExternal || item.openInNewTab) {
                          return (
                            <a
                              key={item.id}
                              href={href}
                              target={item.openInNewTab ? '_blank' : undefined}
                              rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                              onClick={() => setMobileMenuOpen(false)}
                              data-testid={`link-mobile-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                            >
                              <motion.span
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="block font-display text-2xl tracking-wider hover:text-muted-foreground transition-colors py-3 border-b border-white/5"
                                whileHover={{ x: 10 }}
                              >
                                {item.title.toUpperCase()}
                              </motion.span>
                            </a>
                          );
                        }
                        
                        return (
                          <Link
                            key={item.id}
                            href={href}
                            onClick={() => setMobileMenuOpen(false)}
                            data-testid={`link-mobile-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                          >
                            <motion.span
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="block font-display text-2xl tracking-wider hover:text-muted-foreground transition-colors py-3 border-b border-white/5"
                              whileHover={{ x: 10 }}
                            >
                              {item.title.toUpperCase()}
                            </motion.span>
                          </Link>
                        );
                      })}
                    </>
) : null}
                </nav>
                
                <div className="p-6 border-t border-white/10 mt-6">
                  {!user && (
                    <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                      <button className="w-full py-3 bg-white text-black font-bold tracking-wider rounded-lg mb-3">
                        GİRİŞ YAP
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); setSearchOpen(true); }}
                    className="w-full py-3 border border-white/20 font-medium tracking-wider rounded-lg flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Ürün Ara
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
