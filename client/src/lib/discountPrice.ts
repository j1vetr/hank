export function getOriginalPrice(currentPrice: number, discountBadge?: string | null): number | null {
  if (!discountBadge) return null;
  const match = discountBadge.match(/%(\d+)/);
  if (!match) return null;
  const discountPercent = parseInt(match[1], 10);
  if (discountPercent <= 0 || discountPercent >= 100) return null;
  return currentPrice / (1 - discountPercent / 100);
}
