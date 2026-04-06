// ═══════════════════════════════════════════════════════════════════════════
// AI Prompt Generator — Application Logic
// Handles form submission, API requests, local storage, and UI interactions
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'http://localhost:5000/api';
  
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

  async function generatePrompt() {
    const subject = document.getElementById('subject').value.trim();
    const style = document.getElementById('style').value;
    const lighting = document.getElementById('lighting').value;
    const mood = document.getElementById('mood').value;
    const aspectRatio = document.getElementById('aspect-ratio').value;

    if (!subject) {
      showError('Please describe your subject first.');
      document.getElementById('subject').focus();
      return;
    }

    // UI loading state
    hideError();
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    regenerateBtn.classList.add('loading');
    regenerateBtn.disabled = true;
    
    // Smooth scroll to gen area
    document.getElementById('generator').scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Slight delay to keep the "generating" UX feel
    setTimeout(() => {
      try {
        const finalPrompt = generateLocalPrompt(subject, style, lighting, mood, aspectRatio, currentTool);
        displayOutput(finalPrompt);
      } catch (err) {
        console.error('Generator Error:', err);
        showError('Failed to generate prompt.');
      } finally {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
        regenerateBtn.classList.remove('loading');
        regenerateBtn.disabled = false;
      }
    }, 400);
  }

  function displayOutput(promptText) {
    outputBox.classList.add('visible');
    outputPrompt.textContent = promptText;
    charCount.textContent = `${promptText.length} characters`;
    
    // Save to local storage
    localStorage.setItem('lastGeneratedPrompt', promptText);

    // Reset copy button
    copyBtn.textContent = '📋 Copy';
    copyBtn.classList.remove('copied');
  }

  function generateLocalPrompt(subject, style, lighting, mood, aspectRatio, tool) {
    let promptText = "";
    
    if (tool === 'midjourney') {
      promptText = subject;
      if (style) promptText += `, ${style}`;
      if (lighting) promptText += `, ${lighting}`;
      if (mood) promptText += `, ${mood}`;
      promptText += ` --ar ${aspectRatio} --v 6.1 --style raw`;
    } 
    else if (tool === 'dalle') {
      promptText = `A ${subject}.`;
      if (style) promptText += ` Style: ${style}.`;
      if (lighting) promptText += ` Lighting: ${lighting}.`;
      if (mood) promptText += ` Mood: ${mood}.`;
      if (aspectRatio) promptText += ` Aspect ratio: ${aspectRatio}.`;
      promptText += ` Photorealistic, highly detailed.`;
    }
    else if (tool === 'flux') {
      promptText = subject;
      if (style) promptText += ` | ${style} aesthetic`;
      if (lighting) promptText += ` | ${lighting} lighting`;
      if (mood) promptText += ` | ${mood} atmosphere`;
      promptText += ` | ultra detailed`;
    }
    
    return promptText;
  }

  /* ── Utilities ─────────────────────────────────────────────────────────── */
  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Dynamic Form Options ──────────────────────────────────────────────── */
  async function loadFormOptions() {
    try {
      const res = await fetch(`${API_BASE}/generate-prompt/options`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error('Failed to load options');
      
      const { styles, lighting, moods, aspect_ratios } = data.data;
      
      populateSelect('style', styles, '— Choose style —');
      populateSelect('lighting', lighting, '— Choose lighting —');
      populateSelect('mood', moods, '— Choose mood —');
      populateSelect('aspect-ratio', aspect_ratios, '');
    } catch (err) {
      console.warn('Could not load form options:', err);
    }
  }

  function populateSelect(id, options, defaultOption) {
    const select = document.getElementById(id);
    if (!select) return;
    
    let html = '';
    if (defaultOption) {
      html += `<option value="">${escapeHTML(defaultOption)}</option>`;
    }
    
    options.forEach(opt => {
      let label = opt.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      if (id === 'aspect-ratio') {
        const ratioLabels = {
          '1:1': '1:1 — Square',
          '16:9': '16:9 — Widescreen',
          '9:16': '9:16 — Vertical',
          '4:3': '4:3 — Standard',
          '3:2': '3:2 — Landscape'
        };
        label = ratioLabels[opt] || opt;
      }
      html += `<option value="${escapeHTML(opt)}">${escapeHTML(label)}</option>`;
    });
    
    select.innerHTML = html;
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
    
    // Format tool name nicely
    const toolDisplay = {
      'midjourney': 'MidJourney',
      'dalle': 'DALL-E 3',
      'flux': 'Flux'
    }[prompt.tool_target] || prompt.tool_target;

    card.innerHTML = `
      <div class="card-header">
        <span class="category-badge">${escapeHTML(prompt.category)}</span>
        <span class="tool-tag ${escapeHTML(prompt.tool_target)}">${escapeHTML(toolDisplay)}</span>
      </div>
      <h3 class="card-title">${escapeHTML(prompt.title)}</h3>
      <div class="card-prompt">${escapeHTML(prompt.prompt_text)}</div>
      <div class="card-footer">
        <span class="card-likes">❤️ ${escapeHTML(prompt.likes || 0)}</span>
        <button class="card-copy" data-prompt="${escapeHTML(prompt.prompt_text)}">Copy</button>
      </div>
    `;
    
    // Setup copy button on the card
    const cbtn = card.querySelector('.card-copy');
    cbtn.addEventListener('click', (e) => {
      const text = e.target.dataset.prompt;
      navigator.clipboard.writeText(text).then(() => {
        cbtn.textContent = 'Copied!';
        cbtn.classList.add('copied');
        setTimeout(() => {
          cbtn.textContent = 'Copy';
          cbtn.classList.remove('copied');
        }, 2000);
      });
    });

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

  /* ── Initialization ────────────────────────────────────────────────────── */
  loadFormOptions();
  
  // Load last prompt if exists
  const lastState = localStorage.getItem('lastGeneratedPrompt');
  if (lastState) {
    displayOutput(lastState);
  }
});
