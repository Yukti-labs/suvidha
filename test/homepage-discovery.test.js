import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRequirement, filterTools } from '../assets/js/modules/search.js';
import { TOOL_ROUTES, isValidToolRoute } from '../assets/js/modules/routes.js';
import { 
  recordRecentTool, 
  getRecentTools, 
  clearRecentTools, 
  RECENT_TOOLS_KEY, 
  MAX_RECENT_TOOLS 
} from '../assets/js/modules/workspace.js';

console.log('=== Running Step 3: Homepage Discovery & Task-First Workflow Tests ===\n');

// Mock localStorage for workspace tests
const mockStore = {};
const mockLocalStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; }
};

global.window = { localStorage: mockLocalStorage };
global.localStorage = mockLocalStorage;
globalThis.localStorage = mockLocalStorage;

// A–G: Intent Resolution Tests
console.log('--- Test A–G: Core Intent & Target Parameter Resolution ---');

// A. "make pdf under 1 mb"
const resA = resolveRequirement('make pdf under 1 mb');
assert.strictEqual(resA.type, 'confident');
assert.strictEqual(resA.tool.name, 'PDF Compressor');
assert.strictEqual(resA.url, '/pages/pdf/pdf-compressor.html?target=1mb');
console.log('✓ PASS: A. "make pdf under 1 mb" -> PDF Compressor [target=1mb]');

// B. "photo under 50 kb"
const resB = resolveRequirement('photo under 50 kb');
assert.strictEqual(resB.type, 'confident');
assert.strictEqual(resB.tool.name, 'Image Compressor');
assert.strictEqual(resB.url, '/pages/image/image-compressor.html?target=50kb');
console.log('✓ PASS: B. "photo under 50 kb" -> Image Compressor [target=50kb]');

// C. "combine photos into pdf"
const resC = resolveRequirement('combine photos into pdf');
assert.strictEqual(resC.type, 'confident');
assert.strictEqual(resC.tool.name, 'Image to PDF');
assert.strictEqual(resC.url, '/pages/image/image-to-pdf.html');
console.log('✓ PASS: C. "combine photos into pdf" -> Image to PDF');

// D. "make json readable"
const resD = resolveRequirement('make json readable');
assert.strictEqual(resD.type, 'confident');
assert.strictEqual(resD.tool.name, 'JSON Formatter');
assert.strictEqual(resD.url, '/pages/json/json-formatter.html');
console.log('✓ PASS: D. "make json readable" -> JSON Formatter');

// E. "calculate emi"
const resE = resolveRequirement('calculate emi');
assert.strictEqual(resE.type, 'confident');
assert.strictEqual(resE.tool.name, 'EMI Calculator');
assert.strictEqual(resE.url, '/pages/finance/emi-calculator.html');
console.log('✓ PASS: E. "calculate emi" -> EMI Calculator');

// F. "create qr"
const resF = resolveRequirement('create qr');
assert.strictEqual(resF.type, 'confident');
assert.strictEqual(resF.tool.name, 'QR Code Generator');
assert.strictEqual(resF.url, '/pages/utility/qr-generator.html');
console.log('✓ PASS: F. "create qr" -> QR Code Generator');

// G. "build resume"
const resG = resolveRequirement('build resume');
assert.strictEqual(resG.type, 'confident');
assert.strictEqual(resG.tool.name, 'Resume Builder');
assert.strictEqual(resG.url, '/pages/resume/resume-builder.html');
console.log('✓ PASS: G. "build resume" -> Resume Builder\n');

// H: Ambiguous Request Resolution
console.log('--- Test H: Ambiguous Request Choice UI ---');
const resH = resolveRequirement('I need to change my document');
assert.strictEqual(resH.type, 'ambiguous');
assert.ok(Array.isArray(resH.matches) && resH.matches.length >= 2, 'Must return 2–3 options');
assert.ok(resH.message, 'Must return user-facing choice prompt');
console.log(`✓ PASS: H. Ambiguous request returns choice array (${resH.matches.length} candidates), no silent redirect\n`);

