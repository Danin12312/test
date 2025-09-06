const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { slug } = req.query; // Array of path segments
    const targetUrl = `https://prod.softswiss.bet/${slug.join('/')}`;

    // Forward headers and body
    const fetchOptions = {
      method: req.method,
      headers: { ...req.headers },
    };

    // Only forward body if it's POST, PUT, PATCH
    if (req.method !== 'GET' && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      fetchOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');

    // Forward response
    const data = contentType && contentType.includes('application/json') ? await response.json() : await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Proxy function crashed', details: err.message });
  }
};
