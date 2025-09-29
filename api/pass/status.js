import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

function getUserIdFromToken(authHeader) {
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        return decoded.id;
    } catch (e) {
        return null;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ isActive: false, message: 'User not found.' });
        }
        
        return res.status(200).json({ isActive: user.is_premium });
    } catch(e) {
        return res.status(500).json({ isActive: false, message: 'Server error.' });
    }
}
