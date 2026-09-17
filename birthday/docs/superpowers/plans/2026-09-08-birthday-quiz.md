# 生日測驗網頁 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出一個純靜態的手機網頁測驗，讓對方回答興趣、挑選慶生餐廳、走過共同回憶，最後把答案寄到作者的 Gmail 並產出一張可截圖的結果卡。

**Architecture:** 單頁應用，瀏覽器原生 ES modules，沒有打包工具也沒有執行期依賴。純邏輯（狀態、送出內容、結果卡文案）與畫面操作徹底分離，前者用 Node 內建測試執行器驗證，後者用手動清單驗證。答案即時寫入 localStorage，最後一頁 POST 到 Formspree。

**Tech Stack:** HTML、CSS、原生 JavaScript（ES modules）、Node 內建 test runner、Formspree、Netlify Drop

**Spec:** `docs/superpowers/specs/2026-09-08-birthday-quiz-design.md`

## Global Constraints

每個任務的要求都隱含包含這一節。

- 純靜態網頁，零執行期依賴，不使用打包工具或框架
- 瀏覽器原生 ES modules，`index.html` 用 `<script type="module">` 載入
- Formspree endpoint：`https://formspree.io/f/YOUR_FORM_ID`
- localStorage key：`special-website-v1`
- 內文與輸入框字級不小於 `16px`（輸入框低於此值，iOS Safari 聚焦時會自動放大整頁）
- 可點擊元素的觸控範圍不小於 `44px × 44px`
- 全螢幕高度一律用 `100dvh`，不用 `100vh`
- 色票：夜空底 `#0B1026`、次層底 `#141B3D`、星光金 `#F0DFB8`、柔粉 `#E9A8BC`、主文字 `#F7F5F0`、次文字 `#A8B0C8`
- 字體：標題 `Noto Serif TC`、內文 `Noto Sans TC`，用 Google Fonts 載入並加 `font-display: swap`，必須設定系統字體備援
- 不使用任何點陣圖，全站資源總量控制在 200KB 以內
- 轉場一律在 `300ms` 以內，並在 `prefers-reduced-motion: reduce` 下降級為純淡入淡出
- 所有面向使用者的中文字串集中在 `src/data/`，程式邏輯檔案內不得寫死文案
- 她的名字尚未提供，一律透過 `src/data/copy.js` 的 `HER_NAME` 常數引用，暫填 `{{HER_NAME}}`
- 測試指令：`node --test tests/*.test.js`
- 每個任務結束時 commit

---

### Task 1: 專案骨架與星空背景

**Files:**
- Create: `index.html`
- Create: `src/styles/base.css`
- Create: `src/styles/starfield.css`
- Create: `src/data/copy.js`
- Create: `src/js/main.js`

**Interfaces:**
- Consumes: 無
- Produces: `copy.js` 匯出 `HER_NAME: string`、`COVER: { title: string, subtitle: string, button: string }`；`index.html` 提供 `<main id="app">` 作為所有後續畫面的掛載點

