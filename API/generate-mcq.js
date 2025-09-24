const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, count, language } = req.body;

  if (!text || !count) {
    return res.status(400).json({ error: 'Text and MCQ count are required.' });
  }

  const prompt = `You are an MCQ generator. Generate EXACTLY ${count} multiple-choice questions (MCQs) from the text below. Return ONLY a valid JSON array with exactly ${count} objects — no explanation, no code fences, no extra text. Each object must follow exactly this format: {"question":"...","options":["opt1","opt2","opt3","opt4"],"answer":<index_of_correct_option_0_based>}. Language: ${language}. If you cannot produce exactly ${count} valid items, explain briefly in one line as JSON like {"error":"reason"}.\n\nText to use:\n${text}`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', errorText);
        return res.status(geminiResponse.status).json({ error: `Gemini API Error: ${errorText}` });
    }

    const geminiData = await geminiResponse.json();
    let raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    raw = raw.replace(/```json|```/g, "").trim();

    try {
        const mcqs = JSON.parse(raw);
        return res.status(200).json({ success: true, mcqs });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'AI response was not a valid JSON. Please try again.' });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};
