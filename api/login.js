// /api/login.js
import bcrypt from 'bcrypt';
import { getSupabaseService, signToken } from './_lib/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST' });
  }

  try {
    const { mobile = '', password = '' } = req.body || {};
    const normalizedMobile = String(mobile).trim().replace(/s+/g, '');
    if (!normalizedMobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile & password required' });
    }

    const supabase = getSupabaseService();
    const { data: user, error: findErr } = await supabase
      .from('users')
      .select('id, mobile_number, password_hash')
      .eq('mobile_number', normalizedMobile)
      .maybeSingle();

    if (findErr) {
      return res.status(500).json({ success: false, message: 'DB error (find user)' });
    }
    if (!user?.password_hash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, mobile: user.mobile_number });
    return res.status(200).json({ success: true, token });
  } catch {
    return res.status(500).json({ success: false, message: 'Unexpected error' });
  }
}
