import { pageGroups } from './config.js';

export function flattenTools() {
  return pageGroups.flatMap(group => group.pages.map(page => ({
    name: page.label,
    url: page.path,
    category: group.label,
    icon: page.icon
  })));
}

function filterTools(query) {
  const q = query.toLowerCase().trim();
  const tools = flattenTools();
  if (!q) return tools;
  return tools.filter(tool =>
    tool.name.toLowerCase().includes(q) ||
    tool.category.toLowerCase().includes(q)
  );
}

export function initCommandPalette({ homePrefix = '', pageHref }) {
  if (document.getElementById('cmdPalette')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cmdPalette';
  overlay.className = 'cmd-palette';
  overlay.innerHTML = `
    <div class="cmd-palette-dialog" role="dialog" aria-modal="true" aria-label="Search tools">
      <div class="cmd-palette-head">
        <input type="search" id="cmdPaletteInput" placeholder="Search tools…" autocomplete="off" />
        <kbd>Esc</kbd>
      </div>
      <div class="cmd-palette-list" id="cmdPaletteList"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('#cmdPaletteInput');
  const list = overlay.querySelector('#cmdPaletteList');

  const hrefFor = (tool) => {
    if (typeof pageHref === 'function') return pageHref(tool.url);
    return `${homePrefix}${tool.url}`;
  };

  const render = (query) => {
    const results = filterTools(query);
    list.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'cmd-palette-empty';
      empty.textContent = 'No tools found';
      list.appendChild(empty);
      return;
    }
    results.forEach(tool => {
      const a = document.createElement('a');
      a.className = 'cmd-palette-item';
      a.href = hrefFor(tool);
      const icon = document.createElement('span');
      icon.className = 'cmd-palette-icon';
      icon.textContent = tool.icon;
      const copy = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = tool.name;
      const small = document.createElement('small');
      small.textContent = tool.category;
      copy.append(strong, small);
      a.append(icon, copy);
      list.appendChild(a);
    });
  };

  const open = () => {
    overlay.classList.add('is-open');
    input.value = '';
    render('');
    requestAnimationFrame(() => input.focus());
  };

  const close = () => overlay.classList.remove('is-open');

  input.addEventListener('input', () => render(input.value));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlay.classList.contains('is-open') ? close() : open();
    }
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  document.querySelectorAll('[data-open-search]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  });

  return { open, close };
}
