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

  const { message, image } = req.body;
  
  if (!message && !image) {
    return res.status(400).json({ error: 'Message or image is required.' });
  }

  const promptParts = [];
  if (message) {
    promptParts.push({ text: message });
  }
  if (image) {
    const imageData = image.split(';base64,')[1];
    promptParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData
      }
    });
  }
  
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
          parts: promptParts
        }]
      })
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API Error:', errorText);
        return res.status(geminiResponse.status).json({ error: `Gemini API Error: ${errorText}` });
    }

    const geminiData = await geminiResponse.json();
    const aiResponseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that. Please try again.";

    return res.status(200).json({ response: aiResponseText });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
};
