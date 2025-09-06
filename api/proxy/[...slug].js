// /api/proxy/bgaming/[...slug].js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { slug } = req.query;
  const url = `https://prod.softswiss.bet/bgaming/${slug.join('/')}`;

  const response = await fetch(url, {
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    body: req.method !== 'GET' ? req.body : undefined,
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
