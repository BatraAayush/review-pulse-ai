// Helper utilities for business logos (images, data URLs, and industry icons)

export function isImageLogo(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('blob:') ||
    /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(trimmed)
  );
}

export function getCategoryEmoji(cat?: string | null): string {
  switch (cat?.toLowerCase()) {
    case 'fitness':
      return '🏋️';
    case 'clinic':
      return '🦷';
    case 'salon':
      return '✂️';
    case 'automotive':
      return '🏎️';
    case 'retail':
      return '🛍️';
    case 'restaurant':
    default:
      return '🍽️';
  }
}
