const express = require('express');
const router = express.Router();
const { generatePrompt, getAvailableOptions } = require('../engine/promptGenerator');

// ─── POST /api/generate-prompt — Generate a tool-specific prompt ─────────────
router.post('/', (req, res) => {
  const { subject, style, lighting, mood, aspect_ratio, tool } = req.body;

  // Validate required fields
  if (!subject) {
    return res.status(400).json({
      success: false,
      error: 'subject is required',
      hint: 'Provide a description of what you want to generate',
    });
  }

  if (!tool) {
    return res.status(400).json({
      success: false,
      error: 'tool is required',
      hint: 'Specify one of: midjourney, dalle, flux',
    });
  }

  try {
    const result = generatePrompt({
      subject,
      style,
      lighting,
      mood,
      aspect_ratio,
      tool,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

// ─── GET /api/generate-prompt/options — Available options for dropdowns ───────
router.get('/options', (req, res) => {
  res.json({
    success: true,
    data: getAvailableOptions(),
  });
});

module.exports = router;