- [ ] **Step 1: 建立 `index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>給你的一點小心思</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="src/styles/base.css">
<link rel="stylesheet" href="src/styles/starfield.css">
</head>
<body>
<div class="starfield" aria-hidden="true"></div>
<main id="app"></main>
<script type="module" src="src/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: 建立 `src/styles/base.css`**

```css
:root {
  --night: #0B1026;
  --night-2: #141B3D;
  --gold: #F0DFB8;
  --rose: #E9A8BC;
  --ink: #F7F5F0;
  --ink-dim: #A8B0C8;
  --radius: 24px;
  --serif: "Noto Serif TC", "PingFang TC", "Microsoft JhengHei", serif;
  --sans: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { min-height: 100dvh; }
body {
  background: var(--night);
  color: var(--ink);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-text-size-adjust: 100%;
}
#app {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  max-width: 34rem;
  margin: 0 auto;
  padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  justify-content: center;
}
h1, h2 { font-family: var(--serif); font-weight: 700; line-height: 1.4; }
button, input, textarea { font: inherit; font-size: 16px; color: inherit; }
button { min-height: 44px; min-width: 44px; cursor: pointer; border: 0; background: none; }
.btn-primary {
  background: var(--gold);
  color: var(--night);
  border-radius: 999px;
  padding: 0.75rem 2rem;
  font-weight: 500;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: 建立 `src/styles/starfield.css`**

星點用 `radial-gradient` 疊出來，不畫圖也不用 canvas。

```css
.starfield {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(1.5px 1.5px at 12% 18%, var(--gold), transparent),
    radial-gradient(1.5px 1.5px at 68% 12%, var(--ink), transparent),
    radial-gradient(1px 1px at 32% 46%, var(--gold), transparent),
    radial-gradient(1.5px 1.5px at 84% 58%, var(--ink), transparent),
    radial-gradient(1px 1px at 22% 76%, var(--gold), transparent),
    radial-gradient(1.5px 1.5px at 56% 88%, var(--ink), transparent),
    radial-gradient(1px 1px at 92% 34%, var(--gold), transparent),
    radial-gradient(circle at 50% 0%, var(--night-2), var(--night) 60%);
  animation: twinkle 6s ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}
```

- [ ] **Step 4: 建立 `src/data/copy.js`**

```js
export const HER_NAME = '{{HER_NAME}}';

export const COVER = {
  title: `給 ${HER_NAME} 的一點小心思`,
  subtitle: '有幾個問題，想好好認識你。大概五分鐘。',
  button: '開始',
};
```

- [ ] **Step 5: 建立 `src/js/main.js`，先只渲染封面**

```js
import { COVER } from '../data/copy.js';

const app = document.getElementById('app');

function renderCover() {
  app.innerHTML = '';
  const h1 = document.createElement('h1');
  h1.textContent = COVER.title;
  const p = document.createElement('p');
  p.textContent = COVER.subtitle;
  p.style.color = 'var(--ink-dim)';
  p.style.margin = '1rem 0 2rem';
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.textContent = COVER.button;
  app.append(h1, p, btn);
}

renderCover();
```

- [ ] **Step 6: 用瀏覽器開 `index.html`，確認封面出現且背景是星空**

預期：標題、副標、金色按鈕垂直置中，背景深藍且星點會緩慢明暗變化。

- [ ] **Step 7: Commit**

```bash
git add index.html src
git commit -m "feat: 專案骨架與星空封面"
```

---

### Task 2: 答案狀態與 localStorage

**Files:**
- Create: `src/js/state.js`
- Create: `tests/state.test.js`

**Interfaces:**
- Consumes: 無
- Produces: `STORAGE_KEY: string`、`createState(): State`、`setAnswer(state, section, key, value): State`、`saveState(state, storage): boolean`、`loadState(storage): State | null`、`clearState(storage): void`
- `State` 形狀：`{ about: object, memories: object, dinner: object, future: { picked: string[], custom: string }, message: string }`
- `section` 允許值：`'about' | 'memories' | 'dinner' | 'future' | 'message'`。當 `section` 為 `'message'` 時忽略 `key`，直接設定頂層的 `message`

- [ ] **Step 1: 寫失敗的測試 `tests/state.test.js`**

```js
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

test('createState 回傳完整的空結構', () => {
  assert.deepEqual(createState(), {
    about: {}, memories: {}, dinner: {},
    future: { picked: [], custom: '' }, message: '',
  });
});

test('setAnswer 寫入指定區段且不改動原物件', () => {
  const before = createState();
  const after = setAnswer(before, 'about', 'q3', '咖啡');
  assert.equal(after.about.q3, '咖啡');
  assert.deepEqual(before.about, {});
});

test('setAnswer 對 message 直接設定頂層欄位', () => {
  const after = setAnswer(createState(), 'message', null, '生日快樂');
  assert.equal(after.message, '生日快樂');
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

test('loadState 會把舊版缺少的欄位補齊', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ about: { q3: '茶' } }) });
  const loaded = loadState(storage);
  assert.equal(loaded.about.q3, '茶');
  assert.deepEqual(loaded.future, { picked: [], custom: '' });
  assert.equal(loaded.message, '');
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
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/state.test.js`
Expected: FAIL，錯誤訊息為找不到模組 `../src/js/state.js`

- [ ] **Step 3: 寫最小實作 `src/js/state.js`**

```js
export const STORAGE_KEY = 'special-website-v1';

export function createState() {
  return {
    about: {},
    memories: {},
    dinner: {},
    future: { picked: [], custom: '' },
    message: '',
  };
}

export function setAnswer(state, section, key, value) {
  if (section === 'message') return { ...state, message: value };
  return { ...state, [section]: { ...state[section], [key]: value } };
}

export function saveState(state, storage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const base = createState();
    return {
      ...base,
      ...parsed,
      future: { ...base.future, ...(parsed.future || {}) },
    };
  } catch {
    return null;
  }
}

export function clearState(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // 無痕模式可能整個 storage 都不能用，忽略即可
  }
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/state.test.js`
Expected: PASS，九個測試全綠

- [ ] **Step 5: Commit**

```bash
git add src/js/state.js tests/state.test.js
git commit -m "feat: 答案狀態與 localStorage 存取"
```

---

### Task 3: 題目資料與卡片渲染

**Files:**
- Create: `src/data/questions.js`
- Create: `src/styles/card.css`
- Create: `src/js/render.js`
- Modify: `index.html`（加入 `card.css`）

**Interfaces:**
- Consumes: 無
- Produces:
  - `questions.js` 匯出 `ABOUT_QUESTIONS: Question[]`
  - `Question` 形狀：`{ id: string, type: 'single' | 'multi' | 'slider' | 'text', prompt: string, options?: string[], allowOther?: boolean, min?: number, max?: number, minLabel?: string, maxLabel?: string, placeholder?: string }`
  - `render.js` 匯出 `renderQuestion(question, currentValue, onChange): HTMLElement` 與 `renderCardShell(title, bodyEl, footerEl): HTMLElement`
  - `onChange(value)` 的 value 型別：single 與 text 為 `string`，multi 為 `string[]`，slider 為 `number`

- [ ] **Step 1: 建立 `src/data/questions.js`**

```js
export const ABOUT_QUESTIONS = [
  {
    id: 'q1', type: 'single',
    prompt: '先問個簡單的。禮拜五下班之後，你最想做什麼？',
    options: ['回家躺平，什麼都不想', '出去走走，隨便晃晃', '找人吃飯聊天', '看當天心情'],
  },
  {
    id: 'q2', type: 'multi', allowOther: true,
    prompt: '最近有什麼是你一忙完就會想打開的？',
    options: ['追劇', '音樂', '遊戲', '逛街看東西', '睡覺'],
  },
  {
    id: 'q3', type: 'single',
    prompt: '咖啡還是茶？',
    options: ['咖啡', '茶', '都喝', '都不太喝'],
  },
  {
    id: 'q4', type: 'slider',
    prompt: '你覺得自己有多處女座？',
    min: 0, max: 100, minLabel: '完全不像', maxLabel: '本人認證',
  },
  {
    id: 'q5', type: 'text',
    prompt: '最近有沒有什麼小事，讓你覺得今天還不錯？',
    placeholder: '沒有也沒關係，跳過就好',
  },
  {
    id: 'q6', type: 'single',
    prompt: '如果有人要送你東西，你比較希望是？',
    options: ['實用的，用得到最重要', '看得出他有在想我', '驚喜的，我不想先知道', '什麼都好，心意最重要'],
  },
];
```

- [ ] **Step 2: 建立 `src/styles/card.css`**

```css
.card {
  background: rgba(20, 27, 61, 0.72);
  border: 1px solid rgba(240, 223, 184, 0.18);
  border-radius: var(--radius);
  padding: 1.75rem 1.25rem;
  backdrop-filter: blur(12px);
  animation: card-in 280ms ease-out;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
.card h2 { font-size: 1.25rem; margin-bottom: 1.25rem; }
.opt {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.85rem 1rem;
  margin-bottom: 0.6rem;
  border-radius: 14px;
  border: 1px solid rgba(240, 223, 184, 0.22);
  background: rgba(11, 16, 38, 0.5);
  transition: border-color 200ms, background 200ms;
}
.opt[aria-pressed="true"] {
  border-color: var(--gold);
  background: rgba(240, 223, 184, 0.14);
}
.card textarea, .card input[type="text"] {
  width: 100%;
  min-height: 44px;
  padding: 0.75rem;
  border-radius: 14px;
  border: 1px solid rgba(240, 223, 184, 0.22);
  background: rgba(11, 16, 38, 0.5);
}
.card textarea { min-height: 6rem; resize: vertical; }
.slider-row { display: flex; justify-content: space-between; color: var(--ink-dim); font-size: 0.875rem; }
.card input[type="range"] { width: 100%; height: 44px; accent-color: var(--rose); }
.card-footer { margin-top: 1.5rem; display: flex; justify-content: flex-end; }
```

- [ ] **Step 3: 建立 `src/js/render.js`**

```js
export function renderCardShell(title, bodyEl, footerEl) {
  const card = document.createElement('section');
  card.className = 'card';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  card.append(h2, bodyEl);
  if (footerEl) card.append(footerEl);
  return card;
}

function optionButton(label, pressed, onClick) {
  const btn = document.createElement('button');
  btn.className = 'opt';
  btn.type = 'button';
  btn.textContent = label;
  btn.setAttribute('aria-pressed', String(pressed));
  btn.addEventListener('click', onClick);
  return btn;
}

export function renderQuestion(question, currentValue, onChange) {
  const body = document.createElement('div');

  if (question.type === 'single') {
    for (const label of question.options) {
      body.append(optionButton(label, currentValue === label, () => onChange(label)));
    }
  }

  if (question.type === 'multi') {
    const picked = Array.isArray(currentValue) ? [...currentValue] : [];
    const redraw = () => {
      body.innerHTML = '';
      for (const label of question.options) {
        body.append(optionButton(label, picked.includes(label), () => {
          const i = picked.indexOf(label);
          if (i >= 0) picked.splice(i, 1); else picked.push(label);
          onChange([...picked]);
          redraw();
        }));
      }
      if (question.allowOther) {
        const other = document.createElement('input');
        other.type = 'text';
        other.placeholder = '其他，自己寫';
        const existing = picked.find((p) => !question.options.includes(p));
        if (existing) other.value = existing;
        other.addEventListener('input', () => {
          const kept = picked.filter((p) => question.options.includes(p));
          const next = other.value.trim() ? [...kept, other.value.trim()] : kept;
          picked.length = 0;
          picked.push(...next);
          onChange([...picked]);
        });
        body.append(other);
      }
    };
    redraw();
  }

  if (question.type === 'slider') {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(question.min);
    input.max = String(question.max);
    input.value = String(typeof currentValue === 'number' ? currentValue : 50);
    input.addEventListener('input', () => onChange(Number(input.value)));
    const row = document.createElement('div');
    row.className = 'slider-row';
    const lo = document.createElement('span');
    lo.textContent = question.minLabel;
    const hi = document.createElement('span');
    hi.textContent = question.maxLabel;
    row.append(lo, hi);
    body.append(input, row);
  }

  if (question.type === 'text') {
    const ta = document.createElement('textarea');
    ta.placeholder = question.placeholder || '';
    ta.value = typeof currentValue === 'string' ? currentValue : '';
    ta.addEventListener('input', () => onChange(ta.value));
    body.append(ta);
  }

  return renderCardShell(question.prompt, body);
}
```

- [ ] **Step 4: 在 `index.html` 的 `starfield.css` 後面加入 card.css**

```html
<link rel="stylesheet" href="src/styles/card.css">
```

- [ ] **Step 5: 手動驗證**

暫時把 `main.js` 的 `renderCover()` 換成渲染 `ABOUT_QUESTIONS[1]`（複選題），在瀏覽器確認：選項可以多選、再點一次會取消、「其他」輸入框打字後不會清掉已選項目。驗證完把 `main.js` 改回 `renderCover()`。

- [ ] **Step 6: Commit**

```bash
git add src index.html
git commit -m "feat: 題目資料與四種題型的卡片渲染"
```

---

### Task 4: 星圖進度與章節流程

**Files:**
- Create: `src/js/starmap.js`
- Create: `src/js/flow.js`
- Modify: `src/js/main.js`
- Modify: `index.html`（加入 `starmap.css`）
- Create: `src/styles/starmap.css`

**Interfaces:**
- Consumes: `state.js` 的 `createState/setAnswer/saveState/loadState`、`render.js` 的 `renderQuestion`、`questions.js` 的 `ABOUT_QUESTIONS`
- Produces:
  - `starmap.js` 匯出 `createStarmap(total): { el: HTMLElement, light(n: number): void, connect(): void }`
  - `flow.js` 匯出 `startFlow(app, initialState): void`，內部維護目前章節索引，並在每次作答後呼叫 `saveState`

- [ ] **Step 1: 建立 `src/styles/starmap.css`**

```css
.starmap { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; }
.starmap-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(240, 223, 184, 0.22);
  transition: background 260ms, box-shadow 260ms;
}
.starmap-dot.lit {
  background: var(--gold);
  box-shadow: 0 0 10px rgba(240, 223, 184, 0.8);
}
.starmap.connected { position: relative; }
.starmap.connected::after {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold), transparent);
  animation: line-in 300ms ease-out;
}
@keyframes line-in { from { opacity: 0; } to { opacity: 1; } }
```

- [ ] **Step 2: 建立 `src/js/starmap.js`**

```js
export function createStarmap(total) {
  const el = document.createElement('div');
  el.className = 'starmap';
  el.setAttribute('aria-hidden', 'true');
  const dots = [];
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'starmap-dot';
    dots.push(dot);
    el.append(dot);
  }
  return {
    el,
    light(n) {
      dots.forEach((dot, i) => dot.classList.toggle('lit', i < n));
    },
    connect() {
      el.classList.add('connected');
    },
  };
}
```

- [ ] **Step 3: 建立 `src/js/flow.js`**

先只跑第一章，後續任務會把其他章節接進 `SECTIONS`。

```js
import { setAnswer, saveState } from './state.js';
import { renderQuestion } from './render.js';
import { createStarmap } from './starmap.js';
import { ABOUT_QUESTIONS } from '../data/questions.js';

export function startFlow(app, initialState) {
  let state = initialState;
  let index = 0;
  const starmap = createStarmap(ABOUT_QUESTIONS.length);

  function commit(value) {
    const q = ABOUT_QUESTIONS[index];
    state = setAnswer(state, 'about', q.id, value);
    saveState(state, window.localStorage);
  }

  function draw() {
    const q = ABOUT_QUESTIONS[index];
    app.innerHTML = '';
    starmap.light(index);
    const card = renderQuestion(q, state.about[q.id], commit);

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.textContent = index === ABOUT_QUESTIONS.length - 1 ? '好了' : '下一題';
    next.addEventListener('click', () => {
      if (index < ABOUT_QUESTIONS.length - 1) {
        index += 1;
        draw();
      } else {
        starmap.light(ABOUT_QUESTIONS.length);
        starmap.connect();
      }
    });
    footer.append(next);
    card.append(footer);

    app.append(starmap.el, card);
  }

  draw();
}
```

- [ ] **Step 4: 改寫 `src/js/main.js` 串接封面與流程**

```js
import { COVER } from '../data/copy.js';
import { createState, loadState } from './state.js';
import { startFlow } from './flow.js';

const app = document.getElementById('app');

function renderCover() {
  app.innerHTML = '';
  const h1 = document.createElement('h1');
  h1.textContent = COVER.title;
  const p = document.createElement('p');
  p.textContent = COVER.subtitle;
  p.style.color = 'var(--ink-dim)';
  p.style.margin = '1rem 0 2rem';
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.textContent = COVER.button;
  btn.addEventListener('click', () => {
    startFlow(app, loadState(window.localStorage) || createState());
  });
  app.append(h1, p, btn);
}

renderCover();
```

- [ ] **Step 5: 手動驗證**

瀏覽器開啟，按開始後應能逐題前進，星點依序點亮，最後一題按「好了」會把星點全亮並畫出連線。重新整理頁面再按開始，先前的答案應該還在。

- [ ] **Step 6: Commit**

```bash
git add src index.html
git commit -m "feat: 星圖進度與第一章流程"
```

---

### Task 5: 回憶星圖過場

**Files:**
- Create: `src/data/memories.js`
- Modify: `src/js/flow.js`

**Interfaces:**
- Consumes: Task 4 的 `startFlow` 內部結構
- Produces:
  - `memories.js` 匯出 `MEMORY_INTRO: string`、`MEMORIES: Memory[]`
  - `Memory` 形狀：`{ id: string, type: 'single' | 'multi' | 'text' | 'none', prompt?: string, options?: string[], correct?: string | string[], onCorrect?: string, onWrong?: string, reply?: string }`
  - `type: 'none'` 代表不設題，只顯示 `reply`
  - flow 寫入 state 的 memories 區段，鍵為 `id` 與 `${id}Correct`

- [ ] **Step 1: 建立 `src/data/memories.js`**

```js
export const MEMORY_INTRO = '在問接下來的事情之前，先陪我看幾顆星。';

export const MEMORIES = [
  {
    id: 's1', type: 'single',
    prompt: '我們第一次見面，是在做什麼？',
    options: ['桌遊店', '看電影', '吃飯', '走走逛逛'],
    correct: '桌遊店',
    onCorrect: '對，桌遊店。四月底。那天我就覺得，你跟我遇過的人都不一樣。',
    onWrong: '是桌遊店喔。四月底。不過沒關係，那天我記得就好。',
  },
  {
    id: 's2', type: 'text',
    prompt: '後來我們去吃了蛋糕。你還記得那是什麼樣子嗎？',
    reply: '不管你寫了什麼，我記得的是你當時的表情。',
  },
  {
    id: 's3', type: 'single',
    prompt: '我們一起看過幾次煙火？',
    options: ['一次', '兩次', '三次', '想不起來了'],
    correct: '兩次',
    onCorrect: '兩次。大稻埕，還有淡水。',
    onWrong: '是兩次。大稻埕，還有淡水。',
  },
  {
    id: 's4', type: 'multi',
    prompt: '是哪兩個地方？',
    options: ['大稻埕', '淡水', '基隆', '新竹'],
    correct: ['大稻埕', '淡水'],
    onCorrect: '大稻埕的人好多，淡水的風好大。可是我兩次都記得很清楚。',
    onWrong: '是大稻埕跟淡水。人好多，風好大。可是我兩次都記得很清楚。',
  },
  {
    id: 's5', type: 'none',
    reply: '後來每次看到有趣的活動，我第一個想到的都是你。想著，以後可以一起去。',
  },
];
```

- [ ] **Step 2: 在 `flow.js` 加入答案比對函式**

放在檔案上方，`startFlow` 之外。

```js
function isCorrect(memory, value) {
  if (!memory.correct) return null;
  if (Array.isArray(memory.correct)) {
    const got = Array.isArray(value) ? [...value].sort() : [];
    const want = [...memory.correct].sort();
    return got.length === want.length && got.every((v, i) => v === want[i]);
  }
  return value === memory.correct;
}
```

- [ ] **Step 3: 在 `flow.js` 加入回憶章節的繪製**

`ABOUT_QUESTIONS` 跑完後改為呼叫 `drawMemory(0)` 而不是只點亮星圖。

```js
function drawMemory(mIndex) {
  const m = MEMORIES[mIndex];
  const memoryMap = createStarmap(MEMORIES.length);
  memoryMap.light(mIndex);
  app.innerHTML = '';

  if (m.type === 'none') {
    const card = renderCardShell(MEMORY_INTRO, replyBlock(m.reply));
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.textContent = '嗯';
    next.addEventListener('click', () => {
      memoryMap.light(MEMORIES.length);
      memoryMap.connect();
      setTimeout(startDinner, 700);
    });
    footer.append(next);
    card.append(footer);
    app.append(memoryMap.el, card);
    return;
  }

  let answered = false;
  const card = renderQuestion(m, state.memories[m.id], (value) => {
    state = setAnswer(state, 'memories', m.id, value);
    const ok = isCorrect(m, value);
    if (ok !== null) state = setAnswer(state, 'memories', `${m.id}Correct`, ok);
    saveState(state, window.localStorage);
  });

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const next = document.createElement('button');
  next.className = 'btn-primary';
  next.textContent = '好';
  next.addEventListener('click', () => {
    if (!answered) {
      answered = true;
      const ok = state.memories[`${m.id}Correct`];
      const text = m.reply || (ok ? m.onCorrect : m.onWrong);
      card.insertBefore(replyBlock(text), footer);
      next.textContent = '下一顆';
      return;
    }
    if (mIndex < MEMORIES.length - 1) drawMemory(mIndex + 1);
  });
  footer.append(next);
  card.append(footer);
  app.append(memoryMap.el, card);
}
```

- [ ] **Step 4: 加入 `replyBlock` 輔助函式**

```js
function replyBlock(text) {
  const p = document.createElement('p');
  p.textContent = text;
  p.style.cssText = 'margin-top:1.25rem;color:var(--gold);font-family:var(--serif);line-height:1.9;';
  return p;
}
```

- [ ] **Step 5: 補上 import 與 `startDinner` 的暫時佔位**

`flow.js` 頂端加入：

```js
import { renderQuestion, renderCardShell } from './render.js';
import { MEMORY_INTRO, MEMORIES } from '../data/memories.js';
```

`startDinner` 在 Task 6 才實作，這一步先寫成 `function startDinner() { app.textContent = '下一章'; }`，Task 6 會取代它。

- [ ] **Step 6: 手動驗證**

第一章跑完後應進入回憶段。答完第一顆星按「好」，作者的話會浮出來，按鈕變成「下一顆」。第二顆是自由輸入，答什麼都給同一句回應。第五顆沒有題目，按「嗯」之後星圖連線。

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "feat: 回憶星圖過場與答案比對"
```

---

### Task 6: 生日餐桌章節

**Files:**
- Create: `src/data/restaurants.js`
- Modify: `src/js/flow.js`（取代 Task 5 的 `startDinner` 佔位）

**Interfaces:**
- Consumes: `render.js`、`state.js`
- Produces:
  - `restaurants.js` 匯出 `DINNER_INTRO: string`、`RESTAURANTS: Restaurant[]`、`DINNER_QUESTIONS: Question[]`
  - `Restaurant` 形狀：`{ id: string, name: string, area: string, kind: string, price: string, why: string }`
  - flow 寫入 state 的 dinner 區段，鍵為 `first`（餐廳 id）、`second`（餐廳 id）、`r3`、`r4`、`r5`

- [ ] **Step 1: 建立 `src/data/restaurants.js`**

```js
export const DINNER_INTRO = '所以，講正事。你生日快到了，我想帶你去吃一頓。';

export const RESTAURANTS = [
  { id: 'kimchunhee', name: '金春喜韓廚 竹圍店', area: '竹圍站旁', kind: '韓式湯飯', price: '平價',
    why: '離我們熟悉的地方最近，小菜白飯霜淇淋無限續，可以慢慢吃慢慢聊' },
  { id: 'gwangju', name: '光州神仙爐', area: '竹圍站走三分鐘', kind: '韓式鍋物', price: '平價',
    why: '上班族的晚餐首選，個人小鍋，輕鬆不趕' },
  { id: 'zhijian', name: '之間 茶食器', area: '淡水老街尾端', kind: '創意蔬食', price: '中價',
    why: '裝潢很有味道，義大利麵燉飯披薩都有，適合好好講話' },
  { id: 'memory', name: '時光樹影 Memory', area: '淡水中正路，河岸第一排', kind: '景觀西餐', price: '中價',
    why: '就在河邊，晚上看得到河景，主餐可以加價升級套餐' },
  { id: 'lavilla', name: 'LA VILLA DANSHUI', area: '淡水海關碼頭旁', kind: '義法餐酒館', price: '中高價',
    why: '這間最有慶生的感覺，套餐制，坐得比較久' },
  { id: 'anywhere', name: '都可以，你決定就好', area: '', kind: '', price: '',
    why: '如果你真的沒特別想法，那就交給我' },
];

export const DINNER_QUESTIONS = [
  { id: 'r3', type: 'single', prompt: '禮拜五下班後，你大概幾點方便？',
    options: ['六點半前', '七點左右', '七點半以後', '都可以，看你安排'] },
  { id: 'r4', type: 'single', prompt: '要不要蛋糕？',
    options: ['要，蛋糕是重點', '不用，吃飽比較實在', '你決定，我喜歡驚喜'] },
  { id: 'r5', type: 'single', prompt: '你想要安靜一點，還是熱鬧一點？',
    options: ['安靜，可以好好講話', '熱鬧，有氣氛比較開心', '都行'] },
];
```

- [ ] **Step 2: 在 `flow.js` 加入餐廳卡片渲染**

```js
function restaurantPicker(title, selectedId, onPick) {
  const body = document.createElement('div');
  for (const r of RESTAURANTS) {
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(selectedId === r.id));
    const name = document.createElement('strong');
    name.textContent = r.name;
    name.style.display = 'block';
    const meta = document.createElement('span');
    meta.style.cssText = 'display:block;color:var(--ink-dim);font-size:0.875rem;';
    meta.textContent = [r.area, r.kind, r.price].filter(Boolean).join(' · ');
    const why = document.createElement('span');
    why.style.cssText = 'display:block;margin-top:0.35rem;font-size:0.9375rem;';
    why.textContent = r.why;
    btn.append(name, meta, why);
    btn.addEventListener('click', () => onPick(r.id));
    body.append(btn);
  }
  return renderCardShell(title, body);
}
```

- [ ] **Step 3: 用真正的實作取代 `startDinner` 佔位**

```js
function startDinner() {
  const steps = [
    { key: 'first', title: DINNER_INTRO },
    { key: 'second', title: '如果第一間訂不到，你的第二個選擇是？' },
    ...DINNER_QUESTIONS.map((q) => ({ key: q.id, question: q })),
  ];
  let sIndex = 0;

  function drawDinner() {
    const step = steps[sIndex];
    app.innerHTML = '';
    const card = step.question
      ? renderQuestion(step.question, state.dinner[step.key], (v) => {
          state = setAnswer(state, 'dinner', step.key, v);
          saveState(state, window.localStorage);
        })
      : restaurantPicker(step.title, state.dinner[step.key], (id) => {
          state = setAnswer(state, 'dinner', step.key, id);
          saveState(state, window.localStorage);
          drawDinner();
        });

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.textContent = sIndex === steps.length - 1 ? '好了' : '下一題';
    next.addEventListener('click', () => {
      if (sIndex < steps.length - 1) {
        sIndex += 1;
        drawDinner();
      } else {
        startFuture();
      }
    });
    footer.append(next);
    card.append(footer);
    app.append(card);
  }

  drawDinner();
}
```

註：餐廳選擇後會 `drawDinner()` 重畫，讓已選的卡片立刻顯示金框。一般題目由 `renderQuestion` 自行處理選取狀態，不需重畫。

- [ ] **Step 4: 補 import 與 `startFuture` 暫時佔位**

```js
import { DINNER_INTRO, RESTAURANTS, DINNER_QUESTIONS } from '../data/restaurants.js';
```

`startFuture` 在 Task 7 實作，這一步先寫 `function startFuture() { app.textContent = '最後一點點'; }`。

- [ ] **Step 5: 手動驗證**

回憶段結束後應進入餐廳選擇。點一張卡會出現金框，第二志願獨立記錄，接著三題細節題。

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: 生日餐桌章節與六張餐廳卡"
```

