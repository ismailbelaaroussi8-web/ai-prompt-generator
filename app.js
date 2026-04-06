// ═══════════════════════════════════════════════════════════════════════════
// AI Prompt Generator — Application Logic
// Handles form submission, API requests, local storage, and UI interactions
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = `${window.location.origin}/api`;
  
  // Elements
  const generateBtn = document.getElementById('generate-btn');
  const errorMsg = document.getElementById('error-msg');
  const outputBox = document.getElementById('output-box');
  const outputPrompt = document.getElementById('output-prompt');
  const charCount = document.getElementById('char-count');
  const copyBtn = document.getElementById('copy-btn');
  const regenerateBtn = document.getElementById('regenerate-btn');
  const toolTabs = document.querySelectorAll('.tool-tab');
  
  // Library Elements
  const promptGrid = document.getElementById('prompt-grid');
  const filterPills = document.querySelectorAll('.filter-pill');
  const loadMoreBtn = document.getElementById('load-more-btn');
  
  // State
  let currentTool = 'midjourney';
  let libraryPage = 1;
  let currentCategory = 'all';
  let hasMorePrompts = true;

  // Hardcoded fallback data in case backend is down
  const fallbackPrompts = [
    {
      title: 'Neon Cyberpunk Samurai',
      prompt_text: 'Cyberpunk street samurai with neon-lit cybernetic implants, rain-soaked hair, Tokyo alley background, cinematic color grading --ar 16:9 --v 6',
      category: 'portrait',
      tool_target: 'midjourney',
      likes: 98
    },
    {
      title: 'Floating Fantasy Islands',
      prompt_text: 'Massive floating islands suspended in a cotton-candy sky at golden hour, waterfalls cascading into the void below, Studio Ghibli style. Highly detailed, professional quality.',
      category: 'landscape',
      tool_target: 'dalle',
      likes: 245
    },
    {
      title: 'Deconstructed Sneaker',
      prompt_text: 'Deconstructed sneaker mid-explosion showing all internal components floating in perfect position, dynamic studio lighting [quality: ultra] [detail: maximum]',
      category: 'product',
      tool_target: 'flux',
      likes: 134
    }
  ];

  /* ── Tool Tabs ─────────────────────────────────────────────────────────── */
  toolTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      toolTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTool = tab.dataset.tool;
    });
  });

  /* ── Generator Form Submit ─────────────────────────────────────────────── */
  generateBtn.addEventListener('click', generatePrompt);
  regenerateBtn.addEventListener('click', generatePrompt);

  function scrollToSubject() {
    const subjectEl = document.getElementById('subject');
    if (!subjectEl) return;
    subjectEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => subjectEl.focus({ preventScroll: true }), 450);
  }

  async function generatePrompt() {
    const subjectEl = document.getElementById('subject');
    const subject = subjectEl.value.trim();
    const style = document.getElementById('style').value;
    const lighting = document.getElementById('lighting').value;
    const mood = document.getElementById('mood').value;
    const aspectRatio = document.getElementById('aspect-ratio').value;

    if (!subject) {
      showError('Please describe your subject first.');
      scrollToSubject();
      return;
    }

    // UI loading state
    hideError();
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    regenerateBtn.classList.add('loading');
    regenerateBtn.disabled = true;

    document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const response = await fetch(`${API_BASE}/generate-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          style,
          lighting,
          mood,
          aspect_ratio: aspectRatio,
          tool: currentTool
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate prompt');
      }

      displayOutput(data.data.prompt);
      
    } catch (err) {
      console.error('Generator Error:', err);
      // Fallback if backend is unreachable
      if (err.message === 'Failed to fetch') {
        const fakePrompt = generateClientSidePrompt(subject, style, lighting, currentTool);
        displayOutput(fakePrompt);
        showError('Backend offline. Built a local prompt approximation.');
      } else {
        showError(err.message);
      }
    } finally {
      generateBtn.classList.remove('loading');
      generateBtn.disabled = false;
      regenerateBtn.classList.remove('loading');
      regenerateBtn.disabled = false;
    }
  }

  function displayOutput(promptText, opts = {}) {
    const scrollToResult = opts.scroll !== false;
    outputBox.classList.add('visible');
    outputPrompt.textContent = promptText;
    charCount.textContent = `${promptText.length} characters`;

    localStorage.setItem('lastGeneratedPrompt', promptText);

    copyBtn.textContent = '📋 Copy';
    copyBtn.classList.remove('copied');

    if (scrollToResult) {
      requestAnimationFrame(() => {
        outputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function generateClientSidePrompt(subject, style, lighting, tool) {
    let p = subject;
    if (style) p += `, ${style} style`;
    if (lighting) p += `, ${lighting} lighting`;
    
    if (tool === 'midjourney') return p + ' --v 6 --quality 2';
    if (tool === 'dalle') return p + '. Highly detailed, professional quality.';
    if (tool === 'flux') return p + ' [quality: ultra]';
    return p;
  }

  /* Display names for API slugs (matches src/engine/promptGenerator.js keys) */
  const STYLE_LABELS = {
    photorealistic: 'Photorealistic',
    cinematic: 'Cinematic',
    'oil-painting': 'Oil painting',
    watercolor: 'Watercolor',
    'digital-art': 'Digital art · neon / illustration',
    '3d-render': '3D render',
    anime: 'Anime',
    'concept-art': 'Fantasy · concept art',
    minimalist: 'Minimalist',
    surreal: 'Surreal',
    'pop-art': 'Pop art',
    gothic: 'Gothic',
    'pixel-art': 'Pixel art',
    impressionist: 'Impressionist',
    'comic-book': 'Comic book'
  };

  const LIGHTING_LABELS = {
    'golden-hour': 'Golden hour',
    dramatic: 'Dramatic',
    neon: 'Neon',
    soft: 'Soft · natural',
    studio: 'Studio',
    backlit: 'Backlit',
    moonlight: 'Moonlight',
    volumetric: 'Volumetric · god rays',
    natural: 'Natural daylight',
    noir: 'Film noir'
  };

  const MOOD_LABELS = {
    epic: 'Epic',
    serene: 'Peaceful · serene',
    mysterious: 'Mysterious',
    joyful: 'Joyful',
    melancholic: 'Melancholic',
    dark: 'Dark · moody',
    whimsical: 'Whimsical',
    futuristic: 'Futuristic',
    romantic: 'Romantic',
    chaotic: 'Energetic · chaotic'
  };

  const ASPECT_LABELS = {
    '1:1': '1:1 — Square',
    '16:9': '16:9 — Widescreen',
    '9:16': '9:16 — Vertical / stories',
    '4:3': '4:3 — Standard',
    '3:4': '3:4 — Portrait',
    '21:9': '21:9 — Ultra-wide',
    '2:3': '2:3 — Portrait print',
    '3:2': '3:2 — Landscape'
  };

  function labelForSelect(selectId, value) {
    if (selectId === 'aspect-ratio') return ASPECT_LABELS[value] || value;
    const map = { style: STYLE_LABELS, lighting: LIGHTING_LABELS, mood: MOOD_LABELS }[selectId];
    if (map && map[value]) return map[value];
    return value
      .split('-')
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
      .join(' ')
      .trim();
  }

  const FALLBACK_FROM_LABELS = {
    style: Object.keys(STYLE_LABELS),
    lighting: Object.keys(LIGHTING_LABELS),
    mood: Object.keys(MOOD_LABELS),
    'aspect-ratio': Object.keys(ASPECT_LABELS)
  };

  /* ── Dynamic Form Options ──────────────────────────────────────────────── */
  async function loadFormOptions() {
    try {
      const res = await fetch(`${API_BASE}/generate-prompt/options`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed to load options');

      const d = data.data || {};
      populateSelect('style', Array.isArray(d.styles) && d.styles.length ? d.styles : FALLBACK_FROM_LABELS.style, '— Choose style —');
      populateSelect('lighting', Array.isArray(d.lighting) && d.lighting.length ? d.lighting : FALLBACK_FROM_LABELS.lighting, '— Choose lighting —');
      populateSelect('mood', Array.isArray(d.moods) && d.moods.length ? d.moods : FALLBACK_FROM_LABELS.mood, '— Choose mood —');
      populateSelect('aspect-ratio', Array.isArray(d.aspect_ratios) && d.aspect_ratios.length ? d.aspect_ratios : FALLBACK_FROM_LABELS['aspect-ratio'], '');
    } catch (err) {
      console.warn('Could not load form options:', err);
      populateSelect('style', FALLBACK_FROM_LABELS.style, '— Choose style —');
      populateSelect('lighting', FALLBACK_FROM_LABELS.lighting, '— Choose lighting —');
      populateSelect('mood', FALLBACK_FROM_LABELS.mood, '— Choose mood —');
      populateSelect('aspect-ratio', FALLBACK_FROM_LABELS['aspect-ratio'], '');
    }
  }

  function populateSelect(id, options, placeholder) {
    const select = document.getElementById(id);
    if (!select) return;

    select.textContent = '';
    if (placeholder) {
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = placeholder;
      select.appendChild(ph);
    }
    (options || []).forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = labelForSelect(id, value);
      select.appendChild(opt);
    });
  }

  /* ── Copy Action ───────────────────────────────────────────────────────── */
  copyBtn.addEventListener('click', () => {
    const text = outputPrompt.textContent;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = '✨ Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      showError('Failed to copy to clipboard.');
    });
  });

  /* ── Library Pagination & Filtering ────────────────────────────────────── */
  
  // Load initial prompts
  loadLibraryPrompts();

  // Handle load more
  loadMoreBtn.addEventListener('click', () => {
    if (hasMorePrompts) {
      libraryPage++;
      loadLibraryPrompts(true);
    }
  });

  // Handle category filters
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      currentCategory = pill.dataset.category;
      libraryPage = 1;
      
      // Update URL hash without jumping
      history.replaceState(null, null, `#${currentCategory}`);
      
      promptGrid.innerHTML = ''; // clear grid
      loadLibraryPrompts();
    });
  });

  // Check URL hash for filter state
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetPill = document.querySelector(`.filter-pill[data-category="${hash}"]`);
    if (targetPill) {
      targetPill.click(); // trigger the load
    }
  }

  async function loadLibraryPrompts(append = false) {
    if (!append) showSkeletons();
    
    loadMoreBtn.disabled = true;
    loadMoreBtn.textContent = 'Loading...';

    try {
      const endpoint = currentCategory === 'all' 
        ? `${API_BASE}/prompts?page=${libraryPage}&limit=9`
        : `${API_BASE}/prompts/category/${currentCategory}?page=${libraryPage}&limit=9`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load prompts');
      }

      if (!append) promptGrid.innerHTML = '';
      
      if (data.data.length === 0) {
        promptGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No prompts found.</p>';
      } else {
        data.data.forEach(prompt => appendPromptCard(prompt));
      }

      hasMorePrompts = data.pagination ? data.pagination.has_next : false;
      
    } catch (err) {
      console.warn('Library Fetch Error:', err);
      if (!append) {
        promptGrid.innerHTML = '';
        // Load fallback if backend down
        fallbackPrompts.forEach(prompt => {
          if (currentCategory === 'all' || prompt.category === currentCategory) {
            appendPromptCard(prompt);
          }
        });
      }
      hasMorePrompts = false;
    } finally {
      loadMoreBtn.disabled = !hasMorePrompts;
      loadMoreBtn.textContent = hasMorePrompts ? 'Load More' : 'No More Prompts';
      if (!hasMorePrompts && libraryPage === 1 && currentCategory !== 'all' && promptGrid.innerHTML.includes('No prompts found')) {
         loadMoreBtn.style.display = 'none';
      } else {
         loadMoreBtn.style.display = 'block';
      }
    }
  }

  function appendPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card fade-in';

    const toolKey = ['midjourney', 'dalle', 'flux'].includes(prompt.tool_target)
      ? prompt.tool_target
      : 'midjourney';
    const toolDisplay = {
      midjourney: 'MidJourney',
      dalle: 'DALL-E 3',
      flux: 'Flux'
    }[toolKey] || prompt.tool_target;

    const header = document.createElement('div');
    header.className = 'card-header';
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = prompt.category || '';
    const tag = document.createElement('span');
    tag.className = `tool-tag ${toolKey}`;
    tag.textContent = toolDisplay;
    header.append(badge, tag);

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = prompt.title || '';

    const body = document.createElement('div');
    body.className = 'card-prompt';
    body.textContent = prompt.prompt_text || '';

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const likes = document.createElement('span');
    likes.className = 'card-likes';
    likes.textContent = `❤️ ${prompt.likes || 0}`;
    const cbtn = document.createElement('button');
    cbtn.type = 'button';
    cbtn.className = 'card-copy';
    cbtn.textContent = 'Copy';
    const fullText = String(prompt.prompt_text || '');
    cbtn.addEventListener('click', () => {
      navigator.clipboard.writeText(fullText).then(() => {
        cbtn.textContent = 'Copied!';
        cbtn.classList.add('copied');
        setTimeout(() => {
          cbtn.textContent = 'Copy';
          cbtn.classList.remove('copied');
        }, 2000);
      });
    });
    footer.append(likes, cbtn);

    card.append(header, title, body, footer);
    promptGrid.appendChild(card);
  }

  function showSkeletons() {
    promptGrid.innerHTML = Array(6).fill(`
      <div class="skeleton-card">
        <div class="skeleton-bar title"></div>
        <div class="skeleton-bar long"></div>
        <div class="skeleton-bar long"></div>
        <div class="skeleton-bar short"></div>
      </div>
    `).join('');
  }

  /* ── Error Handling ────────────────────────────────────────────────────── */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
    setTimeout(hideError, 5000);
  }
  function hideError() {
    errorMsg.classList.remove('visible');
  }

  /* ── Hero CTA & nav ──────────────────────────────────────────────────── */
  const ctaBtn = document.getElementById('cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      scrollToSubject();
    });
  }

  const navbar = document.getElementById('navbar');
  const onNavScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle('nav-scrolled', window.scrollY > 48);
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  /* ── Initialization ────────────────────────────────────────────────────── */
  loadFormOptions();

  const lastState = localStorage.getItem('lastGeneratedPrompt');
  if (lastState) {
    displayOutput(lastState, { scroll: false });
  }
});
