import assert from 'node:assert';
import { resolveRequirement, scoreTools, filterTools } from '../assets/js/modules/search.js';

console.log('=== Running Tell Suvidha Router & Search Regression Tests ===\n');

// 1. Mandatory Router Regression Test Cases from requirements
const routerCases = [
  {
    query: 'i need pdf under 1 mb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 1 MB',
    expectedParam: 'target=1mb'
  },
  {
    query: 'pdf under 1mb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 1 MB',
    expectedParam: 'target=1mb'
  },
  {
    query: 'make pdf smaller',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: null
  },
  {
    query: 'compress my pdf',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: null
  },
  {
    query: 'pdf below 500kb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 500 KB',
    expectedParam: 'target=500kb'
  },
  {
    query: 'photo under 100kb',
    expectedType: 'confident',
    expectedTool: 'Image Compressor',
    expectedTarget: '≤ 100 KB',
    expectedParam: 'target=100kb'
  },
  {
    query: 'compress my image',
    expectedType: 'confident',
    expectedTool: 'Image Compressor',
    expectedTarget: null
  },
  {
    query: 'convert photos to pdf',
    expectedType: 'confident',
    expectedTool: 'Image to PDF',
    expectedTarget: null
  },
  {
    query: 'combine photos into one pdf',
    expectedType: 'confident',
    expectedTool: 'Image to PDF',
    expectedTarget: null
  },
  // Additional Edge & Extended Cases
  {
    query: 'pdf below 1 mb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 1 MB',
    expectedParam: 'target=1mb'
  },
  {
    query: 'pdf less than 1 mb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 1 MB',
    expectedParam: 'target=1mb'
  },
  {
    query: 'reduce pdf size',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: null
  },
  {
    query: 'pdf 500kb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 500 KB',
    expectedParam: 'target=500kb'
  },
  {
    query: 'pdf under 500 kb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 500 KB',
    expectedParam: 'target=500kb'
  },
  {
    query: 'make my pdf less than 2mb',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 2 MB',
    expectedParam: 'target=2mb'
  },
  {
    query: 'I need my PDF under 1 MB',
    expectedType: 'confident',
    expectedTool: 'PDF Compressor',
    expectedTarget: '≤ 1 MB',
    expectedParam: 'target=1mb'
  },
  {
    query: 'image under 50kb',
    expectedType: 'confident',
    expectedTool: 'Image Compressor',
    expectedTarget: '≤ 50 KB',
    expectedParam: 'target=50kb'
  },
  {
    query: 'jpg less than 100kb',
    expectedType: 'confident',
    expectedTool: 'Image Compressor',
    expectedTarget: '≤ 100 KB',
    expectedParam: 'target=100kb'
  },
  {
    query: 'compress photo',
    expectedType: 'confident',
    expectedTool: 'Image Compressor',
    expectedTarget: null
  },
  {
    query: 'many images into one pdf',
    expectedType: 'confident',
    expectedTool: 'Image to PDF',
    expectedTarget: null
  },
  {
    query: 'make one pdf from these photos',
    expectedType: 'confident',
    expectedTool: 'Image to PDF',
    expectedTarget: null
  },
  {
    query: 'jpg to pdf',
    expectedType: 'confident',
    expectedTool: 'Image to PDF',
    expectedTarget: null
  },
  {
    query: 'calculate my home loan emi',
    expectedType: 'confident',
    expectedTool: 'EMI Calculator',
    expectedTarget: null
  },
  {
    query: 'make this json readable',
    expectedType: 'confident',
    expectedTool: 'JSON Formatter',
    expectedTarget: null
  },
  {
    query: 'create qr for my website',
    expectedType: 'confident',
    expectedTool: 'QR Code Generator',
    expectedTarget: null
  },
  {
    query: 'create cv',
    expectedType: 'confident',
    expectedTool: 'Resume Builder',
    expectedTarget: null
  },
  // Ambiguous & Empty Handling
  {
    query: 'I need to change my document',
    expectedType: 'ambiguous'
  },
  {
    query: 'asdfghjk qwerty',
    expectedType: 'none'
  }
];