---

### Task 7: 未來清單與留言

**Files:**
- Create: `src/data/future.js`
- Modify: `src/js/flow.js`（取代 Task 6 的 `startFuture` 佔位）

**Interfaces:**
- Consumes: `render.js`、`state.js`
- Produces:
  - `future.js` 匯出 `FUTURE_INTRO: string`、`FUTURE_QUESTION: Question`、`MESSAGE_QUESTION: Question`
  - flow 寫入 `state.future.picked: string[]`、`state.future.custom: string`、`state.message: string`

- [ ] **Step 1: 建立 `src/data/future.js`**

```js
export const FUTURE_INTRO = '最後一點點。';

export const FUTURE_QUESTION = {
  id: 'picked', type: 'multi', allowOther: true,
  prompt: '我先列了一些想跟你一起去的，你圈想去的。',
  options: ['跨年煙火', '演唱會或音樂祭', '看展', '一日小旅行', '夜衝看海', '再去一次桌遊店'],
};

export const MESSAGE_QUESTION = {
  id: 'message', type: 'text',
  prompt: '有什麼想跟我說的嗎？',
  placeholder: '不想寫也可以，直接送出就好',
};
```

- [ ] **Step 2: 用真正的實作取代 `startFuture` 佔位**

`FUTURE_QUESTION` 的 `allowOther` 會把自由輸入混進 picked 陣列。存檔時把不在選項內的那一項拆出來放 `custom`，這樣送出的資料才乾淨。

