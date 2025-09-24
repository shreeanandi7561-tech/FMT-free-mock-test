const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const testId = req.query.testId;

  if (!testId) {
    return res.status(400).json({ error: 'Test ID is required' });
  }
  
  const bucketUrl = process.env.R2_PUBLIC_URL;
  const questionsUrl = `${bucketUrl}/${testId}.json`;
  
  try {
    const response = await fetch(questionsUrl);
    
    if (!response.ok) {
      return res.status(404).json({ error: `Test file not found for ID: ${testId}` });
    }
    
    const questions = await response.json();
    
    return res.status(200).json(questions);
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'An unexpected error occurred while fetching test questions.' });
  }
};
