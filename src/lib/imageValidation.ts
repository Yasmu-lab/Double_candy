const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Formato não aceito. Use JPG, PNG, WEBP ou GIF.';
  if (file.size > MAX_BYTES) return 'Imagem muito grande. Máximo de 5MB.';
  return null;
}