```js
function startFuture() {
  const steps = [FUTURE_QUESTION, MESSAGE_QUESTION];
  let fIndex = 0;

  function drawFuture() {
    const q = steps[fIndex];
    app.innerHTML = '';
    const intro = document.createElement('p');
    intro.textContent = FUTURE_INTRO;
    intro.style.cssText = 'color:var(--ink-dim);margin-bottom:1rem;text-align:center;';

    const current = q.id === 'message'
      ? state.message
      : [...state.future.picked, state.future.custom].filter(Boolean);

    const card = renderQuestion(q, current, (value) => {
      if (q.id === 'message') {
        state = setAnswer(state, 'message', null, value);
      } else {
        const known = FUTURE_QUESTION.options;
        const picked = value.filter((v) => known.includes(v));
        const custom = value.find((v) => !known.includes(v)) || '';
        state = { ...state, future: { picked, custom } };
      }
      saveState(state, window.localStorage);
    });

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    const next = document.createElement('button');
    next.className = 'btn-primary';
    next.textContent = fIndex === steps.length - 1 ? '看結果' : '下一題';
    next.addEventListener('click', () => {
      if (fIndex < steps.length - 1) {
        fIndex += 1;
        drawFuture();
      } else {
        showResult(app, state);
      }
    });
    footer.append(next);
    card.append(footer);
    app.append(intro, card);
  }

  drawFuture();
}
```

