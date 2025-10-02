// /api/generate-mcq.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Use POST' });

  try {
    const { text = '', count = 10, language = 'English' } = req.body || {};
    const n = Number(count);
    if (!text || !Number.isFinite(n) || n <= 0 || n > 50) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: 'GEMINI_API_KEY missing' });

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const prompt = `You are an expert MCQ creator. Generate exactly ${n} MCQs in ${language} from the text below.
Output ONLY valid JSON:
{"mcqs":[{"question":"...","options":["A","B","C","D"],"answer":"B"}]}
Text:
${text}`;

    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });
    if (!r.ok) {
      return res.status(502).json({ message: 'Gemini error', status: r.status });
    }
    const out = await r.json();
    const raw = out?.candidates?.[0]?.content?.parts?.map(p => p?.text || '').join('
') || '';
    const cleaned = raw.replace(/``````/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch { return res.status(502).json({ message: 'Model returned non-JSON' }); }

    if (!parsed?.mcqs || !Array.isArray(parsed.mcqs)) {
      return res.status(502).json({ message: 'mcqs array missing' });
    }
    return res.status(200).json({ mcqs: parsed.mcqs });
  } catch {
    return res.status(500).json({ message: 'Unexpected error' });
  }
}
