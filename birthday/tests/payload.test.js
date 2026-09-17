import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, buildPlainText, FORM_ENDPOINT } from '../src/js/payload.js';

const RESTAURANTS = [
  { id: 'pinwei', name: '品味牛排餐酒館' },
  { id: 'heishi', name: '黑市shabu 竹圍店' },
];

const state = {
  about: { q1: '一個人安安靜靜地過', q2: 80, q3: '看穿別人心裡在想什麼', q4: '早上有位子坐', q5: '看得出你有在想我' },
  deeper: { d1: '安靜陪著就好，不用講話', d3: '最近這一年' },
  memories: { s1: '桌遊店', s1Correct: true, s2: '草莓的', s3: '兩次', s3Correct: true },
  dinner: { ranked: ['heishi', 'pinwei'] },
};

test('FORM_ENDPOINT 是一個 Formspree 表單網址', () => {
  // 真實的 endpoint 在 src/data/config.js，那個值不進版本庫，
  // 所以這裡只檢查格式，不檢查內容。
  assert.match(FORM_ENDPOINT, /^https:\/\/formspree\.io\/f\/\w+$/);
});

test('buildPayload 帶上主旨與送出時間', () => {
  const p = buildPayload(state, new Date('2026-09-09T13:05:00Z'), RESTAURANTS);
  assert.equal(p._subject, '她填完了');
  assert.equal(p.submittedAt, '2026-09-09T13:05:00.000Z');
});

test('buildPayload 把餐廳排序轉成店名並保留順序', () => {
  const p = buildPayload(state, new Date(), RESTAURANTS);
  assert.deepEqual(p.dinner.ranked, ['黑市shabu 竹圍店', '品味牛排餐酒館']);
});

test('buildPayload 保留四個答案區段', () => {
  const p = buildPayload(state, new Date(), RESTAURANTS);
  assert.equal(p.about.q2, 80);
  assert.equal(p.deeper.d1, '安靜陪著就好，不用講話');
  assert.equal(p.memories.s1Correct, true);
});

test('buildPayload 在區段缺漏時補成空物件與空排序', () => {
  const p = buildPayload({}, new Date(), RESTAURANTS);
  assert.deepEqual(p.about, {});
  assert.deepEqual(p.deeper, {});
  assert.deepEqual(p.memories, {});
  assert.deepEqual(p.dinner.ranked, []);
});

test('buildPlainText 用中文標籤列出答案，餐廳照順序', () => {
  const text = buildPlainText(state, RESTAURANTS);
  assert.ok(text.includes('想去的，照順序：黑市shabu 竹圍店、品味牛排餐酒館'));
  assert.ok(text.includes('處女座分數：80'));
  assert.ok(text.includes('累的時候：安靜陪著就好，不用講話'));
  assert.ok(text.includes('最珍貴的回憶：最近這一年'));
  assert.ok(text.includes('第一次見面：桌遊店'));
});

test('buildPlainText 跳過沒作答的項目', () => {
  const text = buildPlainText(state, RESTAURANTS);
  assert.ok(!text.includes('一直想做的事'));
  assert.ok(!text.includes('你覺得我'));
});

test('buildPlainText 在完全沒作答時給一句話而不是空字串', () => {
  const text = buildPlainText({ about: {}, deeper: {}, memories: {}, dinner: {} }, RESTAURANTS);
  assert.ok(text.length > 0);
});
