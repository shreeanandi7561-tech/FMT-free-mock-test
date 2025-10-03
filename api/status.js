// /api/status.js
import { verifyTokenFromAuthHeader, getSupabaseService } from './_lib/auth';
import { withCors, methodGuard, ok, err } from './_lib/http';

export default async function handler(req, res) {
  if (withCors(req, res, 'GET, OPTIONS')) return;
  if (methodGuard(req, res, ['GET'])) return;

  try {
    const id = verifyTokenFromAuthHeader?.(req.headers.authorization) 
      || (() => { 
          try { const t = (req.headers.authorization||'').split(' ')[1]; 
                return JSON.parse(Buffer.from(t||'', 'base64').toString('utf-8')).id; } catch { return null; } 
        })();
    if (!id) return err(res, 'Unauthorized', 401);

    const supabase = getSupabaseService?.();
    if (!supabase) return err(res, 'Server misconfigured', 500);

    const { data: user, error } = await supabase.from('users').select('is_premium').eq('id', id).maybeSingle();
    if (error) return err(res, 'Database error', 500);
    if (!user) return err(res, 'User not found', 404);

    return ok(res, { is_premium: !!user.is_premium }, 200);
  } catch {
    return err(res, 'Unexpected error in status', 500);
  }
}