// I: Unknown Request Graceful Fallback
console.log('--- Test I: Unknown Request Graceful Fallback ---');
const resI = resolveRequirement('asdfghjk qwerty');
assert.strictEqual(resI.type, 'none');
assert.ok(resI.message.includes('couldn\'t find'), 'Must return helpful fallback without pretending to understand');
console.log('✓ PASS: I. Unknown request returns graceful fallback\n');

// J: Recently Used Specifications
console.log('--- Test J: Workspace Specifications ---');
clearRecentTools();
assert.deepStrictEqual(getRecentTools(), [], 'Empty state must return empty array');

recordRecentTool('pdf-compressor');
recordRecentTool('image-compressor');
recordRecentTool('json-formatter');
recordRecentTool('emi-calculator');
recordRecentTool('qr-generator');
recordRecentTool('word-counter'); // 6th item

let recents = getRecentTools();
assert.strictEqual(recents.length, MAX_RECENT_TOOLS, 'Must enforce max 5 ceiling');
assert.strictEqual(recents[0].slug, 'word-counter', 'Newest must be at index 0');

// Deduplication
recordRecentTool('pdf-compressor');
recents = getRecentTools();
assert.strictEqual(recents.length, MAX_RECENT_TOOLS, 'Must remain deduplicated');
assert.strictEqual(recents[0].slug, 'pdf-compressor', 'Moved to index 0 on re-use');

clearRecentTools();
assert.deepStrictEqual(getRecentTools(), [], 'Clear history must empty list');
console.log('✓ PASS: J. Workspace max 5, deduplicated, newest-first, clear works, empty state verified\n');

// K: Homepage All Tools Integrity
console.log('--- Test K: Homepage All Tools Integrity ---');
const indexPath = path.resolve('index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Assert no archived tools appear anywhere in index.html
const archivedCheckSlugs = ['money-upi-lookup', 'email-lookup', 'diff-viewer', 'salary-split'];
for (const badSlug of archivedCheckSlugs) {
  assert.ok(!indexHtml.includes(badSlug), `Archived tool "${badSlug}" must NOT appear in index.html`);
}

// Assert exactly 18 tools in directory
const mainHtml = indexHtml.split('</main>')[0];
const toolSlugMatches = [...mainHtml.matchAll(/data-tool-slug="([^"]+)"/g)].map(m => m[1]);
const uniqueDirectorySlugs = new Set(toolSlugMatches);
assert.strictEqual(uniqueDirectorySlugs.size, 18, `Expected exactly 18 unique active tools, got ${uniqueDirectorySlugs.size}`);
for (const slug of Object.keys(TOOL_ROUTES)) {
  assert.ok(uniqueDirectorySlugs.has(slug), `Directory must contain active tool: ${slug}`);
}

// Assert no relative nested links
assert.ok(!indexHtml.includes('href="pages/'), 'Must use canonical root-relative paths /pages/...');
assert.ok(!indexHtml.includes('href="../'), 'Must not use relative navigation');

// Assert progressive disclosure trigger exists
assert.ok(indexHtml.includes('id="toggleAllToolsBtn"'), 'Must have progressive disclosure toggle button');
assert.ok(indexHtml.includes('id="allToolsContent"'), 'Must have progressive disclosure container');

console.log('✓ PASS: K. Exactly 18 active production tools in directory, zero archived tools, canonical routes verified\n');

// L: Privacy copy guardrails
console.log('--- Test L: Privacy Copy Compliance ---');
const forbiddenPhrases = [
  '100% private',
  'completely anonymous',
  'nothing ever leaves your device',
  'zero tracking',
  'zero telemetry',
  'works completely offline'
];

for (const phrase of forbiddenPhrases) {
  assert.ok(!indexHtml.toLowerCase().includes(phrase), `Forbidden marketing claim "${phrase}" must not appear in index.html`);
}

console.log('✓ PASS: L. Compliant privacy phrasing verified with zero unsupported marketing claims\n');

console.log('========================================');
console.log('All Step 3 Homepage Discovery tests PASSED successfully!');
