import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase config not set" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { name, email, mobile, password } = req.body || {};
  if (!name || !email || !mobile || !password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const { data: existingUser, error: userFetchError } = await supabase
      .from('users')
      .select('mobile')
      .eq('mobile', mobile)
      .single();

    if (userFetchError && userFetchError.code !== 'PGRST116') { // ignore "row not found"
      return res.status(500).json({ success: false, message: "Database error (find user)", error: userFetchError.message });
    }
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }
    // Signup: insert new user row
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, mobile, password }]);

    if (insertError) {
      return res.status(500).json({ success: false, message: "Database error (insert user)", error: insertError.message });
    }
    return res.status(201).json({ success: true, message: "Signup successful" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Unexpected server error", error: e.message });
  }
}
