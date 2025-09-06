// File: /api/proxy/[...slug].js

export default async function handler(req, res) {
  try {
    // Log incoming request for debugging
    console.log("Request received:", req.method, req.url);
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body); // Check if the body is received

    // Dynamically build the target URL from the slug
    const { slug } = req.query;
    const targetUrl = `https://prod.bgaming.bet/${slug.join('/')}`;

    // Log the target URL to ensure it's correct
    console.log("Proxying to:", targetUrl);

    // Create fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        // Crucially, remove the 'host' header as it can cause authentication/routing issues on the target server
        host: undefined,
      },
      // Pass the request body correctly
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    };

    // Forward the request
    const response = await fetch(targetUrl, fetchOptions);

    // Forward all headers from the target server back to the client
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Use a stream for large responses to prevent memory issues
    res.status(response.status);
    response.body.pipe(res);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Proxy failed", details: error.message });
  }
}
