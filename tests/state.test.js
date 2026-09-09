import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, setAnswer, saveState, loadState, clearState, STORAGE_KEY } from '../src/js/state.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, v); },
    removeItem: (k) => { map.delete(k); },
  };
}

test('createState 回傳四個空區段', () => {
  assert.deepEqual(createState(), { about: {}, deeper: {}, memories: {}, dinner: {} });
});

test('setAnswer 寫入指定區段且不改動原物件', () => {
  const before = createState();
  const after = setAnswer(before, 'about', 'q2', 80);
  assert.equal(after.about.q2, 80);
  assert.deepEqual(before.about, {});
});

test('setAnswer 寫入不同區段互不影響', () => {
  let state = setAnswer(createState(), 'deeper', 'd1', '安靜陪著就好，不用講話');
  state = setAnswer(state, 'dinner', 'first', 'lavilla');
  assert.equal(state.deeper.d1, '安靜陪著就好，不用講話');
  assert.equal(state.dinner.first, 'lavilla');
});

test('saveState 與 loadState 可以來回', () => {
  const storage = fakeStorage();
  const state = setAnswer(createState(), 'dinner', 'first', 'lavilla');
  assert.equal(saveState(state, storage), true);
  assert.deepEqual(loadState(storage), state);
});

test('loadState 沒有資料時回傳 null', () => {
  assert.equal(loadState(fakeStorage()), null);
});

test('loadState 遇到壞掉的 JSON 回傳 null 而不拋錯', () => {
  assert.equal(loadState(fakeStorage({ [STORAGE_KEY]: '{壞掉' })), null);
});

test('loadState 會把舊版缺少的區段補齊', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ about: { q2: 70 } }) });
  const loaded = loadState(storage);
  assert.equal(loaded.about.q2, 70);
  assert.deepEqual(loaded.deeper, {});
  assert.deepEqual(loaded.memories, {});
  assert.deepEqual(loaded.dinner, {});
});

test('saveState 在 storage 拋錯時回傳 false', () => {
  const broken = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  assert.equal(saveState(createState(), broken), false);
});

test('clearState 移除資料', () => {
  const storage = fakeStorage();
  saveState(createState(), storage);
  clearState(storage);
  assert.equal(loadState(storage), null);
});
