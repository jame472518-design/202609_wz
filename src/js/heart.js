// 心臟線 r = a(1 − sin θ)，笛卡爾在十七世紀寫下的極座標曲線。
// 從 θ = π/2 起筆，那個角度 r = 0，正好是心形凹進去的那一點，
// 所以整顆心是一筆畫完的，不是拼出來的。
//
// 描完之後轉成脈動：a 隨時間微幅變化，節奏用兩個高斯脈衝疊出來，
// 一下重一下輕，那是心跳真正的 lub-dub，大約每分鐘五十七下。
import { HEART_FORMULA } from '../data/copy.js';

const DRAW_MS = 1500;
const BEAT_PERIOD = 1.05;
const BEAT_DEPTH = 0.07;
const HEIGHT = 240;
const STEPS = 480;

function readColor(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function heartPoints() {
  const points = [];
  for (let i = 0; i <= STEPS; i += 1) {
    const t = Math.PI / 2 + (i / STEPS) * Math.PI * 2;
    const r = 1 - Math.sin(t);
    points.push([r * Math.cos(t), r * Math.sin(t)]);
  }
  return points;
}

function heartbeat(seconds) {
  const phase = (seconds % BEAT_PERIOD) / BEAT_PERIOD;
  const lub = Math.exp(-((phase - 0.05) ** 2) / 0.0015);
  const dub = 0.55 * Math.exp(-((phase - 0.24) ** 2) / 0.0015);
  return lub + dub;
}

function bounds(points) {
  let minX = Infinity; let maxX = -Infinity;
  let minY = Infinity; let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

export function createHeart() {
  const root = document.createElement('div');
  root.className = 'heart';

  const canvas = document.createElement('canvas');
  canvas.className = 'heart-plot';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '一顆用心臟線畫出來、正在跳的心');

  const formula = document.createElement('p');
  formula.className = 'heart-formula';
  formula.textContent = HEART_FORMULA;

  root.append(canvas, formula);

  const ctx = canvas.getContext('2d');
  const spark = readColor('--spark', '#FF6F91');
  const points = heartPoints();
  const box = bounds(points);
  const spanX = Math.max(box.maxX - box.minX, 0.001);
  const spanY = Math.max(box.maxY - box.minY, 0.001);
  const midX = (box.minX + box.maxX) / 2;
  const midY = (box.minY + box.maxY) / 2;

  let width = 0;
  let raf = null;
  let startedAt = 0;

  function ensureSize() {
    const next = canvas.clientWidth || 320;
    if (next !== width) {
      width = next;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return width;
  }

  function draw(progress, scale) {
    const w = ensureSize();
    const fit = Math.min((w * 0.62) / spanX, (HEIGHT * 0.66) / spanY) * scale;
    const cx = w / 2;
    const cy = HEIGHT / 2;

    ctx.clearRect(0, 0, w, HEIGHT);
    ctx.beginPath();

    const last = Math.max(1, Math.round(STEPS * progress));
    for (let i = 0; i <= last; i += 1) {
      const [x, y] = points[i];
      const px = cx + (x - midX) * fit;
      const py = cy - (y - midY) * fit;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.strokeStyle = spark;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = spark;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function frame(now) {
    if (!startedAt) startedAt = now;
    const elapsed = now - startedAt;
    const drawing = Math.min(1, elapsed / DRAW_MS);
    const eased = 1 - (1 - drawing) ** 3;
    const beat = drawing < 1 ? 0 : heartbeat((elapsed - DRAW_MS) / 1000);
    draw(eased, 1 + BEAT_DEPTH * beat);
    raf = requestAnimationFrame(frame);
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  return {
    root,
    start() {
      // 一律延到下一幀才畫。剛 append 進去的時候版面還沒算好，
      // clientWidth 會是 0，這一幀畫出來的心會落在錯的位置。
      if (prefersReducedMotion()) {
        requestAnimationFrame(() => draw(1, 1));
        return;
      }
      raf = requestAnimationFrame(frame);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    },
  };
}
