import assert from 'node:assert';
import { TOOL_CHAINS, getToolChain } from '../assets/js/modules/tool-chaining.js';
import { TOOL_ROUTES, isValidToolRoute } from '../assets/js/modules/routes.js';
import { 
  recordRecentTool, 
  getRecentTools, 
  clearRecentTools, 
  getRecentToolObjects, 
  RECENT_TOOLS_KEY, 
  MAX_RECENT_TOOLS 
} from '../assets/js/modules/workspace.js';

console.log('=== Running Tool Chaining & Workspace Module Tests ===\n');

// 1. Tool Chaining Registry Verification
console.log('--- Test 1: Tool Chaining Registry Integrity ---');
assert.strictEqual(Object.keys(TOOL_CHAINS).length, 18, 'Must define next actions for all 18 production tools');

const ARCHIVED_SLUGS = new Set([
  'email-lookup',
  'money-upi-lookup',
  'email-validator',
  'upi-validator',
  'image-resizer',
  'svg-to-png',
  'base64',
  'hash-generator',
  'uuid-generator',
  'diff-viewer',
  'markdown-preview',
  'salary-split'
]);

for (const [slug, chain] of Object.entries(TOOL_CHAINS)) {
  assert.ok(chain.length >= 2 && chain.length <= 3, `Tool ${slug} must have 2–3 next actions, got ${chain.length}`);
  
  const actions = getToolChain(slug);
  for (const act of actions) {
    assert.ok(act.label, `Action in ${slug} must have a label`);
    if (act.action === 'navigate') {
      assert.ok(act.url, `Nav action in ${slug} must have a url`);
      assert.ok(act.url.startsWith('/pages/'), `URL ${act.url} in ${slug} must start with /pages/`);
      assert.ok(!act.url.includes('/pages/image/pages/image/'), `URL must not be nested: ${act.url}`);
      assert.ok(isValidToolRoute(act.url), `URL ${act.url} must be a valid active production tool route`);
      assert.ok(!ARCHIVED_SLUGS.has(act.targetSlug), `Action target ${act.targetSlug} must not be an archived tool`);
    } else {
      assert.ok(['reset', 'tell'].includes(act.action), `Action must be 'navigate', 'reset', or 'tell', got ${act.action}`);
    }
  }
}
console.log('✓ PASS: All 18 tool chaining workflows use valid, root-relative canonical routes with zero inactive tools.\n');

// 2. Specific Chaining Scenarios
console.log('--- Test 2: Specific Required Chaining Workflows ---');

const pdfCompActions = getToolChain('pdf-compressor');
assert.ok(pdfCompActions.some(a => a.label.includes('Merge')), 'PDF Compressor must offer Merge');
assert.ok(pdfCompActions.some(a => a.action === 'reset'), 'PDF Compressor must offer Compress another');
assert.ok(pdfCompActions.some(a => a.action === 'tell'), 'PDF Compressor must offer Tell Suvidha');

const imgCompActions = getToolChain('image-compressor');
assert.ok(imgCompActions.some(a => a.label.includes('PDF')), 'Image Compressor must offer Convert images to PDF');
assert.ok(imgCompActions.some(a => a.action === 'reset'), 'Image Compressor must offer Compress another image');

const jsonFormatActions = getToolChain('json-formatter');
assert.ok(jsonFormatActions.some(a => a.label.includes('Validate')), 'JSON Formatter must offer Validate JSON');
assert.ok(jsonFormatActions.some(a => a.label.includes('CSV')), 'JSON Formatter must offer Convert JSON to CSV');

// Refined chains assertions
const emiActions = getToolChain('emi-calculator');
assert.ok(emiActions.some(a => a.action === 'reset'), 'EMI must offer Calculate another EMI');
assert.ok(emiActions.some(a => a.targetSlug === 'sip-calculator'), 'EMI must offer SIP Calculator');

const gstActions = getToolChain('gst-calculator');
assert.ok(gstActions.some(a => a.action === 'reset'), 'GST must offer Calculate another GST');
assert.ok(gstActions.some(a => a.targetSlug === 'emi-calculator'), 'GST must offer EMI Calculator');

const qrActions = getToolChain('qr-generator');
assert.ok(qrActions.some(a => a.action === 'reset'), 'QR must offer Create another QR');
assert.strictEqual(qrActions.some(a => a.targetSlug === 'password-generator'), false, 'QR must not cross-sell password');

const passActions = getToolChain('password-generator');
assert.ok(passActions.some(a => a.action === 'reset'), 'Password must offer Generate another password');
assert.strictEqual(passActions.some(a => a.targetSlug === 'qr-generator'), false, 'Password must not cross-sell QR');

console.log('✓ PASS: PDF, Image, JSON, Finance, QR, and Utility refined tool chaining workflows verified.\n');

