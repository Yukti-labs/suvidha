import { pageGroups, icons, getToolIcon } from './config.js';

export function flattenTools() {
  return pageGroups.flatMap(group => group.pages.map(page => ({
    name: page.label,
    url: page.path,
    category: group.label,
    iconName: page.iconName,
    shortDesc: page.shortDesc || '',
    keywords: page.keywords || []
  })));
}

const TYPO_MAP = {
  'compresss': 'compress',
  'imgae': 'image',
  'formater': 'formatter',
  'resum': 'resume',
  'calculater': 'calculator',
  'dokuments': 'documents',
  'dokment': 'document',
  'docment': 'document'
};

export function normalizeQuery(text) {
  let cleaned = (text || '').toLowerCase().trim();
  for (const [typo, fixed] of Object.entries(TYPO_MAP)) {
    cleaned = cleaned.replace(new RegExp(`\\b${typo}\\b`, 'g'), fixed);
  }
  return cleaned;
}

export function detectTargetSize(text) {
  const t = (text || '').toLowerCase();
  
  // MB matching (e.g. 1 MB, 1mb, 2mb, 500kb as 0.5mb)
  const mbMatch = t.match(/(\d+(?:\.\d+)?)\s*(?:mb|megabytes?)/i);
  if (mbMatch) {
    const val = parseFloat(mbMatch[1]);
    if (val === 1) return { param: 'target=1mb', label: '≤ 1 MB', bytes: 1048576 };
    if (val === 2) return { param: 'target=2mb', label: '≤ 2 MB', bytes: 2097152 };
    if (val === 0.5) return { param: 'target=500kb', label: '≤ 500 KB', bytes: 512000 };
    return { param: `target=${Math.round(val * 1024)}`, label: `≤ ${val} MB`, bytes: Math.round(val * 1048576) };
  }

  // KB matching (e.g. 500 KB, 100kb, 50 kb, 20kb)
  const kbMatch = t.match(/(\d+)\s*(?:kb|kilobytes?)/i);
  if (kbMatch) {
    const val = parseInt(kbMatch[1], 10);
    if (val === 500) return { param: 'target=500kb', label: '≤ 500 KB', bytes: 512000 };
    if (val === 200) return { param: 'target=200kb', label: '≤ 200 KB', bytes: 204800 };
    if (val === 100) return { param: 'target=100kb', label: '≤ 100 KB', bytes: 102400 };
    if (val === 50) return { param: 'target=50kb', label: '≤ 50 KB', bytes: 51200 };
    if (val === 20) return { param: 'target=20kb', label: '≤ 20 KB', bytes: 20480 };
    return { param: `target=${val}kb`, label: `≤ ${val} KB`, bytes: val * 1024 };
  }

  return null;
}

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'you', 'your', 'yours',
  'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
  'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
  'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now',
  'need', 'want', 'please', 'help', 'make', 'get', 'give'
]);

