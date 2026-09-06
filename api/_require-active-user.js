// Validate with Supabase Auth, never trust a decoded browser-supplied JWT.
export async function requireActiveUser(req, fetcher = fetch) {
  const authorization = String(req.headers?.authorization ?? "");
  if (!/^Bearer \S+$/i.test(authorization)) return { status:401, message:"Inicia sesión para analizar un documento." };
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { status:503, message:"No se ha podido verificar la sesión." };
  try {
    const headers = { authorization, apikey:key };
    const response = await fetcher(`${url}/auth/v1/user`, { headers, cache:"no-store", signal:AbortSignal.timeout(10000) });
    if (!response.ok) return { status:401, message:"La sesión ha caducado. Vuelve a entrar." };
    const user = await response.json();
    if (!user?.id) return { status:401, message:"Sesión no válida." };
    const profile = await fetcher(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=active`, { headers, cache:"no-store", signal:AbortSignal.timeout(10000) });
    if (!profile.ok) return { status:503, message:"No se ha podido verificar el perfil." };
    const rows = await profile.json();
    if (rows?.[0]?.active !== true) return { status:403, message:"Esta cuenta no tiene acceso." };
    return { userId:user.id };
  } catch {
    return { status:503, message:"No se ha podido verificar la sesión. Inténtalo de nuevo." };
  }
}
