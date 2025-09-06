import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { slug } = req.query; // array of path segments
  const targetUrl = `https://prod.softswiss.bet/bgaming/${slug.join('/')}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
