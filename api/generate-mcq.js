export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { count, language } = req.body;

    const mockMcqs = Array.from({ length: count || 5 }, (_, i) => ({
      question: `यह ${language} में सैंपल प्रश्न ${i + 1} है?`,
      options: ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
      answer: 0 
    }));
    
    res.status(200).json({ success: true, mcqs: mockMcqs });

  } catch (error) {
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