export function analyzeIntent(text) {
  const q = normalizeQuery(text);
  const targetParam = detectTargetSize(q);

  // Object flags
  const hasExplicitPdf = /\b(pdf|pdfs)\b/i.test(q);
  const hasDoc = /\b(doc|docs|document|documents|file|files)\b/i.test(q);
  const hasImage = /\b(image|images|img|imgs|photo|photos|pic|pics|picture|pictures|jpg|jpeg|png|webp)\b/i.test(q);
  const hasJson = /\b(json|jsons)\b/i.test(q);
  const hasQr = /\b(qr|qr-code|qrcode|barcode)\b/i.test(q);
  const hasResume = /\b(resume|resumes|cv|cvs|biodata|curriculum vitae)\b/i.test(q);
  const hasEmi = /\b(emi|loan|loans|mortgage|interest|repayment|amortization)\b/i.test(q);
  const hasGst = /\b(gst|cgst|sgst|tax|taxes)\b/i.test(q);
  const hasSip = /\b(sip|mutual fund|compounding|investment)\b/i.test(q);
  const hasPassword = /\b(password|passwords|passphrase)\b/i.test(q);
  const hasWords = /\b(word count|word counter|character count|reading time|words|count words)\b/i.test(q);

  // Intent / Action flags
  const isCompression = Boolean(targetParam) || 
    /\b(compress|compressor|compression|shrink|reduce|smaller|small|below|under|less than|kb|mb|size|downsize|optimize size)\b/i.test(q);
  const isConvertCombine = /\b(convert|conversion|combine|join|into|to pdf|into pdf|from photos|from images)\b/i.test(q);
  const isUnlock = /\b(unlock|unlocker|decrypt|remove password|unprotect|forgot password)\b/i.test(q);
  const isMerge = /\b(merge|combine pdf|combine pdfs|join pdf|join pdfs|multi pdf)\b/i.test(q);
  const isFormat = /\b(format|formatter|pretty|prettify|beautify|clean|indent|lint|validate)\b/i.test(q);
  const isCreate = /\b(create|generate|generator|make|build|builder)\b/i.test(q);

  return {
    q,
    targetParam,
    hasExplicitPdf,
    hasPdf: hasExplicitPdf,
    hasDoc,
    hasImage,
    hasJson,
    hasQr,
    hasResume,
    hasEmi,
    hasGst,
    hasSip,
    hasPassword,
    hasWords,
    isCompression,
    isConvertCombine,
    isUnlock,
    isMerge,
    isFormat,
    isCreate
  };
}

