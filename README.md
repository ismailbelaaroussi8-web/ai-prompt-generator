# 🎨 AI Prompt Generator API

> REST API for generating and browsing AI image prompts for **MidJourney**, **DALL-E**, and **Flux**

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your preferred settings

# 3. Initialize database & seed data
npm run seed

# 4. Start the development server
npm run dev
```

The API will be running at **http://localhost:5000**

---

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Endpoints Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api` | API documentation & endpoint list | — |
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/prompts` | List all prompts (paginated) | — |
| `GET` | `/api/prompts/category/:slug` | Filter prompts by category | — |
| `GET` | `/api/prompts/:id` | Get single prompt detail | — |
| `POST` | `/api/prompts` | Create new prompt | Admin |
| `PATCH` | `/api/prompts/:id/like` | Like a prompt | — |
| `POST` | `/api/generate-prompt` | Generate a tool-specific prompt | — |
| `GET` | `/api/generate-prompt/options` | Available styles/lighting/moods | — |
| `GET` | `/api/categories` | List all categories | — |
| `GET` | `/api/categories/:slug` | Get single category | — |

---

### 🔄 Generate Prompt

**`POST /api/generate-prompt`**

Generate a formatted, tool-specific prompt from components.

**Request Body:**
```json
{
  "subject": "A majestic dragon flying over a moonlit ocean",
  "style": "cinematic",
  "lighting": "moonlight",
  "mood": "epic",
  "aspect_ratio": "16:9",
  "tool": "midjourney"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "prompt": "A majestic dragon flying over a moonlit ocean, cinematic composition, film grain, anamorphic lens flare, color graded, moonlit scene, cool blue tones, soft lunar glow, nocturnal, epic and grandiose, awe-inspiring scale, heroic atmosphere --ar 16:9 --v 6 --quality 2",
    "tool": "midjourney",
    "components": {
      "subject": "A majestic dragon flying over a moonlit ocean",
      "style": "cinematic",
      "lighting": "moonlight",
      "mood": "epic",
      "aspect_ratio": "16:9"
    },
    "metadata": {
      "char_count": 245,
      "generated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Get Available Options:**

**`GET /api/generate-prompt/options`**

Returns all available styles, lighting types, moods, tools, and aspect ratios.

---

### 📋 Prompts Library

**`GET /api/prompts`**

**Query Parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Items per page (max: 100) |
| `tool` | — | Filter by tool: `midjourney`, `dalle`, `flux` |
| `sort` | `created_at` | Sort by: `created_at`, `likes`, `title` |
| `order` | `desc` | Sort order: `asc`, `desc` |

**Example:** `GET /api/prompts?page=1&limit=10&tool=midjourney&sort=likes&order=desc`

---

**`GET /api/prompts/category/:slug`**

Filter prompts by category slug.

**Available categories:** `portrait`, `landscape`, `product`, `anime`, `architecture`

---

**`POST /api/prompts`** *(Admin only)*

**Headers:**
```
X-API-Key: your-admin-key
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Cosmic Whale",
  "prompt_text": "A cosmic whale swimming through a nebula...",
  "category": "landscape",
  "tool_target": "midjourney",
  "style_tags": ["cosmic", "surreal", "space"]
}
```

---

### 🏷️ Categories

**`GET /api/categories`** — List all categories with prompt counts

**`GET /api/categories/:slug`** — Get single category details

---

### ❤️ Like a Prompt

**`PATCH /api/prompts/:id/like`**

Increments the like count for a prompt. Returns the updated prompt.

---

## Authentication

Admin-only endpoints require an API key header:

```
X-API-Key: your-secret-admin-key
```

Set the key in your `.env` file as `ADMIN_API_KEY`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_PATH` | `./data/prompts.db` | SQLite database path |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins |
| `ADMIN_API_KEY` | — | API key for admin endpoints |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

---

## Project Structure

```
├── src/
│   ├── server.js            # Express app & server entry point
│   ├── db/
│   │   ├── init.js          # Database schema initialization
│   │   ├── connection.js    # Database connection singleton
│   │   └── seed.js          # Seed data (30 prompts, 5 categories)
│   ├── engine/
│   │   └── promptGenerator.js  # Template-based prompt generation
│   ├── middleware/
│   │   ├── auth.js          # Admin API key verification
│   │   └── errorHandler.js  # Error handling & 404
│   └── routes/
│       ├── prompts.js       # Prompt CRUD endpoints
│       ├── generate.js      # Prompt generation endpoint
│       └── categories.js    # Category endpoints
├── data/                    # SQLite database (auto-created)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Deployment

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Add a `vercel.json`:
```json
{
  "builds": [{ "src": "src/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.js" }]
}
```
3. Set environment variables in Vercel dashboard
4. Deploy: `vercel --prod`

### Railway

1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Railway auto-detects Node.js and runs `npm start`

---

## License

MIT
