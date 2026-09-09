import { RESTAURANTS } from '../data/restaurants.js';
import {
  TIMELINE, CLOSING, RESULT_TITLE, RESULT_HERO_LABEL, RESULT_ALSO_LABEL,
  SUBMIT_LABEL, SCREENSHOT_HINT, SUBMIT_SENDING, SUBMIT_DONE, SUBMIT_FAILED,
  RETRY_LABEL, COPY_LABEL, COPY_DONE, COPY_MANUAL, BIRTHDAY,
} from '../data/copy.js';
import { buildPersonaLine, rankedNames } from './summary.js';
import { buildPayload, buildPlainText } from './payload.js';
import { sendAnswers } from './submit.js';
import { createRose } from './rose.js';
import { createHeart } from './heart.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function buildResultCard(state) {
  const card = el('section', 'result-card');
  card.append(createRose(BIRTHDAY.month, BIRTHDAY.day, 76));
  card.append(el('h2', null, RESULT_TITLE));

  const timeline = el('div', 'timeline');
  for (const label of TIMELINE) timeline.append(el('span', null, label));
  card.append(timeline);

  // 第一順位用整張卡最大的字，其餘照她排的順序列在下面
  const names = rankedNames(state.dinner?.ranked, RESTAURANTS);
  const hero = el('div', 'result-hero');
  hero.append(el('small', null, RESULT_HERO_LABEL));
  hero.append(el('strong', null, names[0] || '還沒選'));
  if (names.length > 1) {
    hero.append(el('small', null, `${RESULT_ALSO_LABEL} ${names.slice(1).join('、')}`));
  }
  card.append(hero);

  const persona = buildPersonaLine(state);
  if (persona) card.append(el('p', 'result-persona', persona));

  card.append(el('p', 'result-date', formatDate(new Date())));
  return card;
}

function showFallback(app, state) {
  if (app.querySelector('.fallback')) return;
  const fallback = el('div', 'fallback');
  fallback.append(el('p', 'hint', SUBMIT_FAILED));
  const copyBtn = el('button', 'btn-primary', COPY_LABEL);
  copyBtn.type = 'button';
  copyBtn.addEventListener('click', async () => {
    const text = buildPlainText(state, RESTAURANTS);
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = COPY_DONE;
    } catch {
      if (!fallback.querySelector('textarea')) {
        const area = document.createElement('textarea');
        area.value = text;
        area.readOnly = true;
        fallback.append(area);
        area.select();
      }
      copyBtn.textContent = COPY_MANUAL;
    }
  });
  fallback.append(copyBtn);
  app.append(fallback);
}

export function showResult(app, state) {
  app.innerHTML = '';
  const card = buildResultCard(state);
  const closing = el('p', 'closing', CLOSING);
  const footer = el('div', 'result-footer');
  const submit = el('button', 'btn-primary', SUBMIT_LABEL);
  submit.type = 'button';
  footer.append(submit);
  const hint = el('p', 'hint', SCREENSHOT_HINT);

  // 心從結果頁就開始跳，不等送出。送出成功之後同一顆心留在畫面上，
  // 動畫沒有中斷過，只是被搬到新的版面裡。
  const heart = createHeart();
  app.append(card, closing, heart.root, footer, hint);
  heart.start();

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    submit.textContent = SUBMIT_SENDING;
    const result = await sendAnswers(buildPayload(state, new Date(), RESTAURANTS));
    if (result.ok) {
      app.innerHTML = '';
      app.append(card, el('p', 'closing', SUBMIT_DONE), heart.root);
      return;
    }
    submit.disabled = false;
    submit.textContent = RETRY_LABEL;
    showFallback(app, state);
  });
}
