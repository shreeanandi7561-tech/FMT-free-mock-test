// A simple Node.js serverless function for Vercel
// This function handles user registration by connecting to Supabase.

const { createClient } = require('@supabase/supabase-js');

// Vercel environment variables for Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, mobile, password, email } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required' });
  }

  try {
    // Check if the user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('mobile')
      .eq('mobile', mobile)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this mobile number already exists' });
    }
    
    // In a real app, you would hash the password here before saving it
    // For this example, we'll store it as is for simplicity.
    const { data, error } = await supabase
      .from('users')
      .insert([
        { name, mobile, password, email, joined_at: new Date() }
      ]);

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
    }

    // Return a success message (in a real app, you would return a session token)
    return res.status(200).json({ success: true, message: 'Signup successful!', user: data[0] });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};
