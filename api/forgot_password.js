import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

const SALT_ROUNDS = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  try {
    const { mobile, newPassword } = req.body;

    if (!mobile || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mobile number and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('mobile_number', mobile)
      .single();

    if (findError || !user) {
      return res.status(404).json({ success: false, message: 'User with this mobile number not found.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('Supabase password update error:', updateError);
      return res.status(500).json({ success: false, message: 'Failed to update password.' });
    }

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });

  } catch (error)
 {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