- [ ] **Step 3: 補 import 與 `showResult` 暫時佔位**

```js
import { FUTURE_INTRO, FUTURE_QUESTION, MESSAGE_QUESTION } from '../data/future.js';
```

`showResult` 在 Task 8 實作，這一步先寫 `function showResult() { app.textContent = '結果頁'; }`（注意：Task 8 會改成從 `result.js` import，屆時移除這個區域函式）。

- [ ] **Step 4: 手動驗證**

餐桌章節結束後出現未來清單，可複選也可自己補一項。按下一題進入留言，留白也能按「看結果」。

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: 未來清單與留言"
```

---

### Task 8: 結果卡文案與結果頁

**Files:**
- Create: `src/js/summary.js`
- Create: `tests/summary.test.js`
- Create: `src/js/result.js`
- Create: `src/styles/result.css`
- Modify: `src/js/flow.js`（改為 import `showResult`）
- Modify: `index.html`（加入 `result.css`）
- Modify: `src/data/copy.js`（加入結尾文案與時間軸標籤）

**Interfaces:**
- Consumes: `restaurants.js` 的 `RESTAURANTS`
- Produces:
  - `summary.js` 匯出 `buildPersonaLine(state): string`、`restaurantName(id, restaurants): string`、`buildTags(state): string[]`
  - `result.js` 匯出 `showResult(app, state): void`
  - `copy.js` 加入 `TIMELINE: string[]`、`CLOSING: string`、`SUBMIT_LABEL: string`、`SCREENSHOT_HINT: string`

- [ ] **Step 1: 寫失敗的測試 `tests/summary.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPersonaLine, restaurantName, buildTags } from '../src/js/summary.js';

