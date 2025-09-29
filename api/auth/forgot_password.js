import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

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
    const { mobile, newPassword } = req.body;

    if (!mobile || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mobile number and new password are required.' });
    }

    // Update the user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword }) // In production, this password should be hashed!
      .eq('mobile_number', mobile);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ success: false, message: 'Could not update password.' });
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Forgot Password error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
