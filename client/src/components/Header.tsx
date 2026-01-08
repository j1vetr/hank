import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categories = [
  { href: '/kategori/esofman', label: 'Eşofman' },
  { href: '/kategori/salvar-pantolon', label: 'Şalvar & Pantolon' },
  { href: '/kategori/sifir-kol-atlet', label: 'Sıfır Kol & Atlet' },
  { href: '/kategori/sort', label: 'Şort' },
  { href: '/kategori/tshirt', label: 'T-Shirt' },
];

export function Header() {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center h-20">
            <button
              data-testid="button-mobile-menu"
              className="lg:hidden p-2 -ml-2 mr-4"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" data-testid="link-logo" className="shrink-0">
              <img
                src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                alt="HANK"
                className="h-10 invert"
                data-testid="img-logo"
              />
            </Link>

            <nav className="hidden lg:flex items-center justify-center flex-1 gap-8 px-12">
              {categories.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <span className={`text-[13px] tracking-wide uppercase font-medium transition-colors hover:text-foreground whitespace-nowrap ${
                    location === link.href ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-auto">
              <button
                data-testid="button-search"
                className="p-2.5 hover:bg-accent rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid="button-account"
                      className="hidden sm:flex p-2.5 hover:bg-accent rounded-full transition-colors"
                    >
                      <User className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled className="text-muted-foreground">
                      {user.firstName || user.email}
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
                    className="hidden sm:flex p-2.5 hover:bg-accent rounded-full transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </button>
                </Link>
              )}

              <Link href="/sepet">
                <button
                  data-testid="button-cart"
                  className="p-2.5 hover:bg-accent rounded-full transition-colors relative"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-bold flex items-center justify-center rounded-full">
                      {totalItems}
                    </span>
                  )}
                </button>
              </Link>
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
              className="fixed inset-0 bg-black/60 z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-background z-50 lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <img
                  src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                  alt="HANK"
                  className="h-8 invert"
                />
                <button
                  data-testid="button-close-menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-6 space-y-5">
                <Link
                  href="/"
                  data-testid="link-mobile-nav-home"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="block font-display text-2xl tracking-wider hover:text-muted-foreground transition-colors">
                    ANA SAYFA
                  </span>
                </Link>
                {categories.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-testid={`link-mobile-nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="block font-display text-2xl tracking-wider hover:text-muted-foreground transition-colors">
                      {link.label.toUpperCase()}
                    </span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
