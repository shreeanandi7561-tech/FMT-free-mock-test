import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) { throw new Error('JWT_SECRET missing'); }

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn });
}

export function verifyTokenFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  try { const decoded = jwt.verify(parts[1], JWT_SECRET, { algorithms: ['HS256'] }); return decoded?.id || null; }
  catch { return null; }
}

export function getSupabaseService() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
}
