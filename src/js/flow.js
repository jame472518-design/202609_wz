import { setAnswer, saveState } from './state.js';
import { renderQuestion, renderCardShell } from './render.js';
import { createStarmap } from './starmap.js';
import { createIcon } from './icons.js';
import { createFireworks } from './fireworks.js';
import { ABOUT_QUESTIONS, DEEPER_INTRO, DEEPER_QUESTIONS } from '../data/questions.js';
import { MEMORY_INTRO, MEMORIES } from '../data/memories.js';
import { DINNER_INTRO, DINNER_HINT, RESTAURANTS, mapLink } from '../data/restaurants.js';
import { showResult } from './result.js';

const ANYWHERE_ID = 'anywhere';
const MAP_LINK_LABEL = '在地圖上看看';

function answered(value) {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function isCorrect(memory, value) {
  if (!memory.correct) return null;
  if (Array.isArray(memory.correct)) {
    const got = Array.isArray(value) ? [...value].sort() : [];
    const want = [...memory.correct].sort();
    return got.length === want.length && got.every((v, i) => v === want[i]);
  }
  return value === memory.correct;
}

function block(className, text) {
  const p = document.createElement('p');
  p.className = className;
  p.textContent = text;
  return p;
}

function footerWith(label, onClick) {
  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  footer.append(btn);
  return { footer, btn };
}

export function startFlow(app, initialState) {
  let state = initialState;
  const storage = window.localStorage;
  const persist = () => saveState(state, storage);

  const aboutMap = createStarmap(ABOUT_QUESTIONS.length);
  const deeperMap = createStarmap(DEEPER_QUESTIONS.length);
  const memoryMap = createStarmap(MEMORIES.length);

  // 兩章問答的結構一樣：答完之後作者的話浮出來，再往下一題。
  // 她如果直接按按鈕沒作答，第一次點也會先把話顯示出來，不讓她錯過。
  function drawChapter({ questions, section, starmap, intro, onFinish }) {
    function draw(index) {
      const q = questions[index];
      const last = index === questions.length - 1;
      const nextLabel = last ? '好了' : '下一題';
      let revealed = false;

      app.innerHTML = '';
      starmap.light(index);

      const card = renderQuestion(q, state[section][q.id], (value) => {
        state = setAnswer(state, section, q.id, value);
        persist();
        reveal();
      });

      const { footer, btn } = footerWith(nextLabel, () => {
        if (!revealed && q.mine) {
          reveal();
          return;
        }
        if (last) onFinish();
        else draw(index + 1);
      });

      function reveal() {
        if (revealed || !q.mine) return;
        revealed = true;
        card.insertBefore(block('reply', q.mine), footer);
        btn.textContent = nextLabel;
      }

      card.append(footer);
      if (!answered(state[section][q.id]) && q.mine) btn.textContent = '好';
      else reveal();

      if (index === 0 && intro) app.append(block('intro-line', intro));
      app.append(starmap.el, card);
    }

    draw(0);
  }

  function drawMemory(mIndex) {
    const m = MEMORIES[mIndex];
    app.innerHTML = '';
    memoryMap.light(mIndex);

    if (m.type === 'none') {
      const body = document.createElement('div');
      body.append(block('reply', m.reply));
      const card = renderCardShell('', body);
      const { footer } = footerWith('嗯', () => {
        memoryMap.light(MEMORIES.length);
        memoryMap.connect();
        setTimeout(startDinner, 700);
      });
      card.append(footer);
      app.append(memoryMap.el, card);
      return;
    }

    let revealed = false;
    const card = renderQuestion(m, state.memories[m.id], (value) => {
      state = setAnswer(state, 'memories', m.id, value);
      const ok = isCorrect(m, value);
      if (ok !== null) state = setAnswer(state, 'memories', `${m.id}Correct`, ok);
      persist();
    });
    const { footer, btn } = footerWith('好', () => {
      if (!revealed) {
        revealed = true;
        const text = m.reply || (state.memories[`${m.id}Correct`] ? m.onCorrect : m.onWrong);
        card.insertBefore(block('reply', text), footer);
        if (m.effect === 'fireworks') card.insertBefore(createFireworks(), footer);
        btn.textContent = '下一顆';
        return;
      }
      drawMemory(mIndex + 1);
    });
    card.append(footer);
    if (mIndex === 0) app.append(block('intro-line', MEMORY_INTRO));
    app.append(memoryMap.el, card);
  }

  // 可以複選，而且記順序。她點的第一間就是第一順位，作者照這個順序打電話訂位。
  // 「都可以你決定就好」跟其他選項互斥，兩者同時成立沒有意義。
  function restaurantPicker(title) {
    const body = document.createElement('div');
    let ranked = [...(state.dinner.ranked || [])];

    const toggle = (id) => {
      if (id === ANYWHERE_ID) {
        ranked = ranked.includes(ANYWHERE_ID) ? [] : [ANYWHERE_ID];
      } else {
        const at = ranked.indexOf(id);
        if (at >= 0) ranked.splice(at, 1);
        else ranked = [...ranked.filter((x) => x !== ANYWHERE_ID), id];
      }
      state = setAnswer(state, 'dinner', 'ranked', [...ranked]);
      persist();
    };

    const draw = () => {
      body.innerHTML = '';
      for (const r of RESTAURANTS) {
        const rank = ranked.indexOf(r.id);
        const row = document.createElement('div');
        row.className = 'opt-row';

        const btn = document.createElement('button');
        btn.className = 'opt opt-card';
        btn.type = 'button';
        btn.setAttribute('aria-pressed', String(rank >= 0));
        btn.append(createIcon(r.icon));

        const text = document.createElement('span');
        text.className = 'opt-text';
        const name = document.createElement('strong');
        name.className = 'opt-name';
        if (rank >= 0 && r.id !== ANYWHERE_ID) {
          const badge = document.createElement('span');
          badge.className = 'opt-rank';
          badge.textContent = `${rank + 1}.`;
          name.append(badge);
        }
        const label = document.createElement('span');
        label.textContent = r.name;
        name.append(label);
        text.append(name);
        if (r.where) text.append(block('opt-meta', r.where));
        text.append(block('opt-why', r.why));
        btn.append(text);

        btn.addEventListener('click', () => {
          toggle(r.id);
          draw();
        });
        row.append(btn);

        // 沒有店家照片的授權，所以給她一個地圖連結，照片評價地址都在那裡
        const link = mapLink(r);
        if (link) {
          const anchor = document.createElement('a');
          anchor.className = 'opt-link';
          anchor.href = link;
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
          anchor.textContent = MAP_LINK_LABEL;
          row.append(anchor);
        }

        body.append(row);
      }
    };

    draw();
    return renderCardShell(title, body);
  }

  function startDinner() {
    app.innerHTML = '';
    const card = restaurantPicker(DINNER_INTRO);
    const { footer } = footerWith('看結果', () => showResult(app, state));
    card.append(footer);
    app.append(block('intro-line', DINNER_HINT), card);
  }

  function startDeeper() {
    drawChapter({
      questions: DEEPER_QUESTIONS,
      section: 'deeper',
      starmap: deeperMap,
      intro: DEEPER_INTRO,
      onFinish: () => {
        deeperMap.light(DEEPER_QUESTIONS.length);
        drawMemory(0);
      },
    });
  }

  drawChapter({
    questions: ABOUT_QUESTIONS,
    section: 'about',
    starmap: aboutMap,
    intro: null,
    onFinish: () => {
      aboutMap.light(ABOUT_QUESTIONS.length);
      startDeeper();
    },
  });
}
