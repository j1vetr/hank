import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isApproved: boolean;
  createdAt: string;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

export interface RatingData {
  average: number;
  count: number;
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json() as Promise<Review[]>;
    },
    enabled: !!productId,
  });
}

export function useProductRating(productId: string) {
  return useQuery({
    queryKey: ['rating', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/rating`);
      if (!response.ok) throw new Error('Failed to fetch rating');
      return response.json() as Promise<RatingData>;
    },
    enabled: !!productId,
  });
}

export function useUserReview(productId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-review', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/my-review`);
      if (!response.ok) return null;
      return response.json() as Promise<Review | null>;
    },
    enabled: !!productId && !!user,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { productId: string; rating: number; title?: string; content?: string }) => {
      const response = await fetch(`/api/products/${data.productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: data.rating,
          title: data.title,
          content: data.content,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create review');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['rating', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['my-review', variables.productId] });
    },
  });
}
