export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    const targetUrl = `https://prod.softswiss.bet/${slug.join('/')}`;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { ...req.headers },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await response.json() : await response.text();
    res.status(response.status).send(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy crashed', details: err.message });
  }
}
