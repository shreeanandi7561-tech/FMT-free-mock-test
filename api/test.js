import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Environment variables missing',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl ? 'Present' : 'Missing',
          key: supabaseKey ? 'Present' : 'Missing'
        }
      });
    }

    // Test Supabase connection
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test simple query
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase connection error',
        supabaseError: error.message,
        debug: {
          url: supabaseUrl,
          hasKey: !!supabaseKey
        }
      });
    }

    // Test table structure
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    return res.status(200).json({
      success: true,
      message: 'All connections working!',
      debug: {
        environmentVariables: 'OK',
        supabaseConnection: 'OK',
        userTableExists: !tableError,
        userCount: data?.length || 0,
        tableError: tableError?.message || null
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
}