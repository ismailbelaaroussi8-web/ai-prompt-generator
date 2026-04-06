const { initDatabase } = require('./init');
const { getDatabase, saveDatabase, closeDatabase } = require('./connection');

async function seed() {
  // Initialize tables first
  await initDatabase();
  const db = await getDatabase();

  // Clear existing data
  db.run('DELETE FROM prompts');
  db.run('DELETE FROM categories');

  // ─── Seed Categories ───────────────────────────────────────────────
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, prompt_count)
    VALUES (?, ?, ?, ?)
  `);

  const categories = [
    ['Portrait', 'portrait', 'Character portraits, headshots, and figure studies with dramatic lighting and emotion', 6],
    ['Landscape', 'landscape', 'Breathtaking natural and urban landscapes, scenic vistas, and environmental art', 6],
    ['Product', 'product', 'Commercial product photography, packaging mockups, and advertising visuals', 6],
    ['Anime', 'anime', 'Japanese animation-inspired artwork, manga characters, and stylized illustrations', 6],
    ['Architecture', 'architecture', 'Architectural visualization, interior design, and structural concept art', 6],
  ];

  for (const cat of categories) {
    insertCategory.bind(cat);
    insertCategory.step();
    insertCategory.reset();
  }
  insertCategory.free();

  // ─── Seed Prompts ──────────────────────────────────────────────────
  const insertPrompt = db.prepare(`
    INSERT INTO prompts (title, prompt_text, category, tool_target, style_tags, likes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const prompts = [
    // ── Portrait (6) ─────────────────────────────────────────────────
    [
      'Ethereal Sorceress Portrait',
      'A close-up portrait of a mystical sorceress with glowing violet eyes, silver hair flowing like liquid mercury, intricate facial tattoos of constellations, wearing a crown of crystallized starlight, volumetric fog, Rembrandt lighting, shot on Hasselblad H6D, 8K ultra-detailed --ar 2:3 --v 6 --style raw',
      'portrait', 'midjourney',
      JSON.stringify(['fantasy', 'ethereal', 'dramatic-lighting', 'detailed']),
      142
    ],
    [
      'Cyberpunk Street Samurai',
      'Cyberpunk street samurai with neon-lit cybernetic implants across their face, rain-soaked hair, holographic HUD reflecting in their eyes, wearing a weathered tactical jacket with luminescent piping, Tokyo alley background with kanji signs, cinematic color grading, depth of field',
      'portrait', 'dalle',
      JSON.stringify(['cyberpunk', 'sci-fi', 'neon', 'cinematic']),
      98
    ],
    [
      'Renaissance Oil Painting Revival',
      'A regal portrait in the style of Caravaggio, dramatic chiaroscuro lighting, a noble figure wearing a velvet doublet with gold embroidery, holding a quill pen, dark umber background, visible brushstrokes, craquelure texture, museum-quality oil painting --ar 3:4 --v 6',
      'portrait', 'midjourney',
      JSON.stringify(['classical', 'oil-painting', 'chiaroscuro', 'renaissance']),
      203
    ],
    [
      'Futuristic Fashion Editorial',
      'High-fashion editorial portrait, model wearing an avant-garde chrome headpiece with organic flowing lines, iridescent makeup with holographic highlights, minimalist white studio background, sharp studio lighting with colored rim lights in magenta and cyan, Vogue magazine quality',
      'portrait', 'flux',
      JSON.stringify(['fashion', 'editorial', 'futuristic', 'studio']),
      76
    ],
    [
      'Weathered Explorer Close-Up',
      'Extreme close-up portrait of an elderly mountain explorer, deeply weathered skin with every wrinkle telling a story, ice crystals in their grey beard, glacier reflected in pale blue eyes, fur-lined hood framing the face, golden hour sidelight, National Geographic style photography --ar 4:5 --v 6 --style raw',
      'portrait', 'midjourney',
      JSON.stringify(['photorealistic', 'character', 'natural-light', 'documentary']),
      167
    ],
    [
      'Bioluminescent Forest Spirit',
      'Portrait of a forest spirit entity with skin made of living bark and moss, bioluminescent fungi sprouting from their shoulders and hair, firefly-like particles floating around, deep forest background with god rays, fantasy concept art style, painterly rendering',
      'portrait', 'dalle',
      JSON.stringify(['fantasy', 'nature', 'bioluminescent', 'concept-art']),
      119
    ],

    // ── Landscape (6) ────────────────────────────────────────────────
    [
      'Floating Islands at Sunset',
      'Massive floating islands suspended in a cotton-candy sky at golden hour, waterfalls cascading into the void below, ancient temples perched on cliff edges, bioluminescent flora glowing as dusk approaches, volumetric clouds wrapping around the islands, painted in the style of Studio Ghibli, 8K panoramic --ar 21:9 --v 6',
      'landscape', 'midjourney',
      JSON.stringify(['fantasy', 'ghibli', 'panoramic', 'golden-hour']),
      287
    ],
    [
      'Abandoned Solarpunk Cityscape',
      'A sprawling solarpunk city reclaimed by nature, massive solar trees towering over vine-covered skyscrapers, crystal-clear rivers flowing through elevated aqueducts, community gardens on every rooftop, warm afternoon light casting long shadows, drone\'s eye view, photorealistic rendering',
      'landscape', 'dalle',
      JSON.stringify(['solarpunk', 'futuristic', 'nature', 'utopian']),
      195
    ],
    [
      'Volcanic Lightning Storm',
      'A dramatic volcanic eruption at night with spectacular volcanic lightning bolts crackling through the ash plume, molten lava rivers cutting through obsidian fields, the Milky Way visible above the chaos, long exposure photography style, National Geographic award-winning shot --ar 16:9 --v 6 --style raw',
      'landscape', 'midjourney',
      JSON.stringify(['dramatic', 'nature', 'night', 'photorealistic']),
      312
    ],
    [
      'Crystal Cave Cathedral',
      'Inside an enormous crystal cave system, massive selenite crystals the size of school buses glowing with internal light, an underground lake reflecting the crystalline ceiling like a mirror, a tiny explorer with a headlamp for scale, otherworldly blue and purple color palette, hyper-detailed 3D render',
      'landscape', 'flux',
      JSON.stringify(['underground', 'crystals', 'surreal', 'scale']),
      154
    ],
    [
      'Arctic Aurora Dreamscape',
      'The Northern Lights exploding across an Arctic sky in impossible colors — electric magenta, vivid teal and liquid gold, reflected perfectly in a frozen lake, snow-covered pine forest silhouetted against the display, shooting stars streaking through, 14mm wide-angle perspective, astrophotography --ar 16:9 --v 6',
      'landscape', 'midjourney',
      JSON.stringify(['aurora', 'arctic', 'night-sky', 'wide-angle']),
      241
    ],
    [
      'Underwater Ancient Ruins',
      'Sunken ancient Greek temple ruins deep underwater, shafts of sunlight penetrating the azure water, schools of tropical fish swimming through marble columns, coral and sea anemones growing on carved friezes, a giant sea turtle passing through the entrance, underwater photography with natural caustics',
      'landscape', 'dalle',
      JSON.stringify(['underwater', 'ancient', 'ruins', 'marine']),
      178
    ],

    // ── Product (6) ──────────────────────────────────────────────────
    [
      'Luxury Watch Levitation',
      'A luxury chronograph watch suspended in mid-air with water droplets frozen around it, brushed titanium case catching studio highlights, sapphire crystal dial reflecting a mountain landscape, black gradient background, commercial product photography, focus stacking, 8K macro --ar 1:1 --v 6',
      'product', 'midjourney',
      JSON.stringify(['luxury', 'watch', 'commercial', 'macro']),
      89
    ],
    [
      'Organic Skincare Line Display',
      'Elegant organic skincare product line arrangement on a bed of fresh botanicals — lavender sprigs, chamomile flowers, and eucalyptus leaves, morning dew droplets on frosted glass bottles, soft diffused natural light from a window, marble countertop surface, clean beauty aesthetic',
      'product', 'dalle',
      JSON.stringify(['skincare', 'organic', 'natural-light', 'lifestyle']),
      67
    ],
    [
      'Sneaker Explosion Concept',
      'Deconstructed sneaker mid-explosion showing all internal components — air sole, memory foam insole, woven mesh upper, carbon fiber shank plate — all floating in perfect position, dynamic studio lighting with colored gels in orange and blue, dark studio background, advertising hero shot --ar 16:9 --v 6',
      'product', 'midjourney',
      JSON.stringify(['footwear', 'deconstructed', 'dynamic', 'advertising']),
      134
    ],
    [
      'Artisan Coffee Packaging',
      'Premium artisan coffee bag packaging mockup in a cozy cafe setting, kraft paper bag with minimal typography, fresh coffee beans scattered artfully, steam rising from a ceramic pour-over in the background, warm tungsten lighting, shallow depth of field, lifestyle product photography',
      'product', 'flux',
      JSON.stringify(['coffee', 'packaging', 'lifestyle', 'warm']),
      56
    ],
    [
      'Tech Gadget Holographic Display',
      'Next-generation smartphone floating above a reflective black surface, holographic UI elements projected from the screen showing a weather app, light rays emanating from the display, futuristic tech product visualization, clean minimal composition, ray-traced reflections --ar 4:5 --v 6',
      'product', 'midjourney',
      JSON.stringify(['tech', 'holographic', 'futuristic', 'minimal']),
      102
    ],
    [
      'Luxury Perfume Crystal Garden',
      'An exquisite perfume bottle carved from a single amethyst crystal, placed in a miniature enchanted garden with tiny glowing flowers, golden hour light creating prismatic refractions through the crystal, dewdrops on rose petals in the foreground, ultra-luxury beauty advertising',
      'product', 'dalle',
      JSON.stringify(['perfume', 'luxury', 'crystal', 'beauty']),
      91
    ],

    // ── Anime (6) ────────────────────────────────────────────────────
    [
      'Mecha Pilot at Sunset',
      'An anime mecha pilot standing atop their giant robot\'s shoulder at sunset, wind catching their flight suit and hair, a devastated battlefield stretching to the horizon, dramatic clouds painted in oranges and purples, the mecha\'s eye glowing a faint blue, Studio Sunrise quality, cel-shaded with detailed linework --ar 16:9 --niji 6',
      'anime', 'midjourney',
      JSON.stringify(['mecha', 'sunset', 'dramatic', 'cel-shaded']),
      256
    ],
    [
      'Magical Girl Transformation',
      'A magical girl mid-transformation sequence, ribbons of starlight wrapping around her form, her staff crystallizing from pure energy, cherry blossom petals and sparkles swirling in a vortex, dynamic pose with flowing hair, pastel color palette with vivid magical accents, Sailor Moon meets modern anime aesthetic',
      'anime', 'dalle',
      JSON.stringify(['magical-girl', 'transformation', 'sparkle', 'pastel']),
      189
    ],
    [
      'Rainy Tokyo Lo-Fi Scene',
      'A cozy anime scene of a girl sitting at a rain-streaked window in a small Tokyo apartment, warm lamplight illuminating her desk covered with books and a steaming cup of tea, a sleeping cat curled on the windowsill, neon city lights blurred by rain outside, lo-fi aesthetic, soft watercolor textures --ar 16:9 --niji 6',
      'anime', 'midjourney',
      JSON.stringify(['lo-fi', 'cozy', 'rain', 'slice-of-life']),
      324
    ],
    [
      'Dragon Rider Battle',
      'Epic anime battle scene, a dragon rider diving through storm clouds on a massive ice dragon, lightning crackling around them, enemy fire dragons approaching from below with trails of flame, dynamic diagonal composition, speed lines and motion blur, vibrant action anime style with detailed scales and armor',
      'anime', 'flux',
      JSON.stringify(['action', 'dragons', 'battle', 'epic']),
      198
    ],
    [
      'Spirit Realm Shrine Maiden',
      'A shrine maiden performing a sacred ritual at a torii gate between worlds, one side showing the mortal realm in autumn colors, the other side showing a spirit realm of floating lanterns and ethereal yokai, her ofuda papers glowing with spiritual energy, detailed kimono patterns, Mushishi-inspired atmosphere --niji 6',
      'anime', 'midjourney',
      JSON.stringify(['spiritual', 'shrine', 'yokai', 'atmospheric']),
      167
    ],
    [
      'Cyberpunk Anime Hacker Den',
      'A genius hacker in a cluttered high-tech den, multiple holographic screens floating around them showing scrolling code, energy drink cans and instant ramen cups scattered about, a small robot companion perched on the monitor, neon underglow from custom PC setup, Ghost in the Shell meets Steins;Gate aesthetic',
      'anime', 'dalle',
      JSON.stringify(['cyberpunk', 'hacker', 'tech', 'detailed-interior']),
      143
    ],

    // ── Architecture (6) ─────────────────────────────────────────────
    [
      'Parametric Museum of the Future',
      'A parametric architecture museum with an organic flowing facade made of interlocking white aluminum panels, the building appears to breathe and move, surrounded by a reflecting pool at twilight, interior warm glow visible through mesh openings, inspired by Zaha Hadid, architectural photography with tilt-shift lens --ar 16:9 --v 6',
      'architecture', 'midjourney',
      JSON.stringify(['parametric', 'futuristic', 'museum', 'zaha-hadid']),
      178
    ],
    [
      'Treehouse Village Network',
      'An interconnected treehouse village built within ancient redwood trees, suspension bridges linking multi-level structures, warm lantern light glowing from circular windows, a spiral staircase wrapping around the main trunk, morning mist filtering through the canopy, fantasy meets sustainable architecture',
      'architecture', 'dalle',
      JSON.stringify(['treehouse', 'fantasy', 'sustainable', 'village']),
      213
    ],
    [
      'Brutalist Chapel of Light',
      'A brutalist concrete chapel where dramatic shafts of light pour through precisely cut geometric apertures in the walls, creating patterns on the raw concrete floor, a single minimalist altar illuminated by a cross-shaped skylight, Tadao Ando inspired, black and white architectural photography --ar 3:4 --v 6 --style raw',
      'architecture', 'midjourney',
      JSON.stringify(['brutalist', 'chapel', 'light', 'minimal']),
      145
    ],
    [
      'Underwater Research Station',
      'A modular underwater research station at 200 meters depth, transparent geodesic dome sections revealing marine life, bioluminescent pathway lighting, submarine docking bay, kelp forest visible through panoramic windows, a whale passing in the background, sci-fi architectural concept, detailed cross-section view',
      'architecture', 'flux',
      JSON.stringify(['underwater', 'sci-fi', 'research', 'modular']),
      167
    ],
    [
      'Art Deco Skyscraper Revival',
      'A modern Art Deco skyscraper reaching into dramatic cumulus clouds, chrome and black granite facade with geometric sunburst motifs, eagle gargoyles at the setbacks, the lobby visible through massive arched entrance with gold leaf ceiling, Manhattan skyline context, golden hour photography --ar 9:16 --v 6',
      'architecture', 'midjourney',
      JSON.stringify(['art-deco', 'skyscraper', 'golden-hour', 'manhattan']),
      132
    ],
    [
      'Living Moss Library Interior',
      'A grand library interior where the walls are covered in carefully maintained living moss in geometric patterns, floor-to-ceiling bookshelves made of reclaimed wood, reading nooks carved into the moss walls with warm pendant lighting, a skylight running the length of the ceiling, biophilic design at its finest, interior architecture photography',
      'architecture', 'dalle',
      JSON.stringify(['biophilic', 'library', 'interior', 'sustainable']),
      189
    ],
  ];

  for (const prompt of prompts) {
    insertPrompt.bind(prompt);
    insertPrompt.step();
    insertPrompt.reset();
  }
  insertPrompt.free();

  saveDatabase();
  console.log(`✅ Seeded ${categories.length} categories`);
  console.log(`✅ Seeded ${prompts.length} prompts`);
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = { seed };
