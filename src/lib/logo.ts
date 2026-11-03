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

/**
 * Automatically resize & compress an uploaded image file on the client side.
 * Converts multi-megabyte images (up to 10MB) into a crisp, lightweight Base64 WebP/JPEG data URL (<50KB).
 * Preserves SVG vector files as-is.
 */
export async function compressAndProcessImageFile(file: File, maxDimension = 400): Promise<string> {
  // If SVG vector, read directly as data URL without rasterizing
  if (file.type.includes('svg')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          // Smooth high-quality resampling
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer WebP for high compression & quality, fallback to JPEG
          let dataUrl = canvas.toDataURL('image/webp', 0.85);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          resolve(dataUrl);
        } catch {
          // If canvas processing fails, fallback to original dataUrl
          resolve(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
