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

export function filterTools(query) {
  const q = query.toLowerCase().trim();
  const tools = flattenTools();
  if (!q) return tools;
  
  return tools.filter(tool => {
    const nameMatch = tool.name.toLowerCase().includes(q);
    const catMatch = tool.category.toLowerCase().includes(q);
    const descMatch = tool.shortDesc.toLowerCase().includes(q);
    const kwMatch = tool.keywords.some(kw => kw.toLowerCase().includes(q));
    return nameMatch || catMatch || descMatch || kwMatch;
  });
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
