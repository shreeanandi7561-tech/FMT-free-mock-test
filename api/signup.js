const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Body validation
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
      // PGRST116 = row not found, ignore for checking new user
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
      ]).select();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Signup failed.',
        error: error.message || error,
      });
    }

    const authToken = 'dummy-auth-token-12345';
    return res.status(200).json({
      success: true,
      message: 'Signup successful!',
      user: data[0],
      token: authToken,
    });

  } catch (error) {
    // Super robust catch (unexpected errors)
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
      error: error?.message || error,
    });
  }
};
