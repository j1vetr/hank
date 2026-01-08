import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
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
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [expectedCount, setExpectedCount] = useState(0);
  const { subtotal, totalItems } = useCart();

  const showModal = useCallback((productInfo: ProductInfo) => {
    setProduct(productInfo);
    setExpectedTotal(subtotal + productInfo.price);
    setExpectedCount(totalItems + productInfo.quantity);
    setIsOpen(true);
  }, [subtotal, totalItems]);

  useEffect(() => {
    if (isOpen && subtotal >= expectedTotal) {
      setExpectedTotal(subtotal);
      setExpectedCount(totalItems);
    }
  }, [subtotal, totalItems, isOpen, expectedTotal]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setProduct(null), 300);
  }, []);

  const displayTotal = isOpen ? Math.max(expectedTotal, subtotal) : subtotal;
  const displayCount = isOpen ? Math.max(expectedCount, totalItems) : totalItems;

  return (
    <CartModalContext.Provider value={{ showModal }}>
      {children}
      <CartSuccessModal
        isOpen={isOpen}
        onClose={handleClose}
        product={product}
        cartTotal={displayTotal}
        cartItemCount={displayCount}
      />
    </CartModalContext.Provider>
  );
}
