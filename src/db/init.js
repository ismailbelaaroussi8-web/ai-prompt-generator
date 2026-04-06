const { getDatabase, saveDatabase } = require('./connection');

async function initDatabase() {
  const db = await getDatabase();

  // Create categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      prompt_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create prompts table
  db.run(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      category TEXT NOT NULL,
      tool_target TEXT NOT NULL CHECK(tool_target IN ('midjourney', 'dalle', 'flux')),
      style_tags TEXT DEFAULT '[]',
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category) REFERENCES categories(slug) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_prompts_tool_target ON prompts(tool_target)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts(created_at)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`);

  saveDatabase();
  console.log('✅ Database initialized successfully');
}

if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = { initDatabase };