const RESTAURANTS = [
  { id: 'lavilla', name: 'LA VILLA DANSHUI' },
  { id: 'anywhere', name: '都可以，你決定就好' },
];

test('buildPersonaLine 串起飲料、處女座分數與氣氛', () => {
  const state = { about: { q3: '咖啡', q4: 80 }, dinner: { r5: '安靜，可以好好講話' } };
  assert.equal(buildPersonaLine(state), '咖啡派，80 分的處女座，喜歡安靜一點的晚上');
});

test('buildPersonaLine 缺欄位時只串現有的部分', () => {
  assert.equal(buildPersonaLine({ about: { q3: '茶' }, dinner: {} }), '茶派');
});

test('buildPersonaLine 全部沒填時回傳空字串', () => {
  assert.equal(buildPersonaLine({ about: {}, dinner: {} }), '');
});

test('restaurantName 由 id 找出店名', () => {
  assert.equal(restaurantName('lavilla', RESTAURANTS), 'LA VILLA DANSHUI');
});

test('restaurantName 找不到時回傳還沒選', () => {
  assert.equal(restaurantName('nope', RESTAURANTS), '還沒選');
});

test('buildTags 收集時間、蛋糕、氣氛與未來清單', () => {
  const state = {
    about: {}, dinner: { r3: '七點左右', r4: '要，蛋糕是重點', r5: '都行' },
    future: { picked: ['看展'], custom: '爬山' },
  };
  assert.deepEqual(buildTags(state), ['七點左右', '要，蛋糕是重點', '都行', '看展', '爬山']);
});

