export default async function handler(req, res) {
  // Join all parts of the path (e.g. /game/game/123)
  const { path = [] } = req.query;
  const targetUrl = `https://prod.softswiss.bet/${path.join("/")}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined, // avoid host header issues
      },
      body: req.method !== "GET" ? req.body : undefined,
    });

    // Forward headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Forward status & data
    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({
      error: "Proxy request failed",
      details: error.message,
    });
  }
}