// 3. Mock localStorage for Workspace Tests
console.log('--- Test 3: Workspace (Recently Used) LocalStorage Tests ---');

const mockStore = {};
const mockLocalStorage = {
  getItem: (k) => mockStore[k] || null,
  setItem: (k, v) => { mockStore[k] = String(v); },
  removeItem: (k) => { delete mockStore[k]; }
};

global.window = {
  localStorage: mockLocalStorage
};
global.localStorage = mockLocalStorage;
globalThis.localStorage = mockLocalStorage;

clearRecentTools();
assert.deepStrictEqual(getRecentTools(), [], 'Initial recent list should be empty');

// Test 4: Adding single tool & Schema verification (strictly { slug, timestamp })
console.log('--- Test 4: Schema & Privacy Verification ---');
recordRecentTool('pdf-compressor');
const recents1 = getRecentTools();
assert.strictEqual(recents1.length, 1);
assert.strictEqual(recents1[0].slug, 'pdf-compressor');
assert.strictEqual(typeof recents1[0].timestamp, 'number');

// Raw localStorage check
const rawStored = JSON.parse(mockStore[RECENT_TOOLS_KEY]);
assert.strictEqual(rawStored.length, 1);
const storedKeys = Object.keys(rawStored[0]);
assert.deepStrictEqual(storedKeys.sort(), ['slug', 'timestamp'], 'Must store strictly { slug, timestamp }');
assert.strictEqual(rawStored[0].fileName, undefined);
assert.strictEqual(rawStored[0].fileContent, undefined);
assert.strictEqual(rawStored[0].personalData, undefined);
console.log('✓ PASS: Stored strictly { slug, timestamp } with zero personal/file data.\n');

// Test 5: Ordering & Deduplication
console.log('--- Test 5: Ordering & Deduplication ---');
recordRecentTool('image-compressor');
recordRecentTool('json-formatter');

let list = getRecentTools();
assert.strictEqual(list.length, 3);
assert.strictEqual(list[0].slug, 'json-formatter'); // newest first
assert.strictEqual(list[1].slug, 'image-compressor');
assert.strictEqual(list[2].slug, 'pdf-compressor');

// Now re-record 'pdf-compressor': must move to top and remain deduplicated
recordRecentTool('pdf-compressor');
list = getRecentTools();
assert.strictEqual(list.length, 3, 'Must remain deduplicated (length 3)');
assert.strictEqual(list[0].slug, 'pdf-compressor', 'pdf-compressor must move to index 0');
assert.strictEqual(list[1].slug, 'json-formatter');
assert.strictEqual(list[2].slug, 'image-compressor');
console.log('✓ PASS: Newest-first ordering and deduplication verified.\n');

// Test 6: Maximum 5 Entries Ceiling
console.log('--- Test 6: Maximum 5 Entries Ceiling ---');
recordRecentTool('emi-calculator');
recordRecentTool('resume-builder');
recordRecentTool('qr-generator');
recordRecentTool('word-counter');

list = getRecentTools();
assert.strictEqual(list.length, MAX_RECENT_TOOLS, `Must cap at ${MAX_RECENT_TOOLS} entries`);
assert.strictEqual(list[0].slug, 'word-counter');
assert.strictEqual(list[1].slug, 'qr-generator');
assert.strictEqual(list[2].slug, 'resume-builder');
assert.strictEqual(list[3].slug, 'emi-calculator');
assert.strictEqual(list[4].slug, 'pdf-compressor');
console.log('✓ PASS: Maximum 5 entries ceiling enforced.\n');

// Test 7: Clear History
console.log('--- Test 7: Clear History ---');
clearRecentTools();
assert.deepStrictEqual(getRecentTools(), []);
assert.strictEqual(mockStore[RECENT_TOOLS_KEY], undefined);
console.log('✓ PASS: Clear history verified.\n');

// Test 8: Hydrated Objects
console.log('--- Test 8: Hydrated Tool Objects ---');
recordRecentTool('pdf-compressor');
recordRecentTool('qr-generator');

const hydrated = getRecentToolObjects();
assert.strictEqual(hydrated.length, 2);
assert.strictEqual(hydrated[0].slug, 'qr-generator');
assert.strictEqual(hydrated[0].name, 'QR Code Generator');
assert.strictEqual(hydrated[0].url, '/pages/utility/qr-generator.html');
assert.ok(hydrated[0].category, 'Must have category');
assert.ok(hydrated[0].iconName, 'Must have iconName');

console.log('✓ PASS: Hydrated Recent Tool objects correctly map to canonical routes and metadata.\n');

console.log('========================================');
console.log('All Tool Chaining & Workspace tests PASSED successfully!');
