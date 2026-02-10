import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, User, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { SearchOverlay } from '@/components/SearchOverlay';
import { ValentineBanner } from '@/components/ValentineTheme';
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
  const leftMenuItems = hasMenuItems ? menuItems.slice(0, Math.ceil(menuItems.length / 2)) : [];
  const rightMenuItems = hasMenuItems ? menuItems.slice(Math.ceil(menuItems.length / 2)) : [];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <ValentineBanner />
        <div className="bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-xl border-b border-white/5">
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
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                      <span className="text-pink-400 font-medium">💕 SEVGİLİLER GÜNÜ İNDİRİMİ • 2.500₺ ÜZERİ ÜCRETSİZ KARGO</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center justify-between h-20 lg:h-24">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  data-testid="button-mobile-menu"
                  className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

              <nav className="hidden lg:flex items-center gap-8">
                {!hasMenuItems && (
                  <Link
                    href="/magaza"
                    data-testid="link-nav-magaza"
                  >
                    <span className={`relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white group ${
                      location === '/magaza' ? 'text-white' : 'text-white/70'
                    }`}>
                      MAĞAZA
                      <motion.span
                        className="absolute -bottom-1 left-0 right-0 h-px bg-white origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      {location === '/magaza' && (
                        <span className="absolute -bottom-1 left-0 right-0 h-px bg-white" />
                      )}
                    </span>
                  </Link>
                )}
                {hasMenuItems ? (
                  leftMenuItems.map((item) => {
                    const href = getMenuItemHref(item);
                    const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;
                    
                    if (hasChildren) {
                      return (
                        <DropdownMenu key={item.id}>
                          <DropdownMenuTrigger asChild>
                            <button
                              data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                              className="relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white text-white/70 flex items-center gap-1"
                            >
                              {item.title}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 bg-zinc-900 border-white/10">
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
                    
                    if (isExternal || item.openInNewTab) {
                      return (
                        <a
                          key={item.id}
                          href={href}
                          target={item.openInNewTab ? '_blank' : undefined}
                          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                          data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <span className={`relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white group ${
                            location === href ? 'text-white' : 'text-white/70'
                          }`}>
                            {item.title}
                            <motion.span
                              className="absolute -bottom-1 left-0 right-0 h-px bg-white origin-left"
                              initial={{ scaleX: 0 }}
                              whileHover={{ scaleX: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                            {location === href && (
                              <span className="absolute -bottom-1 left-0 right-0 h-px bg-white" />
                            )}
                          </span>
                        </a>
                      );
                    }
                    
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <span className={`relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white group ${
                          location === href ? 'text-white' : 'text-white/70'
                        }`}>
                          {item.title}
                          <motion.span
                            className="absolute -bottom-1 left-0 right-0 h-px bg-white origin-left"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          {location === href && (
                            <span className="absolute -bottom-1 left-0 right-0 h-px bg-white" />
                          )}
                        </span>
                      </Link>
                    );
                  })
) : null}
              </nav>

              <Link href="/" data-testid="link-logo" className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <img
                    src="/uploads/branding/hank-icon.png"
                    alt="HANK"
                    className="h-11 w-11 lg:hidden"
                    data-testid="img-logo-mobile"
                  />
                  <img
                    src="/uploads/branding/hank-logo.svg"
                    alt="HANK"
                    className="hidden lg:block h-12 invert"
                    data-testid="img-logo"
                  />
                </motion.div>
              </Link>

              <nav className="hidden lg:flex items-center gap-8">
                {hasMenuItems ? (
                  rightMenuItems.map((item) => {
                    const href = getMenuItemHref(item);
                    const hasChildren = item.type === 'submenu' && item.children && item.children.length > 0;
                    
                    if (hasChildren) {
                      return (
                        <DropdownMenu key={item.id}>
                          <DropdownMenuTrigger asChild>
                            <button
                              data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                              className="relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white text-white/70 flex items-center gap-1"
                            >
                              {item.title}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10">
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
                    
                    if (isExternal || item.openInNewTab) {
                      return (
                        <a
                          key={item.id}
                          href={href}
                          target={item.openInNewTab ? '_blank' : undefined}
                          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                          data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                        >
                          <span className={`relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white group ${
                            location === href ? 'text-white' : 'text-white/70'
                          }`}>
                            {item.title}
                            <motion.span
                              className="absolute -bottom-1 left-0 right-0 h-px bg-white origin-left"
                              initial={{ scaleX: 0 }}
                              whileHover={{ scaleX: 1 }}
                              transition={{ duration: 0.3 }}
                            />
                            {location === href && (
                              <span className="absolute -bottom-1 left-0 right-0 h-px bg-white" />
                            )}
                          </span>
                        </a>
                      );
                    }
                    
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        data-testid={`link-nav-${item.title.toLowerCase().replace(/\s/g, '-')}`}
                      >
                        <span className={`relative text-[13px] tracking-widest uppercase font-medium transition-colors hover:text-white group ${
                          location === href ? 'text-white' : 'text-white/70'
                        }`}>
                          {item.title}
                          <motion.span
                            className="absolute -bottom-1 left-0 right-0 h-px bg-white origin-left"
                            initial={{ scaleX: 0 }}
                            whileHover={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                          {location === href && (
                            <span className="absolute -bottom-1 left-0 right-0 h-px bg-white" />
                          )}
                        </span>
                      </Link>
                    );
                  })
) : null}
              </nav>

              <div className="flex items-center">
                <div className="flex items-center gap-0.5 sm:gap-1 p-1 sm:p-1.5 bg-white/5 rounded-full border border-white/10">
                  <button
                    data-testid="button-search"
                    className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-full transition-colors"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          data-testid="button-account"
                          className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-full transition-colors"
                        >
                          <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-white/10">
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          {user.firstName || user.email}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/hesabim')}>
                          <User className="w-4 h-4 mr-2" />
                          Hesabım
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { logout(); navigate('/'); }}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Çıkış Yap
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link href="/giris">
                      <button
                        data-testid="button-account"
                        className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-full transition-colors"
                      >
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </Link>
                  )}

                  <Link href="/sepet">
                    <button
                      data-testid="button-cart"
                      className="p-1.5 sm:p-2.5 hover:bg-white/10 rounded-full transition-colors relative"
                    >
                      <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                      {totalItems > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-white text-black text-[10px] sm:text-xs font-bold flex items-center justify-center rounded-full"
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
