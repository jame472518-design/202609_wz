const NS = 'http://www.w3.org/2000/svg';

// 每個圖示是一組 path 的 d 字串，統一畫在 24x24 的框裡，只描邊不填色。
const PATHS = {
  bowl: [
    'M3 11h18',
    'M5 11a7 7 0 0 0 14 0',
    'M9 3c0 1.2-1 1.6-1 2.6S9 7.2 9 7.2',
    'M14 3c0 1.2-1 1.6-1 2.6s1 1.6 1 1.6',
  ],
  pot: [
    'M5 10h14v4a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z',
    'M3 12h2',
    'M19 12h2',
    'M12 3c1.6 1.6 2.2 2.6 2.2 3.6a2.2 2.2 0 0 1-4.4 0c0-1 .6-2 2.2-3.6z',
  ],
  glass: [
    'M8 3h8l-1.2 6.2a2.9 2.9 0 0 1-5.6 0z',
    'M12 12v7',
    'M9 19h6',
  ],
  lid: [
    'M3 14h18',
    'M5 14a7 5 0 0 1 14 0',
    'M12 9V6',
    'M10.5 6h3',
  ],
  star: [
    'M12 3l2.5 6 6.5.5-5 4.3 1.6 6.2-5.6-3.4-5.6 3.4 1.6-6.2-5-4.3 6.5-.5z',
  ],
};

export function createIcon(name) {
  const paths = PATHS[name] || PATHS.star;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'opt-icon');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
