// File: /api/proxy/[...slug].js

export default async function handler(req, res) {
  try {
    // Log incoming request for debugging
    console.log("Request received:", req.method, req.url, req.body);

    // Build the target URL dynamically from the slug
    const { slug } = req.query; // slug is an array
    const targetUrl = `https://prod.bgaming.bet/${slug.join('/')}`;

    // Forward the request
    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined, // remove host to avoid conflicts
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    };

    const response = await fetch(targetUrl, fetchOptions);

    // Forward the response back to the client
    const data = await response.text(); // use text() in case it's not JSON
    res.status(response.status).send(data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy failed", details: error.message });
  }
}