let failedCount = 0;

for (const tc of routerCases) {
  const res = resolveRequirement(tc.query);
  try {
    assert.strictEqual(res.type, tc.expectedType, `Expected type ${tc.expectedType}, got ${res.type}`);
    if (tc.expectedType === 'confident') {
      assert.strictEqual(res.tool.name, tc.expectedTool, `Expected tool ${tc.expectedTool}, got ${res.tool.name}`);
      if (tc.expectedTarget) {
        assert.ok(res.targetParam, `Expected targetParam to exist`);
        assert.strictEqual(res.targetParam.label, tc.expectedTarget, `Expected target label ${tc.expectedTarget}, got ${res.targetParam.label}`);
        assert.ok(res.url.includes(tc.expectedParam), `Expected url ${res.url} to include ${tc.expectedParam}`);
      } else {
        assert.strictEqual(res.targetParam, null, `Expected targetParam to be null`);
      }
    } else if (tc.expectedType === 'ambiguous') {
      assert.ok(res.matches && res.matches.length > 0, `Expected matches array for ambiguous query`);
    }
    console.log(`✓ PASS: "${tc.query}" -> ${res.tool ? `${res.tool.name} [${res.targetParam?.label || 'no-param'}]` : res.type}`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: "${tc.query}"`);
    console.error(`  Error: ${err.message}`);
    console.error(`  Got:`, res);
  }
}

// 2. Global Search & Palette Ranking Regression Tests
console.log('\n=== Running Command Palette Search Ranking Regression Tests ===\n');

const searchCases = [
  { q: 'make pdf small', expected: 'PDF Compressor' },
  { q: 'reduce pdf size', expected: 'PDF Compressor' },
  { q: 'pdf under 1mb', expected: 'PDF Compressor' },
  { q: 'photo under 50kb', expected: 'Image Compressor' },
  { q: 'image less than 100kb', expected: 'Image Compressor' },
  { q: 'convert photos to pdf', expected: 'Image to PDF' },
  { q: 'many images into pdf', expected: 'Image to PDF' },
  { q: 'monthly home loan', expected: 'EMI Calculator' },
  { q: 'emi for 20 lakh', expected: 'EMI Calculator' },
  { q: 'beautify json', expected: 'JSON Formatter' },
  { q: 'json pretty', expected: 'JSON Formatter' },
  { q: 'cv maker', expected: 'Resume Builder' },
  { q: 'resume for job', expected: 'Resume Builder' },
  { q: 'qr for website', expected: 'QR Code Generator' },
  { q: 'count words', expected: 'Word Counter' },
  // Typo resilience
  { q: 'compresss pdf', expected: 'PDF Compressor' },
  { q: 'imgae compressor', expected: 'Image Compressor' },
  { q: 'json formater', expected: 'JSON Formatter' },
  { q: 'resum builder', expected: 'Resume Builder' }
];

for (const sc of searchCases) {
  const tools = filterTools(sc.q);
  const top = tools[0];
  try {
    assert.ok(top, `Expected at least one result for "${sc.q}"`);
    assert.strictEqual(top.name, sc.expected, `Expected top tool to be ${sc.expected}, got ${top.name}`);
    console.log(`✓ PASS: Search "${sc.q}" -> ${top.name}`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: Search "${sc.q}"`);
    console.error(`  Error: ${err.message}`);
  }
}

// Unified Search Parameterized & Canonical Routing Tests (Step 3 Item 8)
const searchParamCases = [
  { q: 'compress pdf', expectedTool: 'PDF Compressor', expectedRoute: '/pages/pdf/pdf-compressor.html' },
  { q: 'photo below 50 kb', expectedTool: 'Image Compressor', expectedRoute: '/pages/image/image-compressor.html?target=50kb' },
  { q: 'pdf under 1mb', expectedTool: 'PDF Compressor', expectedRoute: '/pages/pdf/pdf-compressor.html?target=1mb' }
];

