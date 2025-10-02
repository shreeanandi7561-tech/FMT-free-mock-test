// /api/activate.js
import { getSupabaseService, verifyTokenFromAuthHeader } from './_lib/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Use POST' });

  const userId = verifyTokenFromAuthHeader(req.headers.authorization);
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const { code = '' } = req.body || {};
    const normalized = String(code).trim().toUpperCase();
    if (!normalized || normalized.length < 4) {
      return res.status(400).json({ success: false, message: 'Invalid code' });
    }

    const supabase = getSupabaseService();

    const { data: codeRow, error: codeErr } = await supabase
      .from('premium_codes')
      .select('id, is_used')
      .eq('code', normalized)
      .maybeSingle();

    if (codeErr) return res.status(500).json({ success: false, message: 'DB error (find code)' });
    if (!codeRow) return res.status(404).json({ success: false, message: 'Code not found' });
    if (codeRow.is_used) return res.status(409).json({ success: false, message: 'Code already used' });

    // Mark user premium
    const { error: updUserErr } = await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', userId);

    if (updUserErr) return res.status(500).json({ success: false, message: 'DB error (user update)' });

    // Mark code used
    const { error: updCodeErr } = await supabase
      .from('premium_codes')
      .update({ is_used: true, used_by_user_id: userId, used_at: new Date().toISOString() })
      .eq('id', codeRow.id);

    if (updCodeErr) return res.status(500).json({ success: false, message: 'DB error (code update)' });

    return res.status(200).json({ success: true, message: 'Premium activated' });
  } catch {
    return res.status(500).json({ success: false, message: 'Unexpected error' });
  }
}
