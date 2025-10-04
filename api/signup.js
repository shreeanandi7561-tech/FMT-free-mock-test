import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeavbvnnnuoloouxkxgw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYXZidm5ubnVvbG9vdXhreGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NDUxNjQsImV4cCI6MjA3NDIyMTE2NH0.KuzzTBtmvvht4OnAGpwPWajItaJ5DftAYbYOdt8cVec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      return res.status(200).json({
        success: true,
        message: 'Account created! Please login.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name
        }
      });
    }

    return res.status(200).json({
      success: true,
      token: loginData.session.access_token,
      user: {
        id: loginData.user.id,
        email: loginData.user.email,
        name: name
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
