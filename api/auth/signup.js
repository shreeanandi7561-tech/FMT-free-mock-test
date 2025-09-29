import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile, and password are required.' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ success: false, message: 'Database connection error.' });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this mobile number already exists.' });
    }

    // Create new user
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{
        full_name: name,
        email: email || null,
        mobile_number: mobile,
        password: password, // In production, you should hash this password!
        is_premium: false
      }])
      .select('*')
      .single();

    if (insertError) {
      throw insertError;
    }

    const token = Buffer.from(JSON.stringify({ id: insertData.id, mobile: mobile })).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
      token: token,
      user: {
        id: insertData.id,
        name: insertData.full_name,
        email: insertData.email,
        mobile: insertData.mobile_number,
        joinedAt: insertData.created_at
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
}
