const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', mobile)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password.' });
    }

    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid mobile number or password.' });
    }
    
    const authToken = 'dummy-auth-token-12345'; // In a real app, you would generate a JWT token here

    return res.status(200).json({ success: true, message: 'Login successful!', user, token: authToken });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};
