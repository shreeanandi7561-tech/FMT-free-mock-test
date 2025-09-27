import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Function must be `export default` for Vercel/Next.js API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check env variables
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      success: false,
      message: 'Supabase config missing. Please set environment variables properly.',
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { name, mobile, password, email } = req.body;
  if (!name || !mobile || !password || !email) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, mobile, password, email) are required.',
    });
  }

  try {
    // Existing user check
    const { data: existingUser, error: userFetchError } = await supabase
      .from('users')
      .select('mobile')
      .eq('mobile', mobile)
      .single();
    if (userFetchError && userFetchError.code !== 'PGRST116') {
      // Row not found, ignore
      console.error('User fetch error:', userFetchError);
      return res.status(500).json({
        success: false,
        message: 'Database error while checking existing user.',
        error: userFetchError.message || userFetchError,
      });
    }
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this mobile number already exists.',
      });
    }

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        { name, mobile, password, email, joined_at: new Date() },
      ])
      .select();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Signup failed.',
        error: error.message || error,
      });
    }

    const authToken = 'dummy-auth-token-12345'; // Change accordingly if needed
    return res.status(200).json({
      success: true,
      message: 'Signup successful!',
      user: data[0],
      token: authToken,
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: error?.message || error,
    });
  }
}
