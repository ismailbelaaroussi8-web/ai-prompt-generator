/**
 * Template-based Prompt Generator Engine
 * Generates tool-specific prompts for MidJourney, DALL-E, and Flux
 */

// ─── Style Templates ─────────────────────────────────────────────────────────

const STYLE_MODIFIERS = {
  photorealistic: 'photorealistic, ultra-detailed, 8K UHD, DSLR quality',
  cinematic: 'cinematic composition, film grain, anamorphic lens flare, color graded',
  'oil-painting': 'oil painting style, visible brushstrokes, canvas texture, gallery quality',
  watercolor: 'delicate watercolor painting, soft washes, paper texture, flowing colors',
  'digital-art': 'digital art, vibrant colors, clean lines, professional illustration',
  '3d-render': '3D render, octane render, ray-traced lighting, subsurface scattering',
  anime: 'anime style, cel-shaded, vibrant, detailed linework, Studio Ghibli quality',
  'concept-art': 'concept art, matte painting, detailed environment design, artstation trending',
  minimalist: 'minimalist composition, clean negative space, elegant simplicity',
  surreal: 'surrealist art, dreamlike, impossible geometry, Salvador Dalí inspired',
  'pop-art': 'pop art style, bold colors, Ben-Day dots, Andy Warhol inspired',
  gothic: 'dark gothic aesthetic, ornate details, dramatic shadows, Victorian era',
  'pixel-art': 'pixel art style, retro 16-bit, nostalgic color palette',
  impressionist: 'impressionist style, dappled light, soft brushwork, Monet inspired',
  'comic-book': 'comic book art, bold outlines, dynamic shading, halftone dots',
};

const LIGHTING_MODIFIERS = {
  'golden-hour': 'golden hour sunlight, warm amber tones, long soft shadows',
  dramatic: 'dramatic lighting, deep shadows, high contrast, chiaroscuro',
  neon: 'neon lighting, vibrant glowing colors, cyberpunk atmosphere',
  soft: 'soft diffused lighting, gentle shadows, overcast quality',
  studio: 'professional studio lighting, three-point setup, clean highlights',
  backlit: 'backlit silhouette, rim lighting, lens flare, atmospheric glow',
  moonlight: 'moonlit scene, cool blue tones, soft lunar glow, nocturnal',
  'volumetric': 'volumetric lighting, god rays, atmospheric haze, light beams',
  natural: 'natural ambient lighting, true-to-life colors, soft daylight',
  'noir': 'film noir lighting, high contrast black and white, venetian blind shadows',
};

const MOOD_MODIFIERS = {
  epic: 'epic and grandiose, awe-inspiring scale, heroic atmosphere',
  serene: 'peaceful and serene, calm atmosphere, tranquil mood',
  mysterious: 'mysterious and enigmatic, foggy, hidden depths, intrigue',
  joyful: 'joyful and vibrant, energetic, warm and inviting, celebration',
  melancholic: 'melancholic atmosphere, nostalgic, bittersweet, contemplative',
  dark: 'dark and moody, ominous, foreboding, intense shadows',
  whimsical: 'whimsical and playful, fantastical, lighthearted, imaginative',
  futuristic: 'futuristic and sleek, advanced technology, sci-fi atmosphere',
  romantic: 'romantic atmosphere, soft bokeh, warm intimate lighting, tender',
  chaotic: 'chaotic energy, dynamic motion, explosive action, intense drama',
};

// ─── Tool-Specific Formatters ────────────────────────────────────────────────

function formatMidjourney(basePrompt, aspectRatio) {
  let prompt = basePrompt;
  
  // Add MidJourney-specific parameters
  const params = [];
  
  if (aspectRatio && aspectRatio !== 'default') {
    params.push(`--ar ${aspectRatio}`);
  }
  
  params.push('--v 6');
  params.push('--quality 2');
  
  if (params.length > 0) {
    prompt += ' ' + params.join(' ');
  }
  
  return prompt;
}

