/**
 * Generates a stable, Unicode-safe document ID for products.
 * This ensures that the same product across different locations (Warehouse vs Showroom)
 * can be consistently identified and linked.
 */
export function makeProductId(productName: string, sizeModel: string | undefined | null, stockLocation: string): string {
    const key = `${productName.trim()}||${(sizeModel || '').trim()}||${stockLocation}`;
    try {
      // Use btoa for a clean, URL-safe ID string
      const b64 = btoa(unescape(encodeURIComponent(key)));
      // Sanitize for Firebase document ID compatibility
      return b64.replace(/[+/=]/g, '_').slice(0, 80);
    } catch {
      // Fallback for extreme cases
      return key.replace(/[^\w\u0600-\u06FF\u0660-\u0669-]/g, '_').slice(0, 80);
    }
  }
