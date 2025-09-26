export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { name, mobile, password, email } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: "Mobile number and password required" });
  }

  // Dummy response (database ka code baad mein add karein)
  return res.status(200).json({
    success: true,
    message: "Signup successful!",
    user: { name, mobile, email },
    token: "dummy-auth-token-123"
  });
}
