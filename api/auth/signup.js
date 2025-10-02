import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

const SALT_ROUNDS = 10;

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

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this mobile number already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([{
        full_name: name,
        email: email || null,
        mobile_number: mobile,
        password: hashedPassword,
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
