import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { slug } = req.query; // slug is an array of path segments
  const targetUrl = `https://prod.softswiss.bet/${slug.join('/')}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const data = await response.text(); // or json() if API returns JSON
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
