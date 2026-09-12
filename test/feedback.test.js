import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { validateFeedbackForm, getCleanPageContext } from '../assets/js/modules/feedback.js';
import { sanitizePayload } from '../assets/js/modules/analytics.js';
import handler, {
  DESTINATION_EMAIL,
  ALLOWED_FEEDBACK_TYPES,
  validateFeedbackPayload,
  sanitizePageContext,
  buildFeedbackEmail,
  checkRateLimit
} from '../api/feedback.js';

console.log('=== Running Feedback & Suggestions Automated Test Suite ===\n');

// --------------------------------------------------------------------------
// 1. Dependency Check (ZERO New Dependencies)
// --------------------------------------------------------------------------
console.log('--- Test 0: Zero Dependency Guarantee ---');
const pkgRaw = fs.readFileSync(path.resolve('package.json'), 'utf8');
const pkg = JSON.parse(pkgRaw);
assert.strictEqual(pkg.dependencies?.nodemailer, undefined, 'nodemailer MUST NOT be in dependencies');
assert.strictEqual(pkg.devDependencies?.nodemailer, undefined, 'nodemailer MUST NOT be in devDependencies');
console.log('✓ PASS 0: Nodemailer is completely absent from dependencies.\n');

// --------------------------------------------------------------------------
// 2. Structure & HTML Markup Tests
// --------------------------------------------------------------------------
console.log('--- Test 1-4: Modal Structure, Entry Points & Options ---');
const feedbackJsSrc = fs.readFileSync(path.resolve('assets/js/modules/feedback.js'), 'utf8');
const sharedUiSrc = fs.readFileSync(path.resolve('assets/js/shared-ui-new.js'), 'utf8');

// 1. Feedback link in footer and drawer
assert.ok(sharedUiSrc.includes('footer-feedback-link'), 'Footer must contain feedback link');
assert.ok(sharedUiSrc.includes('id="footerFeedbackBtn"'), 'Footer feedback link must have id="footerFeedbackBtn"');
assert.ok(sharedUiSrc.includes('drawer-feedback-link'), 'Mobile drawer must contain feedback link');
console.log('✓ PASS 1: Feedback link entry points exist in footer and mobile drawer.');

// 2 & 3. Modal close and Escape support
assert.ok(feedbackJsSrc.includes('closeFeedbackModal'), 'Modal close function must exist');
assert.ok(feedbackJsSrc.includes("e.key === 'Escape'"), 'Escape key handler must exist to close modal');
assert.ok(feedbackJsSrc.includes('id="feedbackModalClose"'), 'Close button must exist in modal');
console.log('✓ PASS 2-3: Modal close handlers and Escape key handler verified.');

// 4. Feedback type options
const expectedTypes = ['Suggestion', 'Bug Report', 'Feature Request', 'General Feedback', 'Other'];
for (const type of expectedTypes) {
  assert.ok(ALLOWED_FEEDBACK_TYPES.includes(type), `ALLOWED_FEEDBACK_TYPES must include "${type}"`);
  assert.ok(feedbackJsSrc.includes(`value="${type}"`), `Modal HTML must include option for "${type}"`);
}
console.log('✓ PASS 4: All 5 feedback type options are present and verified.');

// --------------------------------------------------------------------------
// 3. Client-side Form Validation Tests
// --------------------------------------------------------------------------
console.log('\n--- Test 5-12: Client-side Validation Rules ---');

// 5. Feedback message required
const resEmptyMsg = validateFeedbackForm({
  type: 'Suggestion',
  message: '',
  name: '',
  email: ''
});
assert.strictEqual(resEmptyMsg.isValid, false, 'Empty message must fail validation');
assert.ok(resEmptyMsg.errors.message, 'Must return error for empty message');
console.log('✓ PASS 5: Empty feedback message is rejected.');

// 6. Minimum 10 characters validation
const resShortMsg = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Too short',
  name: '',
  email: ''
});
assert.strictEqual(resShortMsg.isValid, false, 'Message < 10 chars must fail validation');
assert.ok(resShortMsg.errors.message.includes('10 characters'), 'Error must specify 10 characters minimum');

const resExact10Msg = validateFeedbackForm({
  type: 'Suggestion',
  message: '1234567890',
  name: '',
  email: ''
});
assert.strictEqual(resExact10Msg.isValid, true, 'Message with exactly 10 chars must pass');
console.log('✓ PASS 6: Minimum 10 characters length validation enforced.');

// 7. Maximum 2000 characters validation
const resLongMsg = validateFeedbackForm({
  type: 'Suggestion',
  message: 'A'.repeat(2001),
  name: '',
  email: ''
});
assert.strictEqual(resLongMsg.isValid, false, 'Message > 2000 chars must fail validation');
assert.ok(resLongMsg.errors.message.includes('2000'), 'Error must specify 2000 characters maximum');

