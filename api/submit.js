// /api/submit.js
import { getSupabaseService, verifyTokenFromAuthHeader } from './_lib/auth';

function validatePayload(body = {}) {
  const errors = [];
  const test_id = String(body.test_id || '').trim();
  const subject = String(body.subject || '').trim();
  const marks = Number(body.marks);
  const percentage = Number(body.percentage);
  const time_taken = Number(body.time_taken);
  const rank = Number(body.rank);

  if (!test_id) errors.push('test_id required');
  if (!subject) errors.push('subject required');
  if (!Number.isFinite(marks) || marks < 0) errors.push('marks must be >= 0');
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) errors.push('percentage 0..100');
  if (!Number.isFinite(time_taken) || time_taken < 0 || time_taken > 86400) errors.push('time_taken 0..86400');
  if (!Number.isFinite(rank) || rank < 0) errors.push('rank must be >= 0');

  return { ok: errors.length === 0, errors, payload: { test_id, subject, marks, percentage, time_taken, rank } };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Use POST' });

  const userId = verifyTokenFromAuthHeader(req.headers.authorization);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const v = validatePayload(req.body);
  if (!v.ok) return res.status(400).json({ message: 'Invalid payload', errors: v.errors });

  const supabase = getSupabaseService();
  const { error } = await supabase.from('test_results').insert({
    user_id: userId,
    test_id: v.payload.test_id,
    subject: v.payload.subject,
    marks: v.payload.marks,
    percentage: v.payload.percentage,
    time_taken: v.payload.time_taken,
    rank: v.payload.rank,
    created_at: new Date().toISOString()
  });

  if (error) return res.status(500).json({ message: 'DB error (insert result)' });
  return res.status(201).json({ success: true });
}
