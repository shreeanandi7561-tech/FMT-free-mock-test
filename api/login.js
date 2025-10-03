import bcrypt from 'bcrypt';
import { getSupabaseService } from './_lib/auth'; // or your existing
import { withCors, methodGuard, ok, err } from './_lib/http';

export default async function handler(req, res) {
  if (withCors(req, res, 'POST, OPTIONS')) return;
  if (methodGuard(req, res, ['POST'])) return;

  try {
    const supabase = getSupabaseService?.();
    if (!supabase) return err(res, 'Server misconfigured', 500, { code: 'NO_DB' });

    const { mobile = '', password = '' } = req.body || {};
    const normalizedMobile = String(mobile).trim().replace(/s+/g, '');
    if (!normalizedMobile || !password) return err(res, 'Mobile & password required', 400);

    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('id, mobile_number, password_hash')
      .eq('mobile_number', normalizedMobile)
      .maybeSingle();

    if (findErr) return err(res, 'Database error (find user)', 500, { code: 'DB_FIND' });
    if (!user?.password_hash) return err(res, 'Invalid credentials', 401);

    const okPw = await bcrypt.compare(password, user.password_hash);
    if (!okPw) return err(res, 'Invalid credentials', 401);

    // signToken import/use if using JWT; else temporary base64 fallback:
    let token;
    try {
      const { signToken } = await import('./_lib/auth');
      token = signToken({ id: user.id, mobile: user.mobile_number });
    } catch {
      token = Buffer.from(JSON.stringify({ id: user.id, mobile: user.mobile_number })).toString('base64');
    }
    return ok(res, { success: true, token }, 200);
  } catch {
    return err(res, 'Unexpected error in login', 500, { code: 'UNEXPECTED' });
  }
}
