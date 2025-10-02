export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing',
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('SUPABASE') || key.includes('NEXT_PUBLIC')
      )
    },
    headers: req.headers,
    body: req.body
  });
}