for (const sc of searchParamCases) {
  const tools = filterTools(sc.q);
  const top = tools[0];
  assert.ok(top, `Expected result for "${sc.q}"`);
  assert.strictEqual(top.name, sc.expectedTool);
  assert.strictEqual(top.url, sc.expectedRoute);
  console.log(`✓ PASS: Unified Search "${sc.q}" -> ${top.name} (${top.url})`);
}

// 3. Suvidha 2.2: Complete 18-Tool Intent Coverage & Canonical Routing Tests
console.log('\n=== Running 18-Tool Intent & Canonical Routing Tests ===\n');

import { TOOL_ROUTES, getToolRoute, isValidToolRoute } from '../assets/js/modules/routes.js';
import { detectTargetSize } from '../assets/js/modules/search.js';

const all18ToolIntentCases = [
  { q: 'compress this pdf below 1 mb', expectedTool: 'PDF Compressor', expectedRoute: '/pages/pdf/pdf-compressor.html?target=1mb' },
  { q: 'merge two pdf files', expectedTool: 'PDF Merger', expectedRoute: '/pages/pdf/pdf-merger.html' },
  { q: 'unlock password protected pdf', expectedTool: 'PDF Unlocker', expectedRoute: '/pages/pdf/pdf-unlock.html' },
  { q: 'photo under 100 kb', expectedTool: 'Image Compressor', expectedRoute: '/pages/image/image-compressor.html?target=100kb' },
  { q: 'image below 50kb', expectedTool: 'Image Compressor', expectedRoute: '/pages/image/image-compressor.html?target=50kb' },
  { q: 'photo under 20 KB', expectedTool: 'Image Compressor', expectedRoute: '/pages/image/image-compressor.html?target=20kb' },
  { q: 'make these photos into one pdf', expectedTool: 'Image to PDF', expectedRoute: '/pages/image/image-to-pdf.html' },
  { q: 'calculate home loan emi', expectedTool: 'EMI Calculator', expectedRoute: '/pages/finance/emi-calculator.html' },
  { q: 'calculate gst for my bill', expectedTool: 'GST Calculator', expectedRoute: '/pages/finance/gst-calculator.html' },
  { q: 'plan mutual fund sip returns', expectedTool: 'SIP Calculator', expectedRoute: '/pages/finance/sip-calculator.html' },
  { q: 'make my json readable', expectedTool: 'JSON Formatter', expectedRoute: '/pages/json/json-formatter.html' },
  { q: 'check whether this json is valid', expectedTool: 'JSON Validator', expectedRoute: '/pages/json/json-validator.html' },
  { q: 'convert json to csv spreadsheet', expectedTool: 'JSON to CSV', expectedRoute: '/pages/json/json-to-csv.html' },
  { q: 'create meta tags for my website', expectedTool: 'Meta Tag Generator', expectedRoute: '/pages/seo/meta-tag-generator.html' },
  { q: 'generate sitemap xml', expectedTool: 'Sitemap Generator', expectedRoute: '/pages/seo/sitemap-generator.html' },
  { q: 'analyze keyword density in text', expectedTool: 'Keyword Analyzer', expectedRoute: '/pages/seo/keyword-analyzer.html' },
  { q: 'create my resume for job', expectedTool: 'Resume Builder', expectedRoute: '/pages/resume/resume-builder.html' },
  { q: 'count words in my article', expectedTool: 'Word Counter', expectedRoute: '/pages/utility/word-counter.html' },
  { q: 'create a qr code for my website', expectedTool: 'QR Code Generator', expectedRoute: '/pages/utility/qr-generator.html' },
  { q: 'generate a strong random password', expectedTool: 'Password Generator', expectedRoute: '/pages/utility/password-generator.html' }
];

