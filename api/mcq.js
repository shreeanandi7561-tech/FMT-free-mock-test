export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const BUCKET_BASE_URL = process.env.NEXT_PUBLIC_CLOUDFLARE_BUCKET_URL;
  
  if (!BUCKET_BASE_URL) {
    return res.status(500).json({ error: "Cloudflare bucket URL is not configured on the server." });
  }

  const { subject } = req.query;
  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }

  try {
    const response = await fetch(`${BUCKET_BASE_URL}/${subject}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${subject}.json from bucket. Status: ${response.status}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from R2 bucket:', error);
    res.status(500).json({ error: error.message });
  }
}
