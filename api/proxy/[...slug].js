import fetch from 'node-fetch';

export default async function handler(req, res) {
  res.status(200).json({ ok: true });
  const { slug } = req.query; // slug is an array
  const targetUrl = `https://prod.softswiss.bet/${slug.join('/')}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'prod.softswiss.bet',
        'accept-encoding': 'gzip, deflate, br',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text(); // Use text because it might not be JSON
    res.status(response.status).send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