for (const tc of all18ToolIntentCases) {
  const res = resolveRequirement(tc.q);
  try {
    assert.strictEqual(res.type, 'confident', `Expected confident match for "${tc.q}"`);
    assert.strictEqual(res.tool.name, tc.expectedTool, `Expected ${tc.expectedTool}, got ${res.tool.name}`);
    assert.strictEqual(res.url, tc.expectedRoute, `Expected route ${tc.expectedRoute}, got ${res.url}`);
    assert.ok(!res.url.includes('/pages/image/pages/image/'), `Route must not contain nested /pages/ paths: ${res.url}`);
    assert.ok(res.url.startsWith('/pages/'), `Route must be root-relative: ${res.url}`);
    console.log(`✓ PASS: Intent "${tc.q}" -> ${res.tool.name} (${res.url})`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: Intent "${tc.q}"`);
    console.error(`  Error: ${err.message}`);
  }
}

// 4. Parameter Extraction Tests
console.log('\n=== Running Parameter Extraction Tests ===\n');

const paramCases = [
  { text: '1 mb', expectedParam: 'target=1mb', expectedLabel: '≤ 1 MB' },
  { text: '500kb', expectedParam: 'target=500kb', expectedLabel: '≤ 500 KB' },
  { text: '100 kb', expectedParam: 'target=100kb', expectedLabel: '≤ 100 KB' },
  { text: '50kb', expectedParam: 'target=50kb', expectedLabel: '≤ 50 KB' },
  { text: '20 kb', expectedParam: 'target=20kb', expectedLabel: '≤ 20 KB' },
  { text: '2mb', expectedParam: 'target=2mb', expectedLabel: '≤ 2 MB' }
];

for (const pc of paramCases) {
  const res = detectTargetSize(pc.text);
  try {
    assert.ok(res, `Expected target size match for "${pc.text}"`);
    assert.strictEqual(res.param, pc.expectedParam, `Expected param ${pc.expectedParam}, got ${res?.param}`);
    assert.strictEqual(res.label, pc.expectedLabel, `Expected label ${pc.expectedLabel}, got ${res?.label}`);
    console.log(`✓ PASS: Param "${pc.text}" -> ${res.label} [${res.param}]`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: Param "${pc.text}"`);
    console.error(`  Error: ${err.message}`);
  }
}

// 5. Empty & No-Match Tests
console.log('\n=== Running Empty & No-Match Tests ===\n');

const noMatchCases = [
  '',
  '   ',
  'hello',
  'what is the weather',
  'tell me a joke'
];

for (const nm of noMatchCases) {
  const res = resolveRequirement(nm);
  try {
    assert.strictEqual(res.type, 'none', `Expected type "none" for "${nm}", got ${res.type}`);
    console.log(`✓ PASS: No-match query "${nm}" correctly returned type: "none"`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: No-match query "${nm}"`);
    console.error(`  Error: ${err.message}`);
  }
}

// 6. Centralized Route Registry Integrity
console.log('\n=== Running Route Registry Integrity Tests ===\n');

assert.strictEqual(Object.keys(TOOL_ROUTES).length, 18, 'Registry must contain exactly 18 tools');

for (const [slug, route] of Object.entries(TOOL_ROUTES)) {
  try {
    assert.ok(route.startsWith('/pages/'), `Route for ${slug} must start with /pages/`);
    assert.ok(route.endsWith('.html'), `Route for ${slug} must end with .html`);
    assert.ok(isValidToolRoute(route), `Route ${route} must be valid`);
    assert.ok(!route.includes('/pages/image/pages/image/'), `Route must not contain duplicate paths`);
    console.log(`✓ PASS: Canonical route verified: ${slug} -> ${route}`);
  } catch (err) {
    failedCount++;
    console.error(`✗ FAIL: Route check for ${slug}`);
    console.error(`  Error: ${err.message}`);
  }
}

console.log(`\n========================================`);
const totalTests = routerCases.length + searchCases.length + all18ToolIntentCases.length + paramCases.length + noMatchCases.length + Object.keys(TOOL_ROUTES).length;
if (failedCount === 0) {
  console.log(`All ${totalTests} tests PASSED successfully!`);
  process.exit(0);
} else {
  console.error(`${failedCount} tests FAILED.`);
  process.exit(1);
}
