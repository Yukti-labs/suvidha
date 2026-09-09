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

const INTENT_RULES = [
  {
    patterns: ['make pdf smaller', 'pdf smaller', 'shrink pdf', 'pdf 1mb', 'compress pdf', 'reduce pdf', 'pdf under 1mb', 'small pdf', 'pdf kb', 'compress'],
    toolName: 'PDF Compressor',
    boost: 120
  },
  {
    patterns: ['reduce image size', 'photo 20kb', 'photo 50kb', 'photo 100kb', 'image 100kb', 'photo under 100kb', 'shrink photo', 'passport photo', 'signature', 'compress image', 'make image smaller', 'photo size', 'compress photo'],
    toolName: 'Image Compressor',
    boost: 120
  },
  {
    patterns: ['make these photos one pdf', 'photos to pdf', 'images to pdf', 'convert photo to pdf', 'jpg to pdf', 'png to pdf', 'combine images to pdf', 'send photos as pdf'],
    toolName: 'Image to PDF',
    boost: 120
  },
  {
    patterns: ['loan monthly payment', 'calculate emi', 'home loan', 'car loan', 'loan emi', 'monthly installment', 'calculate loan', 'emi'],
    toolName: 'EMI Calculator',
    boost: 120
  },
  {
    patterns: ['make json readable', 'json beautify', 'json prettify', 'format json', 'clean json', 'indent json', 'json'],
    toolName: 'JSON Formatter',
    boost: 120
  },
  {
    patterns: ['count words', 'character count', 'word count', 'reading time', 'article length'],
    toolName: 'Word Counter',
    boost: 120
  },
  {
    patterns: ['create a qr', 'qr code', 'upi qr', 'generate qr', 'make qr', 'wifi qr', 'qr'],
    toolName: 'QR Code Generator',
    boost: 120
  },
  {
    patterns: ['build my resume', 'make resume', 'create cv', 'biodata', 'curriculum vitae', 'resume'],
    toolName: 'Resume Builder',
    boost: 120
  },
  {
    patterns: ['merge pdf', 'combine pdf', 'join pdf', 'combine documents'],
    toolName: 'PDF Merger',
    boost: 120
  },
  {
    patterns: ['unlock pdf', 'remove pdf password', 'decrypt pdf'],
    toolName: 'PDF Unlocker',
    boost: 120
  },
  {
    patterns: ['calculate gst', 'gst tax', 'reverse gst', 'cgst sgst', 'gst split'],
    toolName: 'GST Calculator',
    boost: 120
  },
  {
    patterns: ['sip calculator', 'mutual fund returns', 'compounding investment', 'sip returns'],
    toolName: 'SIP Calculator',
    boost: 120
  },
  {
    patterns: ['generate password', 'random password', 'secure password', 'password generator'],
    toolName: 'Password Generator',
    boost: 120
  }
];

export function filterTools(query) {
  const q = query.toLowerCase().trim();
  const tools = flattenTools();
  if (!q) return tools;

  const scored = [];
  const words = q.split(/\s+/).filter(Boolean);

  for (const tool of tools) {
    let score = 0;
    const nameLower = tool.name.toLowerCase();
    const catLower = tool.category.toLowerCase();
    const descLower = tool.shortDesc.toLowerCase();

    // Exact name match
    if (nameLower === q) score += 150;
    else if (nameLower.startsWith(q)) score += 90;
    else if (nameLower.includes(q)) score += 60;

    // Intent rules check
    for (const rule of INTENT_RULES) {
      if (rule.toolName === tool.name) {
        for (const pattern of rule.patterns) {
          if (q === pattern || q.includes(pattern) || pattern.includes(q)) {
            score += rule.boost;
            break;
          }
        }
      }
    }

    // Keyword matching
    for (const kw of tool.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === q) score += 80;
      else if (kwLower.includes(q)) score += 40;
    }

    // Word token overlaps
    for (const w of words) {
      if (nameLower.includes(w)) score += 25;
      if (tool.keywords.some(k => k.toLowerCase().includes(w))) score += 15;
      if (descLower.includes(w)) score += 10;
      if (catLower.includes(w)) score += 10;
    }

    if (score > 0) {
      scored.push({ tool, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(item => item.tool);
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
