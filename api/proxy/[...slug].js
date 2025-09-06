// File: /pages/api/proxy/[...slug].js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { path } = req.query; // Use 'path' to match vercel.json rewrite rule

    // Check if path is missing or invalid.
    if (!path || !Array.isArray(path)) {
      console.error("Missing or invalid path:", req.query);
      return res.status(500).json({ error: "Proxy failed", details: "Invalid path parameter in request." });
    }

    const targetUrl = `https://prod.bgaming.bet/bgaming/bgaming-aviamasters/${path.join('/')}`;

    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    };

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();
    res.status(response.status).send(data);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy failed", details: error.message });
  }
}
