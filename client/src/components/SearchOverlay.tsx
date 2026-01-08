import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: string[];
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [isOpen]);

  const { data: results = [], isLoading } = useQuery<SearchResult[]>({
    queryKey: ['/api/products', { search: debouncedQuery }],
    queryFn: async () => {
      if (debouncedQuery.length < 3) return [];
      const res = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: debouncedQuery.length >= 3,
  });

  const handleProductClick = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 z-[101] bg-zinc-900 border-b border-white/10"
          >
            <div className="max-w-[800px] mx-auto px-6 py-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ürün ara... (en az 3 karakter)"
                  className="w-full h-14 pl-12 pr-12 bg-black/50 border border-white/20 rounded-lg text-lg placeholder:text-muted-foreground focus:outline-none focus:border-white/50 transition-colors"
                  data-testid="input-search"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                  data-testid="button-close-search"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {query.length > 0 && query.length < 3 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-muted-foreground mt-4 text-center"
                  >
                    Arama yapmak için en az 3 karakter girin
                  </motion.p>
                )}

                {isLoading && debouncedQuery.length >= 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </motion.div>
                )}

                {!isLoading && debouncedQuery.length >= 3 && results.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <p className="text-muted-foreground">
                      "<span className="text-foreground">{debouncedQuery}</span>" için sonuç bulunamadı
                    </p>
                  </motion.div>
                )}

                {!isLoading && results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 max-h-[60vh] overflow-y-auto space-y-2"
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      {results.length} sonuç bulundu
                    </p>
                    {results.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={`/urun/${product.slug}`}
                          onClick={handleProductClick}
                          data-testid={`link-search-result-${product.id}`}
                        >
                          <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                            <div className="w-16 h-20 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                              <img
                                src={product.images?.[0] || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=120&fit=crop'}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base truncate group-hover:text-white transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-lg font-bold mt-1">
                                {parseFloat(product.basePrice).toLocaleString('tr-TR')} ₺
                              </p>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
