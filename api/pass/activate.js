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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    
    const { code } = req.body;
    if (!code) {
        return res.status(400).json({ success: false, message: 'Activation code is required.' });
    }

    try {
        // Find the code in the database
        const { data: premiumCode, error: codeError } = await supabase
            .from('premium_codes')
            .select('*')
            .eq('code', code.trim().toUpperCase())
            .single();

        if (codeError || !premiumCode) {
            return res.status(404).json({ success: false, message: 'Invalid or incorrect code.' });
        }

        if (premiumCode.is_used) {
            return res.status(400).json({ success: false, message: 'This code has already been used.' });
        }

        // Update user to premium
        const { error: userUpdateError } = await supabase
            .from('users')
            .update({ is_premium: true })
            .eq('id', userId);

        if (userUpdateError) {
            throw userUpdateError;
        }

        // Mark code as used
        await supabase
            .from('premium_codes')
            .update({
                is_used: true,
                used_by_user_id: userId,
                used_at: new Date().toISOString()
            })
            .eq('id', premiumCode.id);

        return res.status(200).json({ success: true, message: 'Pass activated successfully!' });

    } catch (e) {
        console.error('Activation Error:', e);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
