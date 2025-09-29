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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    
    const userId = getUserIdFromToken(req.headers.authorization);

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    try {
        const { testId, testName, subject, score, rank, percentage, timeTaken } = req.body;
        
        const { error } = await supabase
            .from('test_results')
            .insert([{ 
                user_id: userId,
                test_id: testId,
                test_name: testName,
                subject: subject,
                score: score,
                rank: rank,
                percentage: percentage,
                time_taken_seconds: timeTaken
                // user_answers: userAnswers // Optional: if your table has a JSONB column
            }]);

        if (error) {
            console.error('Error saving test result:', error);
            return res.status(500).json({ success: false, message: 'Failed to save test result.' });
        }

        return res.status(200).json({ success: true });

    } catch (e) {
        console.error('Server error on submit:', e);
        return res.status(500).json({ success: false, message: 'Internal server error.' });
    }
}
