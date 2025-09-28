import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

export default async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { mobile, newPassword } = req.body;

    // Validate that mobile and newPassword are provided
    if (!mobile || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and a new password are required.'
      });
    }
    
    // Enforce minimum password length
    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    // Check if a user exists with the provided mobile number
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .single();

    // If no user is found or there's an error, return a 404
    if (findError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User with this mobile number not found.'
      });
    }

    // Update the user's password in the database
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword }) // NOTE: In a real production app, this password should be hashed!
      .eq('mobile_number', mobile);

    // If the update fails, log the error and return a 500 status
    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating the password.'
      });
    }

    // Return a success message if the password was updated
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully!'
    });

  } catch (error) {
    // Catch any unexpected server errors
    console.error('Forgot Password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred.'
    });
  }
}
