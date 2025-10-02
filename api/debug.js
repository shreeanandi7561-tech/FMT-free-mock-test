// /api/debug.js
export default function handler(req, res) {
  const admin = process.env.ADMIN_TOKEN || '';
  const ok = admin && req.headers['x-admin-token'] === admin;
  if (!ok) return res.status(403).json({ message: 'Forbidden' });

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    headers: req.headers
  });
}
