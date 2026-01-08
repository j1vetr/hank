import { ReactNode } from 'react';
import { CartContext, useCartProvider } from '@/hooks/useCart';

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartProvider();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
}
