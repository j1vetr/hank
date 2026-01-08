import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartSuccessModal } from '@/components/CartSuccessModal';
import { useCart } from '@/hooks/useCart';

interface ProductInfo {
  name: string;
  image: string;
  price: number;
  size?: string;
  quantity: number;
}

interface CartModalContextType {
  showModal: (product: ProductInfo) => void;
}

const CartModalContext = createContext<CartModalContextType | null>(null);

export function useCartModal() {
  const context = useContext(CartModalContext);
  if (!context) {
    throw new Error('useCartModal must be used within CartModalProvider');
  }
  return context;
}

export function CartModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const { subtotal, totalItems } = useCart();

  const showModal = useCallback((productInfo: ProductInfo) => {
    setProduct(productInfo);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setProduct(null), 300);
  }, []);

  return (
    <CartModalContext.Provider value={{ showModal }}>
      {children}
      <CartSuccessModal
        isOpen={isOpen}
        onClose={handleClose}
        product={product}
        cartTotal={subtotal}
        cartItemCount={totalItems}
      />
    </CartModalContext.Provider>
  );
}
