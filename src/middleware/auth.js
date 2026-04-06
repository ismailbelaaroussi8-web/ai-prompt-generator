require('dotenv').config();

/**
 * Admin API Key authentication middleware
 * Checks for X-API-Key header matching the configured ADMIN_API_KEY
 */
function requireAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const adminKey = process.env.ADMIN_API_KEY;

  if (!adminKey) {
    return res.status(500).json({
      success: false,
      error: 'Server misconfiguration: ADMIN_API_KEY not set',
    });
  }

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing API key. Include X-API-Key header.',
    });
  }

  if (apiKey !== adminKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key. Access denied.',
    });
  }

  next();
}

module.exports = { requireAdmin };
