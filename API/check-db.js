const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if environment variables are set
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        status: 'error',
        message: 'Supabase environment variables are missing.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Basic query for health check
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: `Supabase connection failed. Details: ${error.message}`
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Supabase connection is working correctly.',
      data
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: `Unexpected error: ${err.message}`
    });
  }
};