export function scoreTools(query) {
  const analysis = analyzeIntent(query);
  const { q, targetParam, hasExplicitPdf, hasDoc, hasImage, hasJson, hasQr, hasResume,
    hasEmi, hasGst, hasSip, hasPassword, hasWords, isCompression, isConvertCombine,
    isUnlock, isMerge, isFormat, isCreate } = analysis;

  if (!q) return [];
  const tools = flattenTools();

  const rawWords = q.split(/\s+/).filter(Boolean);
  const meaningfulWords = rawWords.filter(w => w.length > 1 && !STOP_WORDS.has(w));

  const scored = [];

  for (const tool of tools) {
    let score = 0;
    const nameLower = tool.name.toLowerCase();
    const catLower = tool.category.toLowerCase();
    const descLower = tool.shortDesc.toLowerCase();

    // Semantic Intent Matrix (Precedence: Action + Object + Parameter)
    if (tool.name === 'PDF Compressor') {
      if ((hasExplicitPdf || hasDoc) && isCompression && !hasImage) score += 320;
      if (hasExplicitPdf && targetParam && !hasImage) score += 100;
      // Penalize if query explicitly targets images without PDF
      if (hasImage && !hasExplicitPdf) score -= 250;
    } else if (tool.name === 'Image Compressor') {
      if (hasImage && isCompression && !hasExplicitPdf) score += 320;
      if (hasImage && targetParam && !hasExplicitPdf) score += 100;
      // Penalize if query explicitly targets PDF without images
      if (hasExplicitPdf && !hasImage) score -= 250;
    } else if (tool.name === 'Image to PDF') {
      // Explicit conversion/combination intent between images and pdf
      if (hasImage && (hasExplicitPdf || isConvertCombine)) score += 350;
      // If query is pure PDF compression with NO image intent, heavily penalize
      if ((hasExplicitPdf || isCompression) && !hasImage) score -= 400;
      // If query is pure image compression with NO pdf/combine intent, penalize
      if (hasImage && isCompression && !hasExplicitPdf && !isConvertCombine) score -= 200;
    } else if (tool.name === 'PDF Merger') {
      if ((hasExplicitPdf || hasDoc) && isMerge && !hasImage) score += 320;
      if (isCompression) score -= 150;
    } else if (tool.name === 'PDF Unlocker') {
      if ((hasExplicitPdf || hasDoc) && isUnlock) score += 320;
      if (isCompression) score -= 150;
    } else if (tool.name === 'EMI Calculator') {
      if (hasEmi) score += 320;
    } else if (tool.name === 'JSON Formatter') {
      if (hasJson && (isFormat || !descLower.includes('csv'))) score += 320;
    } else if (tool.name === 'QR Code Generator') {
      if (hasQr) score += 320;
    } else if (tool.name === 'Resume Builder') {
      if (hasResume) score += 320;
    } else if (tool.name === 'Word Counter') {
      if (hasWords) score += 320;
    } else if (tool.name === 'GST Calculator') {
      if (hasGst) score += 320;
    } else if (tool.name === 'SIP Calculator') {
      if (hasSip) score += 320;
    } else if (tool.name === 'Password Generator') {
      if (hasPassword) score += 320;
    }

    // Exact name match
    if (nameLower === q) score += 200;
    else if (nameLower.startsWith(q)) score += 120;
    else if (nameLower.includes(q)) score += 80;

    // Word token matching with whole-word regex to avoid stopword / substring pollution
    for (const w of meaningfulWords) {
      const wRegex = new RegExp(`\\b${w}\\b`, 'i');
      if (wRegex.test(nameLower)) score += 35;
      if (tool.keywords.some(k => wRegex.test(k))) score += 25;
      if (wRegex.test(descLower)) score += 15;
      if (wRegex.test(catLower)) score += 10;
    }

    // Direct keyword exact phrase match
    for (const kw of tool.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === q) score += 100;
      else if (q.includes(kwLower) && kwLower.length > 3) score += 50;
    }

    if (score > 0) {
      scored.push({ tool, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function filterTools(query) {
  const scored = scoreTools(query);
  return scored.map(item => item.tool);
}

// "Tell Suvidha" conversational tool router (pure client-side)
export function resolveRequirement(query) {
  const analysis = analyzeIntent(query);
  const { q, targetParam, hasDoc, hasExplicitPdf, hasImage, isCompression, isMerge, isUnlock } = analysis;

  if (!q || q.length === 0) {
    return {
      type: 'none',
      message: 'Please describe what you want to do (e.g. "Make my PDF smaller than 1 MB").'
    };
  }

  const scored = scoreTools(q);

  if (scored.length === 0 || scored[0].score < 25) {
    return {
      type: 'none',
      message: "I couldn't identify a tool for that request. Try an example below or browse the directory."
    };
  }

  // Check for ambiguous generic document requests (e.g. "I need to change my document", "document file")
  const isGenericDocument = hasDoc && !hasExplicitPdf && !hasImage && !isCompression && !isMerge && !isUnlock;
  const isCloseRunnerUp = scored.length > 1 && (scored[0].score - scored[1].score < 20) && scored[0].score < 150;

  if (isGenericDocument || isCloseRunnerUp) {
    const topMatches = scored.slice(0, 3).map(s => {
      const tool = s.tool;
      const url = targetParam && (tool.name.includes('Compressor')) ? `${tool.url}?${targetParam.param}` : tool.url;
      return { ...tool, url };
    });
    return {
      type: 'ambiguous',
      message: 'I can help with that. Which one do you mean?',
      matches: topMatches
    };
  }

  // Confident match
  const best = scored[0].tool;
  let finalUrl = best.url;
  if (targetParam && best.name.includes('Compressor')) {
    finalUrl += `?${targetParam.param}`;
  }

  return {
    type: 'confident',
    tool: best,
    targetParam: (best.name.includes('Compressor')) ? targetParam : null,
    url: finalUrl,
    reason: 'I think you need:'
  };
}

export function initCommandPalette({ homePrefix = '', pageHref } = {}) {
  if (document.getElementById('cmdPalette')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cmdPalette';
  overlay.className = 'cmd-palette';
  overlay.innerHTML = `
    <div class="cmd-palette-dialog" role="dialog" aria-modal="true" aria-label="Search tools">
      <div class="cmd-palette-head">
        <span class="cmd-palette-search-icon">${icons.search}</span>
        <input type="search" id="cmdPaletteInput" placeholder="Search tools (e.g. compress, json, emi)…" autocomplete="off" />
        <kbd class="cmd-palette-kbd">Esc</kbd>
      </div>
      <div class="cmd-palette-list" id="cmdPaletteList" role="listbox"></div>
      <div class="cmd-palette-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>↵</kbd> Open</span>
        <span><kbd>Esc</kbd> Close</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#cmdPaletteInput');
  const list = overlay.querySelector('#cmdPaletteList');
  let selectedIndex = 0;
  let currentResults = [];

  const hrefFor = (tool) => {
    if (typeof pageHref === 'function') return pageHref(tool.url);
    return `${homePrefix}${tool.url}`;
  };

  const updateSelection = () => {
    const items = list.querySelectorAll('.cmd-palette-item');
    items.forEach((el, i) => {
      if (i === selectedIndex) {
        el.classList.add('is-selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('is-selected');
      }
    });
  };

  const render = (query) => {
    currentResults = filterTools(query);
    selectedIndex = 0;
    list.replaceChildren();

    if (!currentResults.length) {
      const empty = document.createElement('div');
      empty.className = 'cmd-palette-empty';
      empty.textContent = 'No matching tools found';
      list.appendChild(empty);
      return;
    }

    currentResults.forEach((tool, i) => {
      const a = document.createElement('a');
      a.className = `cmd-palette-item${i === 0 ? ' is-selected' : ''}`;
      a.href = hrefFor(tool);
      a.setAttribute('role', 'option');

      const icon = document.createElement('span');
      icon.className = 'cmd-palette-icon';
      icon.innerHTML = getToolIcon(tool.iconName);

      const copy = document.createElement('span');
      copy.className = 'cmd-palette-copy';
      
      const titleRow = document.createElement('span');
      titleRow.className = 'cmd-palette-title-row';

      const strong = document.createElement('strong');
      strong.textContent = tool.name;

      const category = document.createElement('span');
      category.className = 'cmd-palette-tag';
      category.textContent = tool.category;

      titleRow.append(strong, category);

      const desc = document.createElement('small');
      desc.textContent = tool.shortDesc;

      copy.append(titleRow, desc);

      const arrow = document.createElement('span');
      arrow.className = 'cmd-palette-arrow';
      arrow.innerHTML = icons.arrowRight;

      a.append(icon, copy, arrow);

      a.addEventListener('mouseenter', () => {
        selectedIndex = i;
        updateSelection();
      });

      a.addEventListener('click', () => {
        recordRecentTool(tool);
        close();
      });

      list.appendChild(a);
    });
  };

  const open = () => {
    overlay.classList.add('is-open');
    input.value = '';
    render('');
    requestAnimationFrame(() => input.focus());
  };

  const close = () => {
    overlay.classList.remove('is-open');
    input.blur();
  };

  input.addEventListener('input', () => render(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length) {
        selectedIndex = (selectedIndex + 1) % currentResults.length;
        updateSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length) {
        selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
        updateSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[selectedIndex]) {
        recordRecentTool(currentResults[selectedIndex]);
        window.location.href = hrefFor(currentResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    // '/' shortcut when not in input/textarea
    const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    const isEditing = tag === 'input' || tag === 'textarea' || document.activeElement.isContentEditable;

    if (e.key === '/' && !isEditing) {
      e.preventDefault();
      open();
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('is-open') ? close() : open();
    } else if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      close();
    }
  });

  document.querySelectorAll('[data-open-search]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  });

  return { open, close };
}

export function recordRecentTool(tool) {
  try {
    const key = 'suvidha_recent_tools';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(item => item.url !== tool.url);
    filtered.unshift({
      name: tool.name,
      url: tool.url,
      category: tool.category,
      shortDesc: tool.shortDesc || '',
      iconName: tool.iconName || 'browser'
    });
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 6)));
  } catch {
    // Ignore storage quota or disabled errors
  }
}
