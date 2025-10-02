// /api/status.js
import { getSupabaseService, verifyTokenFromAuthHeader } from './_lib/auth';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Use GET' });

  const userId = verifyTokenFromAuthHeader(req.headers.authorization);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const supabase = getSupabaseService();
  const { data: user, error } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', userId)
    .maybeSingle();

  if (error) return res.status(500).json({ message: 'DB error' });
  if (!user) return res.status(404).json({ message: 'User not found' });

  return res.status(200).json({ is_premium: !!user.is_premium });
}
