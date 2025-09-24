// A simple Node.js serverless function for Vercel
// This function fetches MCQ questions from a URL (e.g., Cloudflare R2).

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // In a real app, you would validate the user's auth token here first.
  // const authToken = req.headers.authorization;
  // if (!authToken || !isValidToken(authToken)) {
  //     return res.status(401).json({ error: 'Unauthorized' });
  // }

  const testId = req.query.testId; // Get testId from the URL query parameter

  if (!testId) {
    return res.status(400).json({ error: 'Test ID is required' });
  }
  
  // Replace this with your actual Cloudflare R2 bucket URL
  const bucketUrl = 'https://<YOUR_ACCOUNT_ID>.r2.cloudflarestorage.com/<YOUR_BUCKET_NAME>'; 
  const questionsUrl = `${bucketUrl}/${testId}.json`; // Assuming files are named like ssc_cgl_2023.json
  
  try {
    const response = await fetch(questionsUrl);
    
    if (!response.ok) {
      return res.status(404).json({ error: `Test file not found for ID: ${testId}` });
    }
    
    const questions = await response.json();
    
    // In a real app, you might want to shuffle the questions or apply other logic
    
    return res.status(200).json(questions);
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while fetching test questions.' });
  }
};
