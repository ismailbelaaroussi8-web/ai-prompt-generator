// ═══════════════════════════════════════════════════════════════════════════
// ANTIGRAVITY — Core Compiler Logic
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  /* ── DOM Queries ───────────────────────────────────────────────────────── */
  const navLinks = document.querySelectorAll('[data-route]');
  const views = document.querySelectorAll('.spa-view');
  
  const uploadZone = document.getElementById('upload-zone');
  const uploadText = document.getElementById('upload-text');
  const imageInput = document.getElementById('image-input');
  const removeImgBtn = document.getElementById('remove-img-btn');
  
  const toolTabs = document.querySelectorAll('.tool-tab');
  const subjectInput = document.getElementById('subject');
  const generateBtn = document.getElementById('generate-btn');
  
  const errorMsg = document.getElementById('error-msg');
  const outputBox = document.getElementById('output-box');
  const outputPrompt = document.getElementById('output-prompt');
  const charCount = document.getElementById('char-count');
  const copyBtn = document.getElementById('copy-btn');
  const regenerateBtn = document.getElementById('regenerate-btn');
  
  const dashToggle = document.getElementById('dash-toggle');
  const dashMenu = document.getElementById('dash-menu');
  
  /* ── Runtime State ─────────────────────────────────────────────────────── */
  let currentTool = 'midjourney';
  let uploadedImageName = null;

  /* ── SPA View Router ───────────────────────────────────────────────────── */
  function navigateTo(route) {
    views.forEach(v => v.classList.remove('active'));
    
    const target = document.getElementById(`view-${route}`);
    if (target) target.classList.add('active');
    else document.getElementById('view-home').classList.add('active');
    
    navLinks.forEach(link => {
      if (link.dataset.route === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      history.pushState(null, null, `#${link.dataset.route}`);
      navigateTo(link.dataset.route);
    });
  });

  // Bootstrap initial hash load
  const initialHash = window.location.hash.replace('#', '');
  if (['home', 'about', 'faq', 'contact'].includes(initialHash)) {
    navigateTo(initialHash);
  }

  /* ── Drag & Drop Image Handler ─────────────────────────────────────────── */
  uploadZone.addEventListener('click', (e) => {
    if (e.target !== removeImgBtn) {
      imageInput.click();
    }
  });

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-active');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-active');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showError('Invalid syntax: Upload requires image/png, jpeg, webp.');
      return;
    }
    uploadedImageName = file.name;
    uploadText.textContent = uploadedImageName;
    removeImgBtn.style.display = 'flex';
    uploadZone.style.boxShadow = 'inset 0 0 0 1px var(--teal)';
  }

  removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    uploadedImageName = null;
    uploadText.textContent = 'Upload Image';
    removeImgBtn.style.display = 'none';
    uploadZone.style.boxShadow = 'none';
    imageInput.value = '';
  });

  /* ── Target Tool Vector ────────────────────────────────────────────────── */
  toolTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      toolTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTool = tab.dataset.tool;
      
      // Feature Autonomy: If an output is already generated, instantly recompile for the new engine!
      if (outputBox.classList.contains('visible')) {
        executeGeneration();
      }
    });
  });

  /* ── Dashboard Menu ────────────────────────────────────────────────────── */
  if (dashToggle && dashMenu) {
    dashToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      dashMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dashMenu.contains(e.target) && e.target !== dashToggle) {
        dashMenu.classList.remove('open');
      }
    });
  }

  /* ── Compiler Generation ───────────────────────────────────────────────── */
  generateBtn.addEventListener('click', executeGeneration);
  regenerateBtn.addEventListener('click', executeGeneration);

  subjectInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeGeneration();
  });

  function executeGeneration() {
    const textConcept = subjectInput.value.trim();

    if (!textConcept && !uploadedImageName) {
      showError('Provide a concept string or attach visual telemetry.');
      return;
    }

    // Lock interactions
    hideError();
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;

    // Compile latency simulation
    setTimeout(() => {
      const prompt = assemblePrompt(textConcept, uploadedImageName, currentTool);
      displayOutput(prompt);
      
      generateBtn.classList.remove('loading');
      generateBtn.disabled = false;
      regenerateBtn.disabled = false;
    }, 650);
  }

  function assemblePrompt(text, imageName, tool) {
    let base = '';
    
    // Synthesize image logic stub
    if (imageName) {
      base += `[Based on ${imageName}] `;
    }
    if (text) {
      base += text;
    }

    // Engine specific formatting
    if (tool === 'midjourney') {
      return `${base} --v 6.1 --style raw --ar 16:9 --quality 2`;
    } 
    if (tool === 'dalle') {
      return `A highly detailed representation: ${base}. Exceptional photography, 8k resolution, cinematic lighting composition.`;
    }
    if (tool === 'flux') {
      return `${base} | ultra detailed aesthetic | dynamic composition | hyper-realism | studio lighting`;
    }
    return base;
  }

  /* ── Telemetry Output ──────────────────────────────────────────────────── */
  function displayOutput(text) {
    outputBox.classList.add('visible');
    outputPrompt.textContent = text;
    charCount.textContent = `${text.length} chars`;
    copyBtn.textContent = '📋 Copy Syntax';
    copyBtn.classList.remove('copied');
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');
    setTimeout(() => errorMsg.classList.remove('visible'), 4000);
  }
  
  function hideError() {
    errorMsg.classList.remove('visible');
  }

  /* ── Clipboard Actions ─────────────────────────────────────────────────── */
  copyBtn.addEventListener('click', () => {
    const text = outputPrompt.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Matrix Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Syntax';
        copyBtn.classList.remove('copied');
      }, 2500);
    });
  });

});
