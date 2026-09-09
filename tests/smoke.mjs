// 端到端煙霧測試。用最小的 DOM 模擬，在 Node 裡把整個流程從封面點到送出，
// 確認沒有執行期錯誤，而且送出的內容正確。
// 用法：node tests/smoke.mjs
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'js');
const load = (name) => import(pathToFileURL(join(SRC, name)).href);

class ClassList {
  constructor(node) { this.node = node; this.set = new Set(); }
  add(c) { this.set.add(c); this.sync(); }
  toggle(c, on) { if (on) this.set.add(c); else this.set.delete(c); this.sync(); }
  contains(c) { return this.set.has(c); }
  sync() { this.node._class = [...this.set].join(' '); }
}

class Node {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.attrs = {};
    this.classList = new ClassList(this);
    this._text = '';
    this._class = '';
  }
  set className(v) { this._class = v; this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return this._class; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text; }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  set href(v) { this.attrs.href = String(v); }
  get href() { return this.attrs.href; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  append(...nodes) { for (const n of nodes) if (n) this.children.push(n); }
  insertBefore(node, ref) {
    const i = this.children.indexOf(ref);
    if (i < 0) this.children.push(node); else this.children.splice(i, 0, node);
  }
  select() {}
  getContext() {
    return {
      setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
      globalAlpha: 1, strokeStyle: '', lineWidth: 1, lineJoin: '', lineCap: '', shadowColor: '', shadowBlur: 0,
    };
  }
  click() { for (const fn of this.listeners.click || []) fn(); }
  querySelector(sel) {
    const want = sel.replace('.', '');
    for (const n of this.walk()) if (n.classList.contains(want) || n.tag === sel) return n;
    return null;
  }
  *walk() { for (const c of this.children) { yield c; yield* c.walk(); } }
}

const app = new Node('main');
globalThis.document = {
  createElement: (t) => new Node(t),
  createElementNS: (ns, t) => new Node(t),
  getElementById: () => app,
  documentElement: new Node('html'),
};
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' });
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: async () => {} } },
  configurable: true,
});

const store = new Map();
globalThis.window = {
  devicePixelRatio: 2,
  matchMedia: () => ({ matches: true }),
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  },
};

let sent = null;
globalThis.fetch = async (url, opts) => {
  sent = { url, body: JSON.parse(opts.body) };
  return { ok: true, status: 200 };
};

const { startFlow } = await load('flow.js');
const { createState } = await load('state.js');

function findButton(label) {
  for (const n of app.walk()) if (n.tag === 'button' && n.textContent === label) return n;
  return null;
}
function findOption(label) {
  for (const n of app.walk()) {
    if (n.tag !== 'button' || !n.classList.contains('opt')) continue;
    if (n.textContent === label) return n;
    for (const c of n.walk()) if (c.textContent === label) return n;
  }
  return null;
}
function press(label) {
  const b = findButton(label);
  if (!b) throw new Error(`找不到按鈕：${label}`);
  b.click();
}
function pick(label) {
  const b = findOption(label);
  if (!b) throw new Error(`找不到選項：${label}`);
  b.click();
}

const done = [];
const step = (name, fn) => { fn(); done.push(name); };

startFlow(app, createState());

step('q1 完美的一天', () => { pick('跟喜歡的人待在一起，做什麼都好'); press('下一題'); });
step('q2 處女座滑桿', () => { press('好'); press('下一題'); });
step('q3 想要的能力', () => { pick('看穿別人心裡在想什麼'); press('下一題'); });
step('q4 最近的小事', () => { press('好'); press('下一題'); });
step('q5 送禮', () => { pick('看得出你有在想我'); press('好了'); });

step('d1 累的時候', () => { pick('安靜陪著就好，不用講話'); press('下一題'); });
step('d2 一直想做的事', () => { pick('有，在等一個人一起'); press('下一題'); });
step('d3 最珍貴的回憶', () => { pick('最近這一年'); press('下一題'); });
step('d4 你覺得我', () => { pick('話不多，但講了就會做'); press('好了'); });

step('s1 桌遊店', () => { pick('桌遊店'); press('好'); press('下一顆'); });
step('s2 蛋糕', () => { press('好'); press('下一顆'); });
step('s3 幾次煙火', () => { pick('兩次'); press('好'); press('下一顆'); });
step('s4 哪兩個地方', () => { pick('大稻埕'); pick('淡水'); press('好'); press('下一顆'); });
step('s5 現在', () => { press('嗯'); });

await new Promise((r) => setTimeout(r, 800));

step('選餐廳並排序', () => {
  const links = [...app.walk()].filter((n) => n.tag === 'a' && n.classList.contains('opt-link'));
  if (links.length !== 4) throw new Error(`地圖連結應該有四個，實際 ${links.length} 個`);
  if (!links[0].attrs.href.startsWith('https://www.google.com/maps/')) throw new Error('地圖連結網址不對');
  pick('黑市shabu 竹圍店');
  pick('品味牛排餐酒館');
  press('看結果');
});

const submit = findButton('送出');
if (!submit) throw new Error('結果頁沒有送出按鈕');

const heartBeforeSubmit = [...app.walk()].some((n) => n.classList.contains('heart-plot'));
if (!heartBeforeSubmit) throw new Error('結果頁上沒有心形線');
submit.click();
await new Promise((r) => setTimeout(r, 50));

if (!sent) throw new Error('沒有送出任何資料');

console.log('走完的關卡：', done.length);
console.log('送出網址：', sent.url);
console.log('主旨：', sent.body._subject);
console.log('餐廳排序：', sent.body.dinner.ranked.join(' → '));
console.log('深入題：', Object.entries(sent.body.deeper).map(([k, v]) => `${k}=${v}`).join('｜'));
console.log('回憶答對：', ['s1', 's3', 's4'].map((k) => `${k}=${sent.body.memories[`${k}Correct`]}`).join('｜'));

const heartAfterSubmit = [...app.walk()].some((n) => n.classList.contains('heart-plot'));
if (!heartAfterSubmit) throw new Error('送出成功後心形線不見了');
console.log('心形線：結果頁與送出後都在');
console.log('餐廳地圖連結：四個');

console.log('SMOKE OK');
