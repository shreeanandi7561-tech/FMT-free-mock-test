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
    const { name, email, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, mobile, and password are required.' 
      });
    }

    // Check if mobile number already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .single();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sign up failed. User may already exist.' 
      });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          full_name: name,
          email: email || null,
          mobile_number: mobile,
          password: password, // In production, hash this!
          created_at: new Date().toISOString(),
          is_premium: false
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create user account.' 
      });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(JSON.stringify({ 
      id: newUser.id, 
      mobile: mobile 
    })).toString('base64');

    return res.status(200).json({
      success: true,
      message: 'Account created successfully!',
      token: token,
      user: {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
        mobile: newUser.mobile_number,
        joinedAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
}