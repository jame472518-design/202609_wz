import { test } from 'node:test';
import assert from 'node:assert/strict';
import { petalCount } from '../src/js/rose.js';

test('九月十一號長出九片花瓣', () => {
  assert.equal(petalCount(9, 11), 9);
});

test('月份與日期都是奇數時，花瓣數等於月份', () => {
  assert.equal(petalCount(3, 7), 3);
  assert.equal(petalCount(5, 25), 5);
});

test('其中一個是偶數時，花瓣數加倍', () => {
  assert.equal(petalCount(9, 12), 18);
  assert.equal(petalCount(8, 11), 16);
  assert.equal(petalCount(6, 20), 12);
});