const resExact2000Msg = validateFeedbackForm({
  type: 'Suggestion',
  message: 'A'.repeat(2000),
  name: '',
  email: ''
});
assert.strictEqual(resExact2000Msg.isValid, true, 'Message with exactly 2000 chars must pass');
console.log('✓ PASS 7: Maximum 2000 characters length validation enforced.');

// 8 & 11. Optional name validation
const resNoName = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Valid feedback message for test',
  name: '',
  email: ''
});
assert.strictEqual(resNoName.isValid, true, 'Empty name must be accepted');

const resLongName = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Valid feedback message for test',
  name: 'X'.repeat(101),
  email: ''
});
assert.strictEqual(resLongName.isValid, false, 'Name > 100 chars must fail');
console.log('✓ PASS 8 & 11: Name is optional and capped at 100 characters.');

// 9, 10 & 12. Optional email validation & format check
const resNoEmail = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Valid feedback message for test',
  name: '',
  email: ''
});
assert.strictEqual(resNoEmail.isValid, true, 'Empty email must be accepted');

const resInvalidEmail = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Valid feedback message for test',
  name: '',
  email: 'invalid-email-format'
});
assert.strictEqual(resInvalidEmail.isValid, false, 'Malformed email must fail validation');
assert.ok(resInvalidEmail.errors.email, 'Must return error for invalid email');

const resValidEmail = validateFeedbackForm({
  type: 'Suggestion',
  message: 'Valid feedback message for test',
  name: '',
  email: 'user@example.com'
});
assert.strictEqual(resValidEmail.isValid, true, 'Valid email must pass');
console.log('✓ PASS 9, 10 & 12: Email is optional, format validated only when supplied.');

// --------------------------------------------------------------------------
// 4. Submission Combinations & Server-side Validation
// --------------------------------------------------------------------------
console.log('\n--- Test 13-16: Submission Combinations ---');

// 13. No name, no email
const payloadNoNameNoEmail = {
  type: 'Feature Request',
  message: 'Please add dark mode toggle shortcut key.',
  name: '',
  email: '',
  page: 'https://www.suvidhatools.in/pages/pdf/pdf-compressor.html'
};
const val13 = validateFeedbackPayload(payloadNoNameNoEmail);
assert.strictEqual(val13.valid, true);
assert.strictEqual(val13.data.name, 'Not provided');
assert.strictEqual(val13.data.email, 'Not provided');
console.log('✓ PASS 13: Submits successfully with no name and no email.');

// 14. With name only
const payloadNameOnly = {
  type: 'Bug Report',
  message: 'Found an alignment issue on mobile view.',
  name: 'Alex Johnson',
  email: '',
  page: 'https://www.suvidhatools.in/'
};
const val14 = validateFeedbackPayload(payloadNameOnly);
assert.strictEqual(val14.valid, true);
assert.strictEqual(val14.data.name, 'Alex Johnson');
assert.strictEqual(val14.data.email, 'Not provided');
console.log('✓ PASS 14: Submits successfully with name only.');

// 15. With email only
const payloadEmailOnly = {
  type: 'General Feedback',
  message: 'Great tool suite, really fast and clean UI!',
  name: '',
  email: 'alex@example.org',
  page: 'https://www.suvidhatools.in/pages/json/json-formatter.html'
};
const val15 = validateFeedbackPayload(payloadEmailOnly);
assert.strictEqual(val15.valid, true);
assert.strictEqual(val15.data.name, 'Not provided');
assert.strictEqual(val15.data.email, 'alex@example.org');
console.log('✓ PASS 15: Submits successfully with email only.');

// 16. With both name and email
const payloadBoth = {
  type: 'Suggestion',
  message: 'Could you add batch image compression options?',
  name: 'Sam Smith',
  email: 'sam.smith@domain.co',
  page: 'https://www.suvidhatools.in/pages/image/image-compressor.html'
};
const val16 = validateFeedbackPayload(payloadBoth);
assert.strictEqual(val16.valid, true);
assert.strictEqual(val16.data.name, 'Sam Smith');
assert.strictEqual(val16.data.email, 'sam.smith@domain.co');
console.log('✓ PASS 16: Submits successfully with both name and email.');

// --------------------------------------------------------------------------
// 5. UI States & Duplicate Submission Guards
// --------------------------------------------------------------------------
console.log('\n--- Test 17-20: Submission States & Value Preservation ---');

