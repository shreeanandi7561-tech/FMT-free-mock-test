// /api/signup.js
import bcrypt from 'bcrypt';
import { signToken, getSupabaseService } from './_lib/auth';

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Use POST' });
  }

  try {
    const { name = '', email = '', mobile = '', password = '' } = req.body || {};
    const trimmedName = String(name).trim();
    const trimmedMobile = String(mobile).trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedName || !trimmedMobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile, password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be 6+ chars' });
    }
    // Simple mobile normalization: remove spaces; add your E.164 normalizer if needed
    const normalizedMobile = trimmedMobile.replace(/s+/g, '');

    const supabase = getSupabaseService();
    const { data: existingUser, error: findErr } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', normalizedMobile)
      .maybeSingle();

    if (findErr) {
      return res.status(500).json({ success: false, message: 'DB error (check user)' });
    }
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Mobile already registered' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const { data: inserted, error: insErr } = await supabase
      .from('users')
      .insert({
        name: trimmedName,
        email: trimmedEmail || null,
        mobile_number: normalizedMobile,
        password_hash: hashed,
        is_premium: false
      })
      .select('id, mobile_number')
      .single();

    if (insErr || !inserted) {
      return res.status(500).json({ success: false, message: 'DB error (insert user)' });
    }

    const token = signToken({ id: inserted.id, mobile: inserted.mobile_number });
    return res.status(201).json({ success: true, token });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Unexpected error' });
  }
}