test('buildTags 忽略空值', () => {
  const state = { about: {}, dinner: {}, future: { picked: [], custom: '' } };
  assert.deepEqual(buildTags(state), []);
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/summary.test.js`
Expected: FAIL，找不到模組 `../src/js/summary.js`

- [ ] **Step 3: 寫最小實作 `src/js/summary.js`**

```js
const DRINK_LABEL = {
  '咖啡': '咖啡派',
  '茶': '茶派',
  '都喝': '咖啡跟茶都行',
  '都不太喝': '這兩樣都不太碰',
};

const VIBE_LABEL = {
  '安靜，可以好好講話': '喜歡安靜一點的晚上',
  '熱鬧，有氣氛比較開心': '喜歡熱鬧一點的晚上',
  '都行': '安靜熱鬧都可以',
};

export function buildPersonaLine(state) {
  const parts = [];
  const drink = DRINK_LABEL[state.about?.q3];
  if (drink) parts.push(drink);
  if (typeof state.about?.q4 === 'number') parts.push(`${state.about.q4} 分的處女座`);
  const vibe = VIBE_LABEL[state.dinner?.r5];
  if (vibe) parts.push(vibe);
  return parts.join('，');
}

export function restaurantName(id, restaurants) {
  const found = restaurants.find((r) => r.id === id);
  return found ? found.name : '還沒選';
}

export function buildTags(state) {
  const { r3, r4, r5 } = state.dinner || {};
  const future = state.future || { picked: [], custom: '' };
  return [r3, r4, r5, ...future.picked, future.custom].filter(Boolean);
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/summary.test.js`
Expected: PASS，七個測試全綠

- [ ] **Step 5: 在 `src/data/copy.js` 加入結果頁文案**

```js
export const TIMELINE = ['四月底 桌遊店', '蛋糕', '大稻埕', '淡水', '現在', '下一顆，等你'];

export const CLOSING = `謝謝你把這些寫完。
我不太會講這種話，所以放在最後面。
認識的人不算少，但你是最特別的那一個。
禮拜五見，我會安排好。`;

export const SUBMIT_LABEL = '送出';
export const SCREENSHOT_HINT = '截圖傳給我也可以';
```

- [ ] **Step 6: 建立 `src/styles/result.css`**

結果卡要一屏截得完，所以字級與間距都收緊，並用 `--card-max` 限制寬度。

```css
.result-card {
  background: linear-gradient(160deg, rgba(20, 27, 61, 0.95), rgba(11, 16, 38, 0.95));
  border: 1px solid rgba(240, 223, 184, 0.3);
  border-radius: var(--radius);
  padding: 1.5rem 1.25rem;
  margin: 0.5rem 0 1.5rem;
}
.result-card h2 { font-size: 1.125rem; text-align: center; margin-bottom: 1rem; }
.timeline { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; margin-bottom: 1.25rem; }
.timeline span { font-size: 0.75rem; color: var(--ink-dim); }
.timeline span::after { content: ' ·'; color: rgba(240, 223, 184, 0.5); }
.timeline span:last-child { color: var(--gold); }
.timeline span:last-child::after { content: ''; }
.result-hero { text-align: center; margin-bottom: 1rem; }
.result-hero small { display: block; color: var(--ink-dim); font-size: 0.8125rem; }
.result-hero strong { font-family: var(--serif); font-size: 1.5rem; color: var(--gold); line-height: 1.4; }
.result-persona { text-align: center; font-size: 0.9375rem; margin-bottom: 1rem; }
.tags { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; }
.tags span {
  font-size: 0.8125rem;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(233, 168, 188, 0.45);
  color: var(--rose);
}
.result-date { text-align: center; color: var(--ink-dim); font-size: 0.75rem; margin-top: 1rem; }
.closing { white-space: pre-line; font-family: var(--serif); line-height: 2; text-align: center; margin-bottom: 1.5rem; }
.hint { text-align: center; color: var(--ink-dim); font-size: 0.8125rem; margin-top: 0.75rem; }
```

- [ ] **Step 7: 建立 `src/js/result.js`**

```js
import { RESTAURANTS } from '../data/restaurants.js';
import { HER_NAME, TIMELINE, CLOSING, SUBMIT_LABEL, SCREENSHOT_HINT } from '../data/copy.js';
import { buildPersonaLine, restaurantName, buildTags } from './summary.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function showResult(app, state) {
  app.innerHTML = '';

  const card = el('section', 'result-card');
  card.append(el('h2', null, `${HER_NAME} 的小檔案`));

  const timeline = el('div', 'timeline');
  for (const label of TIMELINE) timeline.append(el('span', null, label));
  card.append(timeline);

  const hero = el('div', 'result-hero');
  hero.append(el('small', null, '生日那天要去'));
  hero.append(el('strong', null, restaurantName(state.dinner.first, RESTAURANTS)));
  const second = state.dinner.second;
  if (second && second !== state.dinner.first) {
    hero.append(el('small', null, `備案 ${restaurantName(second, RESTAURANTS)}`));
  }
  card.append(hero);

  const persona = buildPersonaLine(state);
  if (persona) card.append(el('p', 'result-persona', persona));

  const tags = el('div', 'tags');
  for (const t of buildTags(state)) tags.append(el('span', null, t));
  card.append(tags);

  card.append(el('p', 'result-date', new Date().toLocaleDateString('zh-TW')));

  const closing = el('p', 'closing', CLOSING);

  const footer = el('div', 'card-footer');
  footer.style.justifyContent = 'center';
  const submit = el('button', 'btn-primary', SUBMIT_LABEL);
  footer.append(submit);

  const hint = el('p', 'hint', SCREENSHOT_HINT);

  app.append(card, closing, footer, hint);

  submit.addEventListener('click', () => {
    // Task 9 會在這裡接上送出流程
  });
}
```

- [ ] **Step 8: 在 `flow.js` 移除 `showResult` 佔位，改為 import**

```js
import { showResult } from './result.js';
```

- [ ] **Step 9: 在 `index.html` 加入 result.css**

```html
<link rel="stylesheet" href="src/styles/result.css">
```

- [ ] **Step 10: 手動驗證**

跑完全部題目，結果卡出現，餐廳名稱是整張卡最大的字，時間軸最後一項是金色的「下一顆，等你」。在手機寬度下截圖一次，確認一屏截得完。

- [ ] **Step 11: Commit**

```bash
git add src tests index.html
git commit -m "feat: 結果卡文案組裝與結果頁"
```

---

### Task 9: 送出與失敗備援

**Files:**
- Create: `src/js/payload.js`
- Create: `tests/payload.test.js`
- Create: `src/js/submit.js`
- Modify: `src/js/result.js`（接上送出）
- Modify: `src/data/copy.js`（加入送出相關文案）

**Interfaces:**
- Consumes: `summary.js` 的 `restaurantName`
- Produces:
  - `payload.js` 匯出 `FORM_ENDPOINT: string`、`buildPayload(state, now, restaurants): object`、`buildPlainText(state, restaurants): string`
  - `submit.js` 匯出 `sendAnswers(payload, fetchImpl): Promise<{ ok: boolean, error?: string }>`
  - `copy.js` 加入 `SUBMIT_SENDING`、`SUBMIT_DONE`、`SUBMIT_FAILED`、`RETRY_LABEL`、`COPY_LABEL`、`COPY_DONE`

- [ ] **Step 1: 寫失敗的測試 `tests/payload.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPayload, buildPlainText, FORM_ENDPOINT } from '../src/js/payload.js';

const RESTAURANTS = [
  { id: 'lavilla', name: 'LA VILLA DANSHUI' },
  { id: 'memory', name: '時光樹影 Memory' },
];

const state = {
  about: { q1: '找人吃飯聊天', q2: ['音樂'], q3: '咖啡', q4: 80, q5: '', q6: '看得出他有在想我' },
  memories: { s1: '桌遊店', s1Correct: true, s2: '草莓的', s3: '兩次', s3Correct: true },
  dinner: { first: 'lavilla', second: 'memory', r3: '七點左右', r4: '要，蛋糕是重點', r5: '都行' },
  future: { picked: ['看展'], custom: '' },
  message: '謝謝你',
};

test('FORM_ENDPOINT 指向正確的 Formspree 表單', () => {
  assert.equal(FORM_ENDPOINT, 'https://formspree.io/f/YOUR_FORM_ID');
});

test('buildPayload 帶上主旨與送出時間', () => {
  const p = buildPayload(state, new Date('2026-09-09T13:05:00Z'), RESTAURANTS);
  assert.equal(p._subject, '她填完了');
  assert.equal(p.submittedAt, '2026-09-09T13:05:00.000Z');
});

test('buildPayload 把餐廳 id 轉成店名', () => {
  const p = buildPayload(state, new Date(), RESTAURANTS);
  assert.equal(p.dinner.first, 'LA VILLA DANSHUI');
  assert.equal(p.dinner.second, '時光樹影 Memory');
});

test('buildPayload 保留原始答案區段', () => {
  const p = buildPayload(state, new Date(), RESTAURANTS);
  assert.equal(p.about.q3, '咖啡');
  assert.equal(p.memories.s1Correct, true);
  assert.equal(p.message, '謝謝你');
});

test('buildPlainText 產生可讀的純文字，含餐廳與留言', () => {
  const text = buildPlainText(state, RESTAURANTS);
  assert.ok(text.includes('LA VILLA DANSHUI'));
  assert.ok(text.includes('七點左右'));
  assert.ok(text.includes('謝謝你'));
});

test('buildPlainText 在答案為空時不會拋錯', () => {
  const empty = { about: {}, memories: {}, dinner: {}, future: { picked: [], custom: '' }, message: '' };
  assert.equal(typeof buildPlainText(empty, RESTAURANTS), 'string');
});
```

- [ ] **Step 2: 執行測試確認失敗**

Run: `node --test tests/payload.test.js`
Expected: FAIL，找不到模組 `../src/js/payload.js`

- [ ] **Step 3: 寫最小實作 `src/js/payload.js`**

```js
import { restaurantName } from './summary.js';

export const FORM_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

export function buildPayload(state, now, restaurants) {
  return {
    _subject: '她填完了',
    submittedAt: now.toISOString(),
    about: { ...state.about },
    memories: { ...state.memories },
    dinner: {
      ...state.dinner,
      first: restaurantName(state.dinner.first, restaurants),
      second: restaurantName(state.dinner.second, restaurants),
    },
    future: { ...state.future },
    message: state.message,
  };
}

export function buildPlainText(state, restaurants) {
  const d = state.dinner || {};
  const f = state.future || { picked: [], custom: '' };
  const lines = [
    `餐廳：${restaurantName(d.first, restaurants)}`,
    `備案：${restaurantName(d.second, restaurants)}`,
    `時間：${d.r3 || '沒填'}`,
    `蛋糕：${d.r4 || '沒填'}`,
    `氣氛：${d.r5 || '沒填'}`,
    `想一起去：${[...f.picked, f.custom].filter(Boolean).join('、') || '沒填'}`,
    `想說的話：${state.message || '沒填'}`,
  ];
  return lines.join('\n');
}
```

- [ ] **Step 4: 執行測試確認通過**

Run: `node --test tests/payload.test.js`
Expected: PASS，六個測試全綠

- [ ] **Step 5: 建立 `src/js/submit.js`**

`fetchImpl` 參數讓這個函式不綁死全域 fetch，方便日後測試。

```js
import { FORM_ENDPOINT } from './payload.js';

export async function sendAnswers(payload, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || '網路錯誤' };
  }
}
```

- [ ] **Step 6: 在 `src/data/copy.js` 加入送出文案**

```js
export const SUBMIT_SENDING = '送出中';
export const SUBMIT_DONE = '收到了。禮拜五見。';
export const SUBMIT_FAILED = '好像沒送出去。可以再試一次，或直接把答案複製起來傳給我。';
export const RETRY_LABEL = '再試一次';
export const COPY_LABEL = '複製答案';
export const COPY_DONE = '複製好了';
```

- [ ] **Step 7: 在 `result.js` 接上送出流程**

補上 import：

```js
import { buildPayload, buildPlainText } from './payload.js';
import { sendAnswers } from './submit.js';
import { SUBMIT_SENDING, SUBMIT_DONE, SUBMIT_FAILED, RETRY_LABEL, COPY_LABEL, COPY_DONE } from '../data/copy.js';
```

把 Step 7 的空 `click` 監聽器換成：

```js
  async function doSubmit() {
    submit.disabled = true;
    submit.textContent = SUBMIT_SENDING;
    const result = await sendAnswers(buildPayload(state, new Date(), RESTAURANTS));
    if (result.ok) {
      app.innerHTML = '';
      const done = el('p', 'closing', SUBMIT_DONE);
      app.append(card, done);
      return;
    }
    submit.disabled = false;
    submit.textContent = RETRY_LABEL;
    if (!document.querySelector('.fallback')) {
      const fallback = el('div', 'fallback');
      fallback.style.textAlign = 'center';
      fallback.append(el('p', 'hint', SUBMIT_FAILED));
      const copyBtn = el('button', 'btn-primary', COPY_LABEL);
      copyBtn.style.marginTop = '0.75rem';
      copyBtn.addEventListener('click', async () => {
        const text = buildPlainText(state, RESTAURANTS);
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = COPY_DONE;
        } catch {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.readOnly = true;
          ta.style.cssText = 'width:100%;min-height:10rem;margin-top:0.75rem;';
          fallback.append(ta);
          ta.select();
          copyBtn.textContent = '請長按上面的文字複製';
        }
      });
      fallback.append(copyBtn);
      app.append(fallback);
    }
  }

  submit.addEventListener('click', doSubmit);
