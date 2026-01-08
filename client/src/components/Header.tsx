import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Ana Sayfa' },
  { href: '/erkek', label: 'Erkek' },
  { href: '/kadin', label: 'Kadın' },
  { href: '/aksesuarlar', label: 'Aksesuarlar' },
  { href: '/yeni', label: 'Yeni Gelenler' },
];

export function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount] = useState(0);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <button
              data-testid="button-mobile-menu"
              className="lg:hidden p-2 -ml-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.slice(1, 3).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  <span className={`text-sm tracking-wide uppercase font-medium transition-colors hover:text-foreground ${
                    location === link.href ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            <Link href="/" data-testid="link-logo">
              <img
                src="https://hank.com.tr/wp-content/uploads/2024/10/hank-logo.svg"
                alt="HANK"
                className="h-8 invert"
                data-testid="img-logo"
              />
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.slice(3, 5).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  <span className={`text-sm tracking-wide uppercase font-medium transition-colors hover:text-foreground ${
                    location === link.href ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                data-testid="button-search"
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                data-testid="button-account"
                className="hidden sm:block p-2 hover:bg-accent rounded-full transition-colors"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                data-testid="button-cart"
                className="p-2 hover:bg-accent rounded-full transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-foreground text-background text-xs font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
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
                  className="h-6 invert"
                />
                <button
                  data-testid="button-close-menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="p-6 space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    data-testid={`link-mobile-nav-${link.label.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="block font-display text-3xl tracking-wider hover:text-muted-foreground transition-colors">
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