function formatDalle(basePrompt, aspectRatio) {
  // DALL-E prefers natural language descriptions without special parameters
  let prompt = basePrompt;
  
  if (aspectRatio && aspectRatio !== 'default') {
    const ratioDescriptions = {
      '1:1': 'square composition',
      '16:9': 'wide cinematic composition',
      '9:16': 'tall vertical composition',
      '4:3': 'standard landscape composition',
      '3:4': 'standard portrait composition',
      '21:9': 'ultra-wide panoramic composition',
      '2:3': 'vertical portrait composition',
      '3:2': 'horizontal landscape composition',
    };
    const desc = ratioDescriptions[aspectRatio];
    if (desc) {
      prompt += `, ${desc}`;
    }
  }
  
  // DALL-E performs better with explicit quality descriptors
  prompt += '. Highly detailed, professional quality.';
  
  return prompt;
}

function formatFlux(basePrompt, aspectRatio) {
  let prompt = basePrompt;
  
  // Flux supports natural language with some technical hints
  if (aspectRatio && aspectRatio !== 'default') {
    prompt += ` [aspect_ratio: ${aspectRatio}]`;
  }
  
  prompt += ' [quality: ultra] [detail: maximum]';
  
  return prompt;
}

// ─── Main Generator ──────────────────────────────────────────────────────────

function generatePrompt({ subject, style, lighting, mood, aspect_ratio, tool }) {
  if (!subject || !tool) {
    throw new Error('Subject and tool are required fields');
  }

  const validTools = ['midjourney', 'dalle', 'flux'];
  if (!validTools.includes(tool.toLowerCase())) {
    throw new Error(`Invalid tool. Must be one of: ${validTools.join(', ')}`);
  }

  // Build the base prompt from components
  const parts = [subject.trim()];

  // Add style modifiers
  if (style) {
    const styleKey = style.toLowerCase().replace(/\s+/g, '-');
    const styleMod = STYLE_MODIFIERS[styleKey];
    if (styleMod) {
      parts.push(styleMod);
    } else {
      parts.push(style); // Use raw style if not in our templates
    }
  }

  // Add lighting modifiers
  if (lighting) {
    const lightKey = lighting.toLowerCase().replace(/\s+/g, '-');
    const lightMod = LIGHTING_MODIFIERS[lightKey];
    if (lightMod) {
      parts.push(lightMod);
    } else {
      parts.push(`${lighting} lighting`);
    }
  }

  // Add mood modifiers
  if (mood) {
    const moodKey = mood.toLowerCase().replace(/\s+/g, '-');
    const moodMod = MOOD_MODIFIERS[moodKey];
    if (moodMod) {
      parts.push(moodMod);
    } else {
      parts.push(`${mood} mood`);
    }
  }

  const basePrompt = parts.join(', ');
  const normalizedTool = tool.toLowerCase();

  // Format for specific tool
  let formattedPrompt;
  switch (normalizedTool) {
    case 'midjourney':
      formattedPrompt = formatMidjourney(basePrompt, aspect_ratio);
      break;
    case 'dalle':
      formattedPrompt = formatDalle(basePrompt, aspect_ratio);
      break;
    case 'flux':
      formattedPrompt = formatFlux(basePrompt, aspect_ratio);
      break;
    default:
      formattedPrompt = basePrompt;
  }

  return {
    prompt: formattedPrompt,
    tool: normalizedTool,
    components: {
      subject: subject.trim(),
      style: style || null,
      lighting: lighting || null,
      mood: mood || null,
      aspect_ratio: aspect_ratio || 'default',
    },
    metadata: {
      char_count: formattedPrompt.length,
      generated_at: new Date().toISOString(),
    },
  };
}

// ─── Available Options (for frontend dropdown population) ────────────────────

function getAvailableOptions() {
  return {
    styles: Object.keys(STYLE_MODIFIERS),
    lighting: Object.keys(LIGHTING_MODIFIERS),
    moods: Object.keys(MOOD_MODIFIERS),
    tools: ['midjourney', 'dalle', 'flux'],
    aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '2:3', '3:2'],
  };
}

module.exports = { generatePrompt, getAvailableOptions };
