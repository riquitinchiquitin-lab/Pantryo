import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuebecReceiptText } from '../server/src/services/quebecReceiptParser.js';

test('parseQuebecReceiptText parses Quebec grocery items and ignores totals/taxes', () => {
  const sampleReceipt = `
    SUPER C #421
    POITRINE POULET        12.49
    LAIT 2% NATREL          4.99
    POMMES HONEYCRISP       5.49
    SOUS-TOTAL             22.97
    TPS                     0.00
    TOTAL                  22.97
  `;

  const items = parseQuebecReceiptText(sampleReceipt, 'FR');
  assert.ok(Array.isArray(items));
  assert.ok(items.length >= 2);
  assert.ok(items.every((item) => item.name && item.recommendedLocation && item.suggestedExpirationDate));
});

test('parseQuebecReceiptText handles empty or whitespace input gracefully', () => {
  const items = parseQuebecReceiptText('   \n  ', 'EN');
  assert.deepEqual(items, []);
});
