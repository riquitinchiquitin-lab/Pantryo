import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateSmartShelfLife } from '../src/utils/smartExpirationRules.ts';

test('Fresh poultry gets 2 days in FRIDGE and 9 months (270 days) in FREEZER', () => {
  const fridge = estimateSmartShelfLife('Chicken Breasts', 'Meat & Seafood', 'FRIDGE');
  assert.equal(fridge.days, 2);
  assert.equal(fridge.matchedRule.categoryId, 'poultry_fresh');

  const freezer = estimateSmartShelfLife('Chicken Breasts', 'Meat & Seafood', 'FREEZER');
  assert.equal(freezer.monthsFrozen, 9);
  assert.equal(freezer.days, 270);
});

test('Ground meat gets 2 days in FRIDGE and 4 months in FREEZER', () => {
  const fridge = estimateSmartShelfLife('Ground Beef', 'Meat & Seafood', 'FRIDGE');
  assert.equal(fridge.days, 2);
  assert.equal(fridge.matchedRule.categoryId, 'ground_meat');

  const freezer = estimateSmartShelfLife('Ground Beef', 'Meat & Seafood', 'FREEZER');
  assert.equal(freezer.monthsFrozen, 4);
  assert.equal(freezer.days, 120);
});

test('Hard cheese lasts longer in FRIDGE than soft cheese/yogurt', () => {
  const cheddar = estimateSmartShelfLife('Cheddar Cheese', 'Dairy & Eggs', 'FRIDGE');
  const yogurt = estimateSmartShelfLife('Greek Yogurt', 'Dairy & Eggs', 'FRIDGE');
  assert.ok(cheddar.days > yogurt.days);
  assert.equal(cheddar.matchedRule.categoryId, 'hard_cheese');
});

test('Spices in SPICE_RACK default to 730 days (2 years)', () => {
  const spice = estimateSmartShelfLife('Smoked Paprika', 'Spices & Seasonings', 'SPICE_RACK');
  assert.equal(spice.days, 730);
  assert.equal(spice.matchedRule.categoryId, 'spices_seasonings');
});

test('Returns valid YYYY-MM-DD suggestedDate', () => {
  const result = estimateSmartShelfLife('Milk', 'Dairy & Eggs', 'FRIDGE');
  assert.match(result.suggestedDate, /^\d{4}-\d{2}-\d{2}$/);
});
