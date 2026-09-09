import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizePayload, getSanitizedUtm, buildShareUrl } from '../assets/js/modules/analytics.js';
import { getContextSuggestions } from '../assets/js/modules/tell-suvidha-modal.js';
import { detectTargetSize, resolveRequirement } from '../assets/js/modules/search.js';

console.log('=== Running PWA, Assistant & Privacy-Safe Analytics Tests ===\n');

// 1. PWA Manifest Validation
console.log('--- Test 1: PWA Manifest Validation ---');
const manifestPath = path.resolve('public/manifest.webmanifest');
assert.ok(fs.existsSync(manifestPath), 'public/manifest.webmanifest must exist');
const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw);

assert.strictEqual(manifest.name, 'Suvidha');
assert.strictEqual(manifest.short_name, 'Suvidha');
assert.strictEqual(manifest.start_url, '/');
assert.strictEqual(manifest.scope, '/');
assert.strictEqual(manifest.display, 'standalone');
assert.strictEqual(manifest.background_color, '#09090c');
assert.strictEqual(manifest.theme_color, '#09090c');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'Must have at least 192, 512, and maskable icons');

// Check icons physically exist on disk
for (const icon of manifest.icons) {
  const iconRel = icon.src.replace(/^\//, '');
  const iconOnDisk = path.resolve('public', iconRel);
  assert.ok(fs.existsSync(iconOnDisk), `Icon ${icon.src} must exist at ${iconOnDisk}`);
}

// Check PWA shortcuts
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 4, 'Must have shortcuts configured');
const tellShortcut = manifest.shortcuts.find(s => s.url === '/?tell=1');
assert.ok(tellShortcut, 'Shortcut for Tell Suvidha (/?tell=1) must exist');
console.log('✓ PASS: Manifest schema, icons, and shortcuts validated.\n');

// 2. Analytics Privacy Sanitization Filter
console.log('--- Test 2: Privacy Filter (Zero Personal Data / File Data) ---');

// Test that file extensions and file paths are blocked
const dirtyPayload = {
  tool: 'pdf-compressor',
  category: 'PDF',
  fileName: 'my_confidential_report.pdf',
  uploadedFile: 'blob:http://localhost/1234',
  query: 'I need my salary slip of Rs 50000 reduced',
  personalEmail: 'user@example.com',
  target: '≤ 1 MB',
  utm_source: 'whatsapp',
  utm_medium: 'share',
  utm_campaign: 'pdf_compressor'
};

const cleanPayload = sanitizePayload(dirtyPayload);

assert.strictEqual(cleanPayload.tool, 'pdf-compressor');
assert.strictEqual(cleanPayload.category, 'PDF');
assert.strictEqual(cleanPayload.target, '≤ 1 MB');
assert.strictEqual(cleanPayload.utm_source, 'whatsapp');
assert.strictEqual(cleanPayload.utm_medium, 'share');
assert.strictEqual(cleanPayload.utm_campaign, 'pdf_compressor');

// Must be stripped
assert.strictEqual(cleanPayload.fileName, undefined);
assert.strictEqual(cleanPayload.uploadedFile, undefined);
assert.strictEqual(cleanPayload.query, undefined);
assert.strictEqual(cleanPayload.personalEmail, undefined);
assert.strictEqual(Object.keys(cleanPayload).length, 6);
console.log('✓ PASS: Strict privacy sanitization blocked all sensitive and unapproved fields.\n');

// 3. Share URL Campaign Builder
console.log('--- Test 3: Privacy-Safe Share URL with UTM attribution ---');
const shareUrl = buildShareUrl('https://suvidhatools.in/pages/pdf/pdf-compressor.html', 'pdf-compressor');
assert.ok(shareUrl.includes('utm_source=share'), 'Must include utm_source=share');
assert.ok(shareUrl.includes('utm_medium=suvidha'), 'Must include utm_medium=suvidha');
assert.ok(shareUrl.includes('utm_campaign=pdf-compressor'), 'Must include utm_campaign');
assert.ok(!shareUrl.includes('.pdf'), 'Must not include file references in query string');
console.log(`✓ PASS: Share URL built: ${shareUrl}\n`);

// 4. Floating Tell Suvidha Contextual Suggestions
console.log('--- Test 4: Floating Tell Suvidha Contextual Suggestions ---');
const imgSuggestions = getContextSuggestions('image-compressor');
assert.ok(imgSuggestions.some(s => s.label.includes('50 KB')));
assert.ok(imgSuggestions.some(s => s.label.includes('PDF')));

const pdfSuggestions = getContextSuggestions('pdf-compressor');
assert.ok(pdfSuggestions.some(s => s.label.includes('Merge')));
assert.ok(pdfSuggestions.some(s => s.label.includes('Unlock')));

const defaultSuggestions = getContextSuggestions('');
assert.ok(defaultSuggestions.some(s => s.label.includes('1 MB')));
console.log('✓ PASS: Contextual suggestions dynamically tailored to active tools.\n');

// 5. Contextual Suggestions Route to Valid Tools
console.log('--- Test 5: Contextual Suggestion Routing via Intent Engine ---');
for (const s of imgSuggestions) {
  const res = resolveRequirement(s.query);
  assert.strictEqual(res.type, 'confident');
  assert.ok(['Image Compressor', 'Image to PDF'].includes(res.tool.name));
  console.log(`  ✓ "${s.query}" -> ${res.tool.name} [${res.targetParam?.label || 'no-param'}]`);
}
for (const s of pdfSuggestions) {
  const res = resolveRequirement(s.query);
  assert.strictEqual(res.type, 'confident');
  assert.ok(['PDF Merger', 'PDF Unlocker', 'PDF Compressor'].includes(res.tool.name));
  console.log(`  ✓ "${s.query}" -> ${res.tool.name} [${res.targetParam?.label || 'no-param'}]`);
}
console.log('✓ PASS: All contextual suggestions resolve with confident tool targets.\n');

console.log('========================================');
console.log('All PWA, Assistant & Analytics tests PASSED!');