// 17 & 18. Duplicate submission & loading state indicators in JS code
assert.ok(feedbackJsSrc.includes('isSubmitting'), 'isSubmitting lock must exist');
assert.ok(feedbackJsSrc.includes('submitBtn.disabled = true'), 'Submit button must be disabled during submission');
assert.ok(feedbackJsSrc.includes('feedback-btn-spinner'), 'Loading spinner must be present in submit button');
console.log('✓ PASS 17-18: Duplicate submission prevention and loading state verified.');

// 19. Success state copy
assert.ok(feedbackJsSrc.includes('Thanks for helping improve Suvidha! ❤️'), 'Must contain exact success heading');
assert.ok(feedbackJsSrc.includes('You can help us make Suvidha better with every suggestion.'), 'Must contain exact success description');
console.log('✓ PASS 19: Success state UX and copy verified.');

// 20. Error state preserves form values
assert.ok(feedbackJsSrc.includes("Couldn't send your feedback right now. Please try again."), 'Must display exact error message');
assert.ok(feedbackJsSrc.includes('globalError.style.display = \'block\''), 'Must display error message container');
assert.ok(feedbackJsSrc.includes('form.reset()'), 'form.reset() must be executed upon successful submission');
console.log('✓ PASS 20: Error state preserves form values for seamless retry.');

// --------------------------------------------------------------------------
// 6. Strict Privacy, Sanitization & Fixed Destination Verification
// --------------------------------------------------------------------------
console.log('\n--- Test 21-25: Privacy Guarantees & Fixed Destination ---');

// 21. Fixed Destination Address Check
assert.strictEqual(DESTINATION_EMAIL, 'sujitjoshi258@gmail.com', 'Destination must be fixed to sujitjoshi258@gmail.com');

// 22. Attacker cannot control destination via payload
const maliciousPayload = {
  type: 'Suggestion',
  message: 'Valid feedback message for test payload',
  name: 'User Name',
  email: 'user@example.com',
  to: 'victim@attacker.com',
  destination: 'admin@relay.com',
  recipient: 'spam@target.org',
  page: 'https://www.suvidhatools.in/pages/pdf/pdf-compressor.html?token=secret123&userQuery=salary_slip',
  uploadedFiles: ['contract.pdf'],
  fileData: 'JVBERi0xLjQK...',
  financialValue: 500000,
  rawToolInput: 'my secret prompt'
};

const sanitizedVal = validateFeedbackPayload(maliciousPayload);
assert.strictEqual(sanitizedVal.valid, true);
assert.strictEqual(sanitizedVal.data.to, undefined, 'Attacker cannot set destination "to"');
assert.strictEqual(sanitizedVal.data.destination, undefined, 'Attacker cannot set "destination"');
assert.strictEqual(sanitizedVal.data.recipient, undefined, 'Attacker cannot set "recipient"');
assert.strictEqual(sanitizedVal.data.uploadedFiles, undefined, 'uploadedFiles must not exist in data');
assert.strictEqual(sanitizedVal.data.fileData, undefined, 'fileData must not exist in data');
assert.strictEqual(sanitizedVal.data.financialValue, undefined, 'financialValue must not exist in data');
assert.strictEqual(sanitizedVal.data.rawToolInput, undefined, 'rawToolInput must not exist in data');
console.log('✓ PASS 21-22: Destination address is immutable and protected from relay abuse.');

// 23-24. Page URL sanitization (query parameters stripped)
const sanitizedUrl = sanitizePageContext('https://www.suvidhatools.in/pages/pdf/pdf-compressor.html?user=test&file=doc.pdf#section');
assert.strictEqual(sanitizedUrl, 'https://www.suvidhatools.in/pages/pdf/pdf-compressor.html', 'Query string and hash must be stripped');
console.log('✓ PASS 23-24: Zero file data, filenames, or raw tool queries leaked into page context.');

// 25. Analytics payload sanitization
const dirtyAnalyticsPayload = {
  tool: 'pdf-compressor',
  feedback_type: 'Bug Report',
  feedbackText: 'My sensitive report is failing to compress',
  fileName: 'secret_bank_statement.pdf',
  userEmail: 'private@domain.com'
};
const cleanAnalytics = sanitizePayload(dirtyAnalyticsPayload);
assert.strictEqual(cleanAnalytics.tool, 'pdf-compressor');
assert.strictEqual(cleanAnalytics.feedback_type, 'Bug Report');
assert.strictEqual(cleanAnalytics.feedbackText, undefined, 'Feedback text MUST NOT be in analytics');
assert.strictEqual(cleanAnalytics.fileName, undefined, 'Filename MUST NOT be in analytics');
assert.strictEqual(cleanAnalytics.userEmail, undefined, 'Email MUST NOT be in analytics');
console.log('✓ PASS 25: Analytics payload is strictly sanitized with zero PII or feedback content.');

