import { supabase } from '@/lib/supabase';

function guessExt(uri: string): string {
  const clean = uri.split('?')[0]?.toLowerCase() ?? '';
  if (clean.endsWith('.png')) return 'png';
  if (clean.endsWith('.webp')) return 'webp';
  return 'jpg';
}

function contentType(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/** Sube una imagen local a Storage y devuelve la URL pública. */
export async function uploadRecipeImage(
  userId: string,
  localUri: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!localUri || localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return { ok: true, url: localUri };
  }

  try {
    const ext = guessExt(localUri);
    const path = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(localUri);
    const buffer = await response.arrayBuffer();

    const { error } = await supabase.storage.from('recipe-images').upload(path, buffer, {
      contentType: contentType(ext),
      upsert: false,
    });

    if (error) {
      return { ok: false, error: error.message || 'No se pudo subir la imagen.' };
    }

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, error: 'No se pudo subir la imagen.' };
  }
}
