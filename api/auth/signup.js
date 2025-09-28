import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseServiceKey,
  url: supabaseUrl ? 'Set' : 'Missing'
});

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
    console.log('Request body:', req.body);
    
    const { name, email, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, mobile, and password are required.' 
      });
    }

    console.log('Checking for existing user with mobile:', mobile);

    // Check if mobile number already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .maybeSingle();

    console.log('Existing user check result:', { existingUser, checkError });

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error.' 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sign up failed. User may already exist.' 
      });
    }

    console.log('Creating new user...');

    // Create new user
    const userData = {
      full_name: name,
      email: email || null,
      mobile_number: mobile,
      password: password, // In production, hash this!
      is_premium: false
    };

    console.log('User data to insert:', userData);

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select('*');

    console.log('Insert result:', { insertData, insertError });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ 
        success: false, 
        message: `Database error: ${insertError.message}` 
      });
    }

    if (!insertData || insertData.length === 0) {
      console.error('No data returned from insert');
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to create user - no data returned.' 
      });
    }

    const newUser = insertData[0];
    console.log('New user created:', newUser);

    // Generate simple token
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
      message: `Server error: ${error.message}` 
    });
  }
}