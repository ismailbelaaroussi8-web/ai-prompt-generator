require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { initDatabase } = require('./db/init');
const { getDatabase, closeDatabase } = require('./db/connection');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Route imports
const promptsRouter = require('./routes/prompts');
const generateRouter = require('./routes/generate');
const categoriesRouter = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ─────────────────────────────────────────────────────
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || origin === 'null') return callback(null, true);

    // Check exact match
    if (corsOrigins.includes(origin)) return callback(null, true);

    // Check .vercel.app wildcard
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
}));

// ─── Security & Parsing ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
app.use('/api/', limiter);

// ─── API Root ────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'AI Prompt Generator API',
    version: '1.0.0',
    description: 'Generate and browse AI image prompts for MidJourney, DALL-E, and Flux',
    endpoints: {
      'GET /api': 'This documentation',
      'GET /api/health': 'Health check',
      'GET /api/prompts': 'List all prompts (paginated)',
      'GET /api/prompts/category/:category': 'Filter prompts by category',
      'GET /api/prompts/:id': 'Get single prompt detail',
      'POST /api/prompts': 'Add new prompt (admin, requires X-API-Key header)',
      'PATCH /api/prompts/:id/like': 'Like a prompt',
      'POST /api/generate-prompt': 'Generate a tool-specific prompt',
      'GET /api/generate-prompt/options': 'Get available styles, lighting, moods',
      'GET /api/categories': 'List all categories',
      'GET /api/categories/:slug': 'Get single category detail',
    },
    query_params: {
      'page': 'Page number (default: 1)',
      'limit': 'Items per page (default: 20, max: 100)',
      'tool': 'Filter by tool: midjourney, dalle, flux',
      'sort': 'Sort by: created_at, likes, title',
      'order': 'Sort order: asc, desc (default: desc)',
    },
  });
});

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const db = await getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM prompts');
    stmt.step();
    const row = stmt.getAsObject();
    stmt.free();

    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      prompts_count: row.count,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// ─── Serve Frontend ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/prompts', promptsRouter);
app.use('/api/generate-prompt', generateRouter);
app.use('/api/categories', categoriesRouter);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

// ─── Start Server ────────────────────────────────────────────────────────────
async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database ready');

    app.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   🎨 AI Prompt Generator API                     ║
  ║   Running on http://localhost:${PORT}               ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                ║
  ╚═══════════════════════════════════════════════════╝
      `);
      console.log('  📖 API docs:   http://localhost:' + PORT + '/api');
      console.log('  ❤️  Health:     http://localhost:' + PORT + '/api/health');
      console.log('  📋 Prompts:    http://localhost:' + PORT + '/api/prompts');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
