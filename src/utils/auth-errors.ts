/** Traduce errores de Supabase Auth a mensajes claros (rate limit, red, etc.). */
export function mapAuthError(error: unknown): string {
  const raw =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: string }).message)
      : String(error ?? '');
  const msg = raw.toLowerCase();
  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined;

  if (
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('over_request_rate_limit') ||
    msg.includes('email rate limit') ||
    msg.includes('for security purposes')
  ) {
    return 'Demasiados intentos. Espera unos segundos e inténtalo de nuevo.';
  }

  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('connect') ||
    msg.includes('failed to fetch')
  ) {
    return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  }

  if (msg.includes('email') && msg.includes('disabled')) {
    return 'El registro por correo está desactivado en Supabase.';
  }

  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid_credentials')
  ) {
    return 'Correo o contraseña incorrectos.';
  }

  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo.';
  }

  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'El registro está desactivado temporalmente.';
  }

  return raw.trim() || 'No se pudo completar la operación.';
}
