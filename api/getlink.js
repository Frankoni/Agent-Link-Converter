export default function handler(req, res) {
  try {
    const { link } = req.query;

    if (!link) {
      return res.status(400).json({ error: "Missing 'link' parameter" });
    }

    return res.status(200).json({
      message: "API is working!",
      received: link
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
