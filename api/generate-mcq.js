// filename: api/generate-mcq.js

// Helper function to call Google Gemini API
async function callGemini(text, count, language, apiKey) {
    

    // Pro मॉडल के लिए यह सही और आधिकारिक नाम है
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;
    
    // This is the strict prompt you requested
    const prompt = `
        You are an expert MCQ (Multiple Choice Questions) creator for competitive exams.
        Your task is to generate ${count} high-quality and important multiple-choice questions based ONLY on the following text.
        The questions must be in the ${language} language. Even if the source text is in a different language, the final output must be in ${language}.
        
        Rules:
        1.  Generate exactly ${count} questions if possible. If you cannot find enough content to create ${count} questions, generate as many as you can.
        2.  Each question must have 4 options.
        3.  One of the options must be the correct answer.
        4.  Do not create questions about the text's grammar or structure. The questions must be about the information and facts contained within the text.
        5.  The questions should be relevant and meaningful, focusing on the most important parts of the text.

        The final output MUST be a valid JSON object, without any extra text or explanations before or after it. The JSON object should follow this exact structure:
        {
          "mcqs": [
            {
              "question": "The generated question in ${language}",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": 0 
            }
          ]
        }
        In the "answer" field, provide the index of the correct option (0 for A, 1 for B, 2 for C, 3 for D).

        Here is the text to analyze:
        ---
        ${text}
        ---
    `;

    const payload = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            responseMimeType: "application/json",
        }
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`AI API failed with status: ${response.status}. Check server logs for details.`);
    }

    return await response.json();
}


export default async function handler(req, res) {
    res.setHeader('Access-control-allow-origin', '*');
    res.setHeader('Access-control-allow-methods', 'POST, OPTIONS');
    res.setHeader('Access-control-allow-headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ success: false, message: 'AI API key is not configured on the server.' });
    }

    try {
        const { text, count, language } = req.body;

        if (!text || !count || !language) {
            return res.status(400).json({ success: false, message: 'Missing required parameters: text, count, or language.' });
        }

        const aiResponse = await callGemini(text, count, language, GEMINI_API_KEY);
        
        // The Gemini response structure is nested, so we extract the 'mcqs' part
        const mcqs = aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!mcqs) {
             return res.status(500).json({ success: false, message: 'AI did not return a valid MCQ structure. It might be due to content policy or invalid input.' });
        }
        
        // The response from Gemini is a JSON string, so we parse it.
        const parsedMcqs = JSON.parse(mcqs);

        if (!parsedMcqs.mcqs || parsedMcqs.mcqs.length === 0) {
           return res.status(200).json({ success: true, mcqs: [], message: "The AI could not generate questions from the provided text. Please try with a different or more detailed document." });
        }
        
        res.status(200).json({ success: true, mcqs: parsedMcqs.mcqs });

    } catch (error) {
        console.error('Server error in generate-mcq:', error);
        res.status(500).json({ success: false, message: error.message || 'An internal server error occurred.' });
    }
}
