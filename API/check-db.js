// A simple API to check the Supabase connection status.
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    // Get Supabase credentials from Vercel Environment Variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if the variables are set
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ status: 'error', message: 'Supabase environment variables are missing.' });
    }

    // Attempt to create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try a simple database query to verify the connection
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return res.status(500).json({ status: 'error', message: `Supabase connection failed. Details: ${error.message}` });
    }

    // If successful, return a positive message
    return res.status(200).json({ status: 'success', message: 'Supabase connection is working correctly.', data });

  } catch (err) {
    console.error('An unexpected error occurred:', err);
    return res.status(500).json({ status: 'error', message: `An unexpected error occurred. Details: ${err.message}` });
  }
};
