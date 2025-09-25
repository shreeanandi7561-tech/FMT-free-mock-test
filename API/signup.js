const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { name, mobile, password, email } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ success: false, message: "Mobile number and password are required" });
  }

  try {
    // Check if user already exists
    let { data: existingUser, error: existErr } = await supabase
      .from("users")
      .select("mobile")
      .eq("mobile", mobile)
      .single();

    if (existingUser) {
      return res.status(409).json({ success: false, message: "User with this mobile number already exists" });
    }

    // Insert new user
    let { data, error } = await supabase.from("users").insert([
      { name, mobile, password, email, joined_at: new Date() }
    ]);

    if (error) {
      console.error("Signup error:", error);
      return res.status(500).json({ success: false, message: "Signup failed. Please try again." });
    }

    // Dummy token for now
    const authToken = "dummy-auth-token-12345";
    return res.status(200).json({
      success: true,
      message: "Signup successful!",
      user: data[0],
      token: authToken
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred."
    });
  }
};
