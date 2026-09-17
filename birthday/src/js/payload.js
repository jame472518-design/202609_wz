import { rankedNames } from './summary.js';
import { FORM_ENDPOINT } from '../data/config.js';

export { FORM_ENDPOINT } from '../data/config.js';

// 複製備援用的中文標籤。她貼到訊息裡的時候要一眼看得懂。
const LABELS = {
  about: {
    q1: '完美的一天',
    q2: '處女座分數',
    q3: '想要的能力',
    q4: '最近的小事',
    q5: '送禮偏好',
  },
  deeper: {
    d1: '累的時候',
    d2: '一直想做的事',
    d3: '最珍貴的回憶',
    d4: '你覺得我',
  },
  memories: {
    s1: '第一次見面',
    s2: '蛋糕',
    s3: '幾次煙火',
    s4: '哪兩個地方',
  },
};

const EMPTY_TEXT = '（沒有填任何東西）';

function has(value) {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function format(value) {
  return Array.isArray(value) ? value.join('、') : String(value);
}

export function buildPayload(state, now, restaurants) {
  return {
    _subject: '她填完了',
    submittedAt: now.toISOString(),
    about: { ...(state.about || {}) },
    deeper: { ...(state.deeper || {}) },
    memories: { ...(state.memories || {}) },
    dinner: { ranked: rankedNames(state.dinner?.ranked, restaurants) },
  };
}

export function buildPlainText(state, restaurants) {
  const lines = [];

  const ranked = rankedNames(state.dinner?.ranked, restaurants);
  if (ranked.length) lines.push(`想去的，照順序：${ranked.join('、')}`);

  for (const section of ['about', 'deeper', 'memories']) {
    const answers = state[section] || {};
    for (const [key, label] of Object.entries(LABELS[section])) {
      if (has(answers[key])) lines.push(`${label}：${format(answers[key])}`);
    }
  }

  return lines.length ? lines.join('\n') : EMPTY_TEXT;
}
