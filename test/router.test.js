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

console.log(`\n========================================`);
if (failedCount === 0) {
  console.log(`All ${routerCases.length + searchCases.length} regression tests PASSED successfully!`);
  process.exit(0);
} else {
  console.error(`${failedCount} tests FAILED.`);
  process.exit(1);
}
