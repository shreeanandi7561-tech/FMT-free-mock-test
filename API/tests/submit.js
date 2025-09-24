const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { testId, userId, score, rank, timeTaken, userAnswers } = req.body;

  if (!testId || !userId || score === undefined || rank === undefined) {
    return res.status(400).json({ error: 'Missing required test submission data.' });
  }

  try {
    const { data, error } = await supabase
      .from('test_results')
      .insert([
        {
          user_id: userId,
          test_id: testId,
          score: score,
          rank: rank,
          time_taken_seconds: timeTaken,
        },
      ]);

    if (error) {
      console.error('Submission error:', error);
      return res.status(500).json({ success: false, message: 'Failed to save test results.' });
    }

    return res.status(200).json({ success: true, message: 'Test results saved successfully!' });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};