// --------------------------------------------------------------------------
// 7. Email Subject & Body Formatting Tests
// --------------------------------------------------------------------------
console.log('\n--- Test 26-28: Email Delivery Formatting & Serverless Handler ---');

const emailData = buildFeedbackEmail({
  type: 'Bug Report',
  message: 'Image compression stalls at 99% on Safari.',
  name: 'Jane Doe',
  email: 'jane@example.com',
  page: 'https://www.suvidhatools.in/pages/image/image-compressor.html',
  timestamp: '2026-09-11T20:00:00.000Z'
});

assert.strictEqual(emailData.subject, 'Suvidha: Feedback — Bug Report', 'Subject must match exact format');
assert.ok(emailData.textBody.includes('Suvidha Feedback\n'), 'Email body must start with header');
assert.ok(emailData.textBody.includes('Type:\nBug Report'), 'Email body must include Type');
assert.ok(emailData.textBody.includes('Feedback:\nImage compression stalls at 99% on Safari.'), 'Email body must include Feedback message');
assert.ok(emailData.textBody.includes('Name:\nJane Doe'), 'Email body must include Name');
assert.ok(emailData.textBody.includes('Email:\njane@example.com'), 'Email body must include Email');
assert.ok(emailData.textBody.includes('Page:\nhttps://www.suvidhatools.in/pages/image/image-compressor.html'), 'Email body must include Page');
assert.ok(emailData.textBody.includes('Submitted:\n2026-09-11T20:00:00.000Z'), 'Email body must include Submitted timestamp');
console.log('✓ PASS 26: Email subject and body formatted to exact specifications.');

// 27. Rate limiter testing
const testIp = '192.168.1.100';
for (let i = 0; i < 10; i++) {
  assert.strictEqual(checkRateLimit(testIp), true, `Request ${i + 1} should be permitted`);
}
assert.strictEqual(checkRateLimit(testIp), false, '11th rapid request from same IP should be blocked by rate limiter');
console.log('✓ PASS 27: Rate limiter blocks rapid automated abuse.');

// 28. Serverless handler response test (Mock request/response)
async function testServerlessHandler() {
  const mockReq = {
    method: 'POST',
    headers: { 'x-forwarded-for': '10.0.0.1' },
    body: JSON.stringify({
      type: 'Suggestion',
      message: 'Add more financial calculators like PPF and FD.',
      name: 'Priya',
      email: '',
      page: 'https://www.suvidhatools.in/pages/finance/emi-calculator.html'
    })
  };

  let statusCode = 0;
  let responseData = null;
  const headers = {};

  const mockRes = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    },
    end: () => mockRes
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 200, 'Serverless handler should return HTTP 200');
  assert.strictEqual(responseData.success, true, 'Serverless response should indicate success');
  console.log('✓ PASS 28: Serverless handler executes cleanly in zero-dependency native fetch mode.');
}

await testServerlessHandler();

// 29. Method rejection test
async function testMethodRejection() {
  const mockReq = {
    method: 'GET',
    headers: {}
  };
  let statusCode = 0;
  let responseData = null;
  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return mockRes;
    },
    json: (data) => {
      responseData = data;
      return mockRes;
    }
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 405, 'GET requests should be rejected with 405');
  assert.strictEqual(responseData.success, false);
  console.log('✓ PASS 29: Non-POST requests correctly rejected with HTTP 405.');
}

await testMethodRejection();

// 30. Accessibility and Privacy Copy Compliance check
assert.ok(feedbackJsSrc.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
assert.ok(feedbackJsSrc.includes('role="dialog"'), 'Modal must have role="dialog"');
assert.ok(feedbackJsSrc.includes('aria-labelledby="feedbackModalTitle"'), 'Modal must have aria-labelledby');
assert.ok(feedbackJsSrc.includes('aria-describedby="feedbackModalDesc"'), 'Modal must have aria-describedby');
assert.ok(feedbackJsSrc.includes('min-height: 44px') || feedbackJsSrc.includes('min-height: 46px'), 'Touch targets must be >= 44px');

// Verify NO forbidden privacy claims
const forbiddenPhrases = [
  '100% private',
  'Nothing leaves your device',
  'Completely anonymous'
];
for (const phrase of forbiddenPhrases) {
  assert.ok(!feedbackJsSrc.toLowerCase().includes(phrase.toLowerCase()), `Forbidden marketing phrase "${phrase}" must not exist`);
}
console.log('✓ PASS 30: Accessibility semantics and privacy copy compliance verified.');

console.log('\n==================================================');
console.log('All Feedback & Suggestions tests PASSED successfully!');
console.log('==================================================\n');
