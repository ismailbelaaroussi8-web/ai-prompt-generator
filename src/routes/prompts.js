const express = require('express');
const router = express.Router();
const { getDatabase, saveDatabase } = require('../db/connection');
const { requireAdmin } = require('../middleware/auth');

// Helper: run a SELECT query and return all rows as array of objects
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

// Helper: run a SELECT query and return first row as object (or null)
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

// ─── GET /api/prompts — List all prompts (paginated) ────────────────────────
router.get('/', async (req, res) => {
  try {
    const db = await getDatabase();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const tool = req.query.tool;
    const sort = req.query.sort || 'created_at';
    const order = (req.query.order || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Whitelist sortable columns
    const validSorts = ['created_at', 'likes', 'title'];
    const sortCol = validSorts.includes(sort) ? sort : 'created_at';

    let whereClause = '';
    const countParams = [];
    const queryParams = [];

    if (tool) {
      whereClause = 'WHERE tool_target = ?';
      countParams.push(tool.toLowerCase());
      queryParams.push(tool.toLowerCase());
    }

    const countRow = queryOne(db, `SELECT COUNT(*) as total FROM prompts ${whereClause}`, countParams);
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    queryParams.push(limit, offset);

    const prompts = queryAll(db,
      `SELECT id, title, prompt_text, category, tool_target, style_tags, likes, created_at
       FROM prompts
       ${whereClause}
       ORDER BY ${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      queryParams
    );

    // Parse style_tags JSON for each prompt
    const parsed = prompts.map(p => ({
      ...p,
      style_tags: JSON.parse(p.style_tags || '[]'),
    }));

    res.json({
      success: true,
      data: parsed,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/prompts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/prompts/category/:category — Filter by category ────────────────
router.get('/category/:category', async (req, res) => {
  try {
    const db = await getDatabase();
    const { category } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Check if category exists
    const categoryRow = queryOne(db, 'SELECT * FROM categories WHERE slug = ?', [category]);
    if (!categoryRow) {
      const availCats = queryAll(db, 'SELECT slug FROM categories');
      return res.status(404).json({
        success: false,
        error: `Category "${category}" not found`,
        available_categories: availCats.map(c => c.slug),
      });
    }

    const countRow = queryOne(db, 'SELECT COUNT(*) as total FROM prompts WHERE category = ?', [category]);
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    const prompts = queryAll(db,
      `SELECT id, title, prompt_text, category, tool_target, style_tags, likes, created_at
       FROM prompts
       WHERE category = ?
       ORDER BY likes DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [category, limit, offset]
    );

    const parsed = prompts.map(p => ({
      ...p,
      style_tags: JSON.parse(p.style_tags || '[]'),
    }));

    res.json({
      success: true,
      category: categoryRow,
      data: parsed,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error('Error in GET /api/prompts/category:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/prompts/:id — Single prompt detail ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const db = await getDatabase();
    const { id } = req.params;

    // Skip if id matches reserved words
    if (id === 'category') {
      return res.status(400).json({
        success: false,
        error: 'Use /api/prompts/category/:categorySlug for category filtering',
      });
    }

    const promptId = parseInt(id);
    if (isNaN(promptId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt ID. Must be a number.',
      });
    }

    const prompt = queryOne(db,
      `SELECT id, title, prompt_text, category, tool_target, style_tags, likes, created_at
       FROM prompts WHERE id = ?`,
      [promptId]
    );

    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: `Prompt with id ${promptId} not found`,
      });
    }

    prompt.style_tags = JSON.parse(prompt.style_tags || '[]');

    res.json({
      success: true,
      data: prompt,
    });
  } catch (err) {
    console.error('Error in GET /api/prompts/:id:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/prompts — Add new prompt (admin only) ─────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = await getDatabase();
    const { title, prompt_text, category, tool_target, style_tags } = req.body;

    // Validate required fields
    const errors = [];
    if (!title) errors.push('title is required');
    if (!prompt_text) errors.push('prompt_text is required');
    if (!category) errors.push('category is required');
    if (!tool_target) errors.push('tool_target is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Validate tool_target
    const validTools = ['midjourney', 'dalle', 'flux'];
    if (!validTools.includes(tool_target.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `tool_target must be one of: ${validTools.join(', ')}`,
      });
    }

    // Check category exists
    const categoryRow = queryOne(db, 'SELECT * FROM categories WHERE slug = ?', [category]);
    if (!categoryRow) {
      const availCats = queryAll(db, 'SELECT slug FROM categories');
      return res.status(400).json({
        success: false,
        error: `Category "${category}" does not exist`,
        available_categories: availCats.map(c => c.slug),
      });
    }

    // Insert prompt
    const tagsJson = JSON.stringify(style_tags || []);
    db.run(
      `INSERT INTO prompts (title, prompt_text, category, tool_target, style_tags)
       VALUES (?, ?, ?, ?, ?)`,
      [title, prompt_text, category, tool_target.toLowerCase(), tagsJson]
    );

    // Get the last inserted row
    const lastIdRow = queryOne(db, 'SELECT last_insert_rowid() as id');
    const newId = lastIdRow.id;

    // Update category count
    db.run('UPDATE categories SET prompt_count = prompt_count + 1 WHERE slug = ?', [category]);
    saveDatabase();

    const newPrompt = queryOne(db, 'SELECT * FROM prompts WHERE id = ?', [newId]);
    newPrompt.style_tags = JSON.parse(newPrompt.style_tags || '[]');

    res.status(201).json({
      success: true,
      message: 'Prompt created successfully',
      data: newPrompt,
    });
  } catch (err) {
    console.error('Error in POST /api/prompts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/prompts/:id/like — Increment likes ───────────────────────────
router.patch('/:id/like', async (req, res) => {
  try {
    const db = await getDatabase();
    const promptId = parseInt(req.params.id);

    if (isNaN(promptId)) {
      return res.status(400).json({ success: false, error: 'Invalid prompt ID' });
    }

    const prompt = queryOne(db, 'SELECT id FROM prompts WHERE id = ?', [promptId]);
    if (!prompt) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }

    db.run('UPDATE prompts SET likes = likes + 1 WHERE id = ?', [promptId]);
    saveDatabase();

    const updated = queryOne(db, 'SELECT * FROM prompts WHERE id = ?', [promptId]);
    updated.style_tags = JSON.parse(updated.style_tags || '[]');

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error('Error in PATCH /api/prompts/:id/like:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
