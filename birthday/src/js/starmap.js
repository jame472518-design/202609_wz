// 星點的位置刻意不等距，等距會看起來像進度條而不是星座。
const CONSTELLATION = {
  4: [8, 34, 62, 93],
  5: [6, 27, 49, 72, 94],
  6: [4, 20, 38, 55, 77, 96],
};

function positionsFor(total) {
  if (CONSTELLATION[total]) return CONSTELLATION[total];
  return Array.from({ length: total }, (_, i) => (total === 1 ? 50 : (i / (total - 1)) * 92 + 4));
}

export function createStarmap(total) {
  const el = document.createElement('div');
  el.className = 'starmap';
  el.setAttribute('aria-hidden', 'true');

  const positions = positionsFor(total);
  const line = document.createElement('span');
  line.className = 'starmap-line';
  line.style.left = `${positions[0]}%`;
  line.style.width = `${positions[positions.length - 1] - positions[0]}%`;
  el.append(line);

  const dots = positions.map((left) => {
    const dot = document.createElement('span');
    dot.className = 'starmap-dot';
    dot.style.left = `${left}%`;
    el.append(dot);
    return dot;
  });

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
