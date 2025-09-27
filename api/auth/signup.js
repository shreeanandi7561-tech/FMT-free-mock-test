import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, mobile, name } = req.body;

  if (!email || !password || !mobile || !name) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Step 1: Check if user already exists by email or mobile
  const { data: existingEmail } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  const { data: existingMobile } = await supabase
    .from('users')
    .select('id')
    .eq('mobile', mobile)
    .single();

  if (existingEmail) {
    return res.status(409).json({ error: 'User with this email already exists.' });
  }
  if (existingMobile) {
    return res.status(409).json({ error: 'User with this mobile number already exists.' });
  }

  // Step 2: Try to create new user
  try {
    const { user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Insert additional user info (name, mobile) in users table if needed
    await supabase.from('users').insert([{ email, mobile, name, auth_user_id: user.id }]);

    return res.status(200).json({ user });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
