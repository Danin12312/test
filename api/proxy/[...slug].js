// api/proxy/[...slug].js
module.exports = async (req, res) => {
  try {
    const { slug } = req.query;
    return res.status(200).json({ slug, method: req.method });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Function crashed', details: err.message });
  }
};
