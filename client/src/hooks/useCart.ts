import { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CartItem {
  id: string;
  sessionId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: string;
    images: string[];
  };
  variant?: {
    id: string;
    size: string | null;
    color: string | null;
    price: string;
  };
}

export interface CartCampaignPricing {
  subtotal: number;
  campaignDiscount: number;
  discountedSubtotal: number;
  campaign: {
    id: string;
    name: string;
    customerMessage: string | null;
    buyQuantity: number;
    rewardQuantity: number;
    discountPercentage: number;
  } | null;
  eligibleItemCount: number;
  requiredItemCount: number;
  applications: number;
  remainingItems: number;
  progressMessage: string | null;
  lines: Array<{
    cartItemId: string;
    unitPrice: number;
    lineSubtotal: number;
    eligible: boolean;
    discountedQuantity: number;
    discountAmount: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, variantId?: string, quantity?: number, source?: "complementary" | "campaign" | "free_shipping") => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  pricing: CartCampaignPricing | undefined;
  isPricingLoading: boolean;
}

export const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function useCartProvider() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await fetch('/api/cart', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: pricing, isLoading: isPricingLoading } = useQuery<CartCampaignPricing>({
    queryKey: ['cart-pricing'],
    queryFn: async () => {
      const res = await fetch('/api/cart/pricing', { credentials: 'include' });
      if (!res.ok) throw new Error('Sepet hesaplanamadı');
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const addMutation = useMutation({
    mutationFn: async ({ productId, variantId, quantity = 1, source }: {
      productId: string;
      variantId?: string;
      quantity?: number;
      source?: "complementary" | "campaign" | "free_shipping";
    }) => {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, variantId, quantity, source }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sepete eklenemedi');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-pricing'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Silme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-pricing'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Sepet temizlenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cart-pricing'] });
    },
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const localSubtotal = items.reduce((sum, item) => {
    const price = item.variant?.price || item.product?.basePrice || '0';
    return sum + parseFloat(price) * item.quantity;
  }, 0);
  const subtotal = pricing?.subtotal ?? localSubtotal;

  return {
    items,
    isLoading,
    addToCart: async (productId: string, variantId?: string, quantity = 1, source?: "complementary" | "campaign" | "free_shipping") => {
      await addMutation.mutateAsync({ productId, variantId, quantity, source });
      await queryClient.refetchQueries({ queryKey: ['cart'] });
      await queryClient.refetchQueries({ queryKey: ['cart-pricing'] });
    },
    updateQuantity: async (itemId: string, quantity: number) => {
      await updateMutation.mutateAsync({ itemId, quantity });
    },
    removeItem: async (itemId: string) => {
      await removeMutation.mutateAsync(itemId);
    },
    clearCart: async () => {
      await clearMutation.mutateAsync();
    },
    totalItems,
    subtotal,
    pricing,
    isPricingLoading,
  };
}
