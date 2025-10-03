import bcrypt from 'bcrypt';
import { getSupabaseService } from './_lib/auth';
import { withCors, methodGuard, ok, err } from './_lib/http';

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
  if (withCors(req, res, 'POST, OPTIONS')) return;
  if (methodGuard(req, res, ['POST'])) return;

  try {
    const supabase = getSupabaseService?.();
    if (!supabase) return err(res, 'Server misconfigured', 500, { code: 'NO_DB' });

    const { name = '', email = '', mobile = '', password = '' } = req.body || {};
    const nm = String(name).trim();
    const em = String(email || '').trim().toLowerCase();
    const mb = String(mobile).trim().replace(/s+/g, '');
    if (!nm || !mb || !password) return err(res, 'Name, mobile, password required', 400);
    if (password.length < 6) return err(res, 'Password must be 6+ chars', 400);

    const { data: exist, error: findErr } = await supabase
      .from('users').select('id').eq('mobile_number', mb).maybeSingle();
    if (findErr) return err(res, 'Database error (check user)', 500, { code: 'DB_CHECK' });
    if (exist) return err(res, 'Mobile already registered', 409);

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const { data: inserted, error: insErr } = await supabase
      .from('users')
      .insert({ name: nm, email: em || null, mobile_number: mb, password_hash: hash, is_premium: false })
      .select('id, mobile_number')
      .single();

    if (insErr || !inserted) return err(res, 'Database error (insert user)', 500, { code: 'DB_INSERT' });

    let token;
    try {
      const { signToken } = await import('./_lib/auth');
      token = signToken({ id: inserted.id, mobile: inserted.mobile_number });
    } catch {
      token = Buffer.from(JSON.stringify({ id: inserted.id, mobile: inserted.mobile_number })).toString('base64');
    }
    return ok(res, { success: true, token }, 201);
  } catch {
    return err(res, 'Unexpected error in signup', 500, { code: 'UNEXPECTED' });
  }
}
