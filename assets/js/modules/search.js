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

const INTENT_RULES = [
  {
    patterns: [
      'make my pdf smaller than 1 mb', 'make my pdf smaller', 'make pdf smaller', 'pdf smaller',
      'shrink pdf', 'pdf 1mb', 'make pdf under 1mb', 'pdf under 1mb', 'pdf below 500kb',
      'pdf under 500kb', 'pdf 500kb', 'pdf small', 'make pdf small', 'reduce pdf size',
      'reduce pdf', 'compress pdf', 'compresss pdf', 'pdf 2mb', 'small pdf'
    ],
    toolName: 'PDF Compressor',
    boost: 140
  },
  {
    patterns: [
      'make my photo under 100 kb', 'make my photo under 100kb', 'photo 100kb', 'photo under 100kb',
      'photo 50kb', 'photo below 50 kb', 'photo under 50kb', 'photo 20kb', 'photo below 20kb',
      'reduce image size', 'image less than 100kb', 'imgae compressor', 'compress photo',
      'photo size', 'compress image', 'make image smaller', 'passport photo', 'signature'
    ],
    toolName: 'Image Compressor',
    boost: 140
  },
  {
    patterns: [
      'combine these photos into one pdf', 'combine photos into one pdf', 'combine photos to pdf',
      'make these photos one pdf', 'many images into pdf', 'many photos and want one pdf',
      'convert photos to pdf', 'photos to pdf', 'images to pdf', 'convert photo to pdf',
      'jpg to pdf', 'png to pdf', 'combine images to pdf'
    ],
    toolName: 'Image to PDF',
    boost: 140
  },
  {
    patterns: [
      'calculate my home loan emi', 'calculate my loan emi', 'calculate my emi',
      'calculate home loan emi', 'home loan emi', 'monthly home loan', 'emi for 20 lakh',
      'loan monthly payment', 'calculate emi', 'home loan', 'car loan', 'monthly installment'
    ],
    toolName: 'EMI Calculator',
    boost: 140
  },
  {
    patterns: [
      'make this json readable', 'make json readable', 'beautify my json', 'beautify json',
      'json pretty', 'json formater', 'json beautify', 'json prettify', 'format json', 'clean json', 'indent json'
    ],
    toolName: 'JSON Formatter',
    boost: 140
  },
  {
    patterns: [
      'count words', 'character count', 'word count', 'reading time', 'article length'
    ],
    toolName: 'Word Counter',
    boost: 140
  },
  {
    patterns: [
      'create qr for my website', 'make a qr for my website', 'create a qr code',
      'create a qr', 'qr code', 'upi qr', 'generate qr', 'make qr', 'wifi qr'
    ],
    toolName: 'QR Code Generator',
    boost: 140
  },
  {
    patterns: [
      'build my resume', 'create cv', 'create a cv', 'create cv', 'cv maker',
      'resume for job', 'resum builder', 'make resume', 'biodata', 'curriculum vitae'
    ],
    toolName: 'Resume Builder',
    boost: 140
  },
  {
    patterns: [
      'merge pdf', 'combine pdf', 'join pdf', 'combine documents'
    ],
    toolName: 'PDF Merger',
    boost: 140
  },
  {
    patterns: [
      'unlock pdf', 'remove pdf password', 'decrypt pdf', 'unprotect pdf'
    ],
    toolName: 'PDF Unlocker',
    boost: 140
  },
  {
    patterns: [
      'calculate gst', 'gst tax', 'reverse gst', 'cgst sgst', 'gst split'
    ],
    toolName: 'GST Calculator',
    boost: 140
  },
  {
    patterns: [
      'sip calculator', 'mutual fund returns', 'compounding investment', 'sip returns'
    ],
    toolName: 'SIP Calculator',
    boost: 140
  },
  {
    patterns: [
      'generate password', 'random password', 'secure password', 'password generator'
    ],
    toolName: 'Password Generator',
    boost: 140
  }
];

export function scoreTools(query) {
  const q = normalizeQuery(query);
  const tools = flattenTools();
  if (!q) return [];

  const scored = [];
  const words = q.split(/\s+/).filter(Boolean);

  for (const tool of tools) {
    let score = 0;
    const nameLower = tool.name.toLowerCase();
    const catLower = tool.category.toLowerCase();
    const descLower = tool.shortDesc.toLowerCase();

    // Exact name match
    if (nameLower === q) score += 180;
    else if (nameLower.startsWith(q)) score += 100;
    else if (nameLower.includes(q)) score += 70;

    // Intent rules check
    for (const rule of INTENT_RULES) {
      if (rule.toolName === tool.name) {
        for (const pattern of rule.patterns) {
          if (q === pattern) {
            score += rule.boost + 40;
            break;
          } else if (q.includes(pattern) || pattern.includes(q)) {
            score += rule.boost;
            break;
          }
        }
      }
    }

    // Keyword matching
    for (const kw of tool.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === q) score += 90;
      else if (kwLower.includes(q) || q.includes(kwLower)) score += 45;
    }

    // Word token overlaps
    for (const w of words) {
      if (nameLower.includes(w)) score += 30;
      if (tool.keywords.some(k => k.toLowerCase().includes(w))) score += 20;
      if (descLower.includes(w)) score += 12;
      if (catLower.includes(w)) score += 10;
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
  const q = normalizeQuery(query);
  if (!q || q.length === 0) {
    return {
      type: 'none',
      message: 'Please describe what you want to do (e.g. "Make my PDF smaller than 1 MB").'
    };
  }

  // Detect any target size parameter (e.g. 1mb, 500kb, 100kb)
  const targetParam = detectTargetSize(q);
  const scored = scoreTools(q);

  if (scored.length === 0 || scored[0].score < 20) {
    return {
      type: 'none',
      message: "I couldn't identify a tool for that request. Try an example below or browse the directory."
    };
  }

  // Check for ambiguous generic requests (e.g. "change my document" or "edit document")
  const isGenericDocument = (q.includes('document') || q.includes('file')) && 
    !q.includes('compress') && !q.includes('small') && !q.includes('merge') && 
    !q.includes('combine') && !q.includes('unlock') && !q.includes('password');

  const isCloseRunnerUp = scored.length > 1 && 
    (scored[0].score - scored[1].score < 18) && 
    scored[0].score < 110;

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
