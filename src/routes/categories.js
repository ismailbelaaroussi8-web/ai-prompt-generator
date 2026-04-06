const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/connection');

// Helper functions
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

// ─── GET /api/categories — List all categories ──────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const categories = queryAll(db,
      `SELECT c.*,
              (SELECT COUNT(*) FROM prompts p WHERE p.category = c.slug) as actual_count
       FROM categories c
       ORDER BY c.name ASC`
    );

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    console.error('Error in GET /api/categories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/categories/:slug — Single category detail ──────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const db = await getDatabase();
    const { slug } = req.params;

    const category = queryOne(db,
      `SELECT c.*,
              (SELECT COUNT(*) FROM prompts p WHERE p.category = c.slug) as actual_count
       FROM categories c
       WHERE c.slug = ?`,
      [slug]
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: `Category "${slug}" not found`,
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    console.error('Error in GET /api/categories/:slug:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