```

註：剪貼簿 API 在部分通訊軟體的內建瀏覽器會被擋，所以失敗時退回顯示一個唯讀輸入框讓她長按複製。這一層不能省。

- [ ] **Step 8: 手動驗證送出成功**

跑完整個流程按送出，確認畫面換成結束語，並到 Gmail 確認收到主旨為「她填完了」的信，欄位可讀。

- [ ] **Step 9: 手動驗證送出失敗**

在瀏覽器開發工具把網路切成離線，再按一次送出。確認出現錯誤訊息、「再試一次」按鈕、以及「複製答案」按鈕，且複製後貼上的內容包含餐廳與留言。

- [ ] **Step 10: Commit**

```bash
git add src tests
git commit -m "feat: Formspree 送出與複製答案備援"
```

---

### Task 10: 手機驗收與上線

**Files:**
- Modify: `src/styles/base.css`（依實測結果微調）
- Create: `README.md`

**Interfaces:**
- Consumes: 前九個任務的成果
- Produces: 一個可公開存取的網址

- [ ] **Step 1: 執行全部測試**

Run: `node --test tests/*.test.js`
Expected: PASS，state、summary、payload 三組測試全綠

- [ ] **Step 2: 把 `HER_NAME` 換成真名**

修改 `src/data/copy.js` 的 `HER_NAME`。作者提供前不要上線。

- [ ] **Step 3: 部署到 Netlify Drop**

開啟 `https://app.netlify.com/drop`，把整個專案資料夾拖進去，取得公開網址。

- [ ] **Step 4: 用真手機跑完整流程**

用手機瀏覽器開啟網址，從封面走到送出。檢查：字不會太小、按鈕好按、輸入框聚焦時整頁不會被放大、捲動時沒有橫向溢出、星空動畫順暢。

- [ ] **Step 5: 在 LINE 裡點開網址跑一次**

把網址傳給自己，在 LINE 的內建瀏覽器點開，完整跑完並送出。這是最接近她真實情境的測試，也是最容易出問題的一關。

- [ ] **Step 6: 在手機上截一次結果卡**

確認一屏截得完、卡片邊界完整、餐廳名稱清楚可讀。

- [ ] **Step 7: 確認 Gmail 收到信**

檢查主旨、每個欄位、中文沒有亂碼。

- [ ] **Step 8: 測試中途離開再回來**

答到一半關掉分頁，重新開啟網址按開始，確認先前答案還在。

- [ ] **Step 9: 開啟系統的減少動態效果設定再跑一次**

iOS 在輔助使用裡叫「減少動態效果」。確認動畫降級後畫面仍可正常操作。

- [ ] **Step 10: 撰寫 `README.md`**

```markdown
# 給她的生日測驗網頁

純靜態網頁，沒有後端。答案透過 Formspree 寄到作者的 Gmail。

## 本機預覽

因為使用 ES modules，不能直接用 file:// 開啟，需要一個本機伺服器：

    npx serve .

## 測試

    node --test tests/*.test.js

## 修改內容

所有文案與題目都在 `src/data/`：

- `copy.js` 封面、結尾、送出相關文字，以及她的名字
- `questions.js` 第一章題目
- `memories.js` 五顆回憶星
- `restaurants.js` 餐廳卡與餐桌細節題
- `future.js` 未來清單與留言

## 部署

把整個資料夾拖到 https://app.netlify.com/drop
```

- [ ] **Step 11: Commit**

```bash
git add README.md src
git commit -m "docs: 使用說明與手機實測調整"
```

---

## 自我檢查紀錄

**規格涵蓋**：封面對應 Task 1，第一章六題對應 Task 3 與 4，五顆回憶星對應 Task 5，六張餐廳卡與三題細節對應 Task 6，未來清單與留言對應 Task 7，結果卡截圖規格對應 Task 8，Formspree 送出與複製備援對應 Task 9，手機硬性需求與八項手動測試對應 Task 10。規格中的每一節都有對應任務。

**型別一致**：`state` 的五個區段名稱在 Task 2、5、6、7、9 之間一致。`restaurantName(id, restaurants)` 在 Task 8 定義、Task 9 使用，簽章相同。`renderQuestion(question, currentValue, onChange)` 在 Task 3 定義，Task 4、5、6、7 沿用同一簽章。`showResult(app, state)` 在 Task 8 定義，Task 7 呼叫。

**已知的暫時佔位**：Task 5、6、7 各自留下一個下一章的空函式，並在後續任務明確取代。這是流程串接的必要順序，不是未完成的工作。
