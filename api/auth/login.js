import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mobile number and password are required.' 
      });
    }

    // Find user by mobile number
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('mobile_number', mobile)
      .single();

    if (findError || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Check password (in production, use proper hashing)
    if (user.password !== password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid credentials.' 
      });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(JSON.stringify({ 
      id: user.id, 
      mobile: mobile 
    })).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token: token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        mobile: user.mobile_number,
        joinedAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
}