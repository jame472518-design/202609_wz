import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPersonaLine, restaurantName, rankedNames } from '../src/js/summary.js';

const RESTAURANTS = [
  { id: 'pinwei', name: '品味牛排餐酒館' },
  { id: 'heishi', name: '黑市shabu 竹圍店' },
  { id: 'anywhere', name: '都可以，你決定就好' },
];

const EMPTY_STATE = { about: {}, deeper: {}, memories: {}, dinner: {} };

test('buildPersonaLine 串起處女座分數與累的時候想要什麼', () => {
  const state = { about: { q2: 80 }, deeper: { d1: '安靜陪著就好，不用講話' } };
  assert.equal(buildPersonaLine(state), '80 分的處女座，累的時候想要有人安靜陪著');
});

test('buildPersonaLine 只有分數時就只給分數', () => {
  assert.equal(buildPersonaLine({ about: { q2: 40 }, deeper: {} }), '40 分的處女座');
});

test('buildPersonaLine 全部沒填時回傳空字串', () => {
  assert.equal(buildPersonaLine(EMPTY_STATE), '');
});

test('buildPersonaLine 把滑桿的 0 當成有作答', () => {
  assert.equal(buildPersonaLine({ about: { q2: 0 }, deeper: {} }), '0 分的處女座');
});

test('restaurantName 由 id 找出店名', () => {
  assert.equal(restaurantName('pinwei', RESTAURANTS), '品味牛排餐酒館');
});

test('restaurantName 找不到時回傳還沒選', () => {
  assert.equal(restaurantName('nope', RESTAURANTS), '還沒選');
});

test('rankedNames 依順序把 id 換成店名', () => {
  assert.deepEqual(
    rankedNames(['heishi', 'pinwei'], RESTAURANTS),
    ['黑市shabu 竹圍店', '品味牛排餐酒館'],
  );
});

test('rankedNames 沒有排序時回傳空陣列', () => {
  assert.deepEqual(rankedNames(undefined, RESTAURANTS), []);
  assert.deepEqual(rankedNames([], RESTAURANTS), []);
});
