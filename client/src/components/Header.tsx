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
  category?: { id: string; name: string; slug: string } | null;
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
    if (item.type === 'category' && item.category) return `/kategori/${item.category.slug}`;
    if (item.type === 'link' && item.url) return item.url;
    return '#';
  };

  const hasMenuItems = menuItems.length > 0;
  const leftMenuItems = hasMenuItems ? menuItems.slice(0, Math.ceil(menuItems.length / 2)) : [];
  const rightMenuItems = hasMenuItems ? menuItems.slice(Math.ceil(menuItems.length / 2)) : [];

  const navLinkClass = (href: string) =>
    `relative text-[12px] tracking-[0.18em] uppercase font-medium transition-colors group ${location === href ? 'text-black' : 'text-black/50 hover:text-black'
    }`;

  const NavLink = ({ href, children, external, openInNewTab }: {
    href: string; children: React.ReactNode; external?: boolean; openInNewTab?: boolean;
  }) => {
    const isActive = location === href;
    const cls = navLinkClass(href);
    const underline = (
      <motion.span
        className="absolute -bottom-1 left-0 right-0 h-px bg-black origin-left"
        initial={{ scaleX: isActive ? 1 : 0 }}
        animate={{ scaleX: isActive ? 1 : 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.25 }}
      />
    );
    if (external || openInNewTab) {
      return (
        <a href={href} target={openInNewTab ? '_blank' : undefined} rel={openInNewTab ? 'noopener noreferrer' : undefined} className={cls}>
          {children}{underline}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {children}{underline}
      </Link>
    );
  };

  const renderDesktopItem = (item: MenuItemData) => {
    const href = getMenuItemHref(item);
    const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;
    if (hasChildren) {
      return (
        <DropdownMenu key={item.id}>
          <DropdownMenuTrigger asChild>
            <button className={navLinkClass('#') + ' flex items-center gap-1'}>
              {item.title}
              <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white border-black/10 shadow-lg">
            {item.children!.map(child => (
              <DropdownMenuItem
                key={child.id}
                onClick={() => navigate(getMenuItemHref(child))}
                className="text-black hover:bg-black/5 cursor-pointer"
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
    return (
      <NavLink
        key={item.id}
        href={href}
        external={isExternal}
        openInNewTab={item.openInNewTab}
      >
        <span data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="hidden lg:block bg-black overflow-hidden">
        <div className="relative h-8 flex items-center">
          <div className="absolute inset-0 flex items-center animate-marquee-slow whitespace-nowrap">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-16 mx-12">
                <span className="text-[10px] tracking-[0.22em] uppercase text-white font-medium">
                  Worldwide Shipping
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[10px] tracking-[0.22em] uppercase text-white font-medium">
                  2.500₺ Üzeri Ücretsiz Kargo
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[10px] tracking-[0.22em] uppercase text-white font-medium">
                  1 İş Günü Teslimat
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/8 lg:static lg:bg-white lg:border-b lg:border-black/8">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                data-testid="button-mobile-menu"
                className="p-2 -ml-2 text-black"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop left nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {!hasMenuItems && (
                <NavLink href="/magaza">
                  <span data-testid="link-nav-magaza">Mağaza</span>
                </NavLink>
              )}
              {hasMenuItems && leftMenuItems.map(renderDesktopItem)}
            </nav>

            {/* Logo — centred on mobile, in-flow on desktop */}
            <Link href="/" data-testid="link-logo" className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                <img
                  src="/uploads/branding/hank-icon.png"
                  alt="HANK"
                  className="h-9 w-9 lg:hidden"
                  data-testid="img-logo-mobile"
                />
                <img
                  src="/uploads/branding/hank-logo.svg"
                  alt="HANK"
                  className="hidden lg:block h-11"
                  data-testid="img-logo"
                />
              </motion.div>
            </Link>

            {/* Desktop right nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {hasMenuItems && rightMenuItems.map(renderDesktopItem)}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                data-testid="button-search"
                className="p-2 text-black/60 hover:text-black transition-colors"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button data-testid="button-account" className="p-2 text-black/60 hover:text-black transition-colors">
                      <User className="w-4.5 h-4.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border-black/10 shadow-lg">
                    <DropdownMenuItem disabled className="text-black/40 text-xs">
                      {user.firstName || user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/hesabim')} className="text-black hover:bg-black/5 cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Hesabım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-black hover:bg-black/5 cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/giris">
                  <button data-testid="button-account" className="p-2 text-black/60 hover:text-black transition-colors">
                    <User className="w-4.5 h-4.5" />
                  </button>
                </Link>
              )}

              <Link href="/sepet">
                <button data-testid="button-cart" className="p-2 text-black/60 hover:text-black transition-colors relative">
                  <ShoppingBag className="w-4.5 h-4.5" />
                  {totalItems > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold flex items-center justify-center rounded-full"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/8">
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  <img src="/uploads/branding/hank-logo.svg" alt="HANK" className="h-8" />
                </Link>
                <button
                  data-testid="button-close-menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-black/50 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-6 space-y-1">
                <Link href="/" data-testid="link-mobile-nav-home" onClick={() => setMobileMenuOpen(false)}>
                  <motion.div whileHover={{ x: 4 }} className="py-3 font-display text-2xl tracking-wider text-black border-b border-black/6">
                    Ana Sayfa
                  </motion.div>
                </Link>
                <Link href="/magaza" data-testid="link-mobile-nav-magaza" onClick={() => setMobileMenuOpen(false)}>
                  <motion.div whileHover={{ x: 4 }} className="py-3 font-display text-2xl tracking-wider text-black border-b border-black/6">
                    Mağaza
                  </motion.div>
                </Link>

                {hasMenuItems && menuItems.map((item, index) => {
                  const href = getMenuItemHref(item);
                  const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;

                  if (hasChildren) {
                    return (
                      <div key={item.id}>
                        <button
                          onClick={() => setExpandedSubmenu(expandedSubmenu === item.id ? null : item.id)}
                          className="w-full flex items-center justify-between py-3 border-b border-black/6"
                          data-testid={`button-mobile-submenu-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <span className="font-display text-2xl tracking-wider text-black">{item.title.toUpperCase()}</span>
                          <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${expandedSubmenu === item.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedSubmenu === item.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-4"
                            >
                              {item.children!.map(child => (
                                <Link
                                  key={child.id}
                                  href={getMenuItemHref(child)}
                                  onClick={() => setMobileMenuOpen(false)}
                                  data-testid={`link-mobile-submenu-${child.title.toLowerCase().replace(/\s/g, '-')}`}
                                >
                                  <div className="py-2.5 text-sm text-black/60 hover:text-black transition-colors">
                                    {child.title}
                                  </div>
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link key={item.id} href={href} onClick={() => setMobileMenuOpen(false)} data-testid={`link-mobile-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}>
                      <motion.div whileHover={{ x: 4 }} className="py-3 font-display text-2xl tracking-wider text-black border-b border-black/6">
                        {item.title.toUpperCase()}
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>

              <div className="px-6 pt-4 space-y-4">
                {user ? (
                  <>
                    <Link href="/hesabim" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-2 text-sm text-black/60 hover:text-black py-2 transition-colors">
                        <User className="w-4 h-4" />
                        Hesabım
                      </div>
                    </Link>
                    <button
                      onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 text-sm text-black/60 hover:text-black py-2 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </>
                ) : (
                  <Link href="/giris" onClick={() => setMobileMenuOpen(false)}>
                    <div className="text-sm text-black font-medium py-2">
                      Giriş Yap / Kayıt Ol
                    </div>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
