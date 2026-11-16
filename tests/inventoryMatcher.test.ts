import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIngredientText,
  isIngredientInInventory,
  findMatchingInventoryItem,
} from '../src/utils/inventoryMatcher.ts';

test('normalizeIngredientText strips quantities, units, prep words, and plurals', () => {
  assert.equal(normalizeIngredientText('2 tbsp fresh minced garlic'), 'garlic');
  assert.equal(normalizeIngredientText('500g boneless skinless chicken breasts'), 'chicken breast');
  assert.equal(normalizeIngredientText('3 large tomatoes (diced)'), 'tomato');
});

test('isIngredientInInventory matches exact, plural, prep-stripped, and bilingual EN/FR items', () => {
  const inventory = [
    { name: 'Fresh Garlic Cloves', quantity: 2 },
    { name: 'Poulet', nameFr: 'Poulet', quantity: 1 },
    { name: 'Extra Virgin Olive Oil', quantity: 1 },
    { name: 'Empty Milk Carton', quantity: 0 },
  ];

  assert.equal(isIngredientInInventory('2 cloves garlic, minced', inventory), true);
  assert.equal(isIngredientInInventory('chicken breast', inventory), true);
  assert.equal(isIngredientInInventory("2 c. à soupe d'huile d'olive", inventory), true);
  // Quantity 0 should be treated as out of stock
  assert.equal(isIngredientInInventory('milk', inventory), false);
  assert.equal(isIngredientInInventory('salmon fillet', inventory), false);
});

test('findMatchingInventoryItem returns the matched inventory item', () => {
  const inventory = [{ name: 'Cherry Tomatoes', quantity: 3 }];
  const match = findMatchingInventoryItem('2 cups tomatoes', inventory);
  assert.ok(match);
  assert.equal(match.name, 'Cherry Tomatoes');
});
