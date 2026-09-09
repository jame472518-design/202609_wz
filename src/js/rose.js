// 極座標玫瑰線 r = cos(n/d · θ)。
// n 與 d 都是奇數時，曲線在 dπ 內閉合，長出 n 片花瓣；否則要繞到 2dπ，長出 2n 片。
// 把月份放 n、日期放 d，每個日子就有一個只屬於它的形狀。九月十一號會長出九片。
const NS = 'http://www.w3.org/2000/svg';
const STEP = 0.04;

export function petalCount(numerator, denominator) {
  const bothOdd = numerator % 2 === 1 && denominator % 2 === 1;
  return bothOdd ? numerator : numerator * 2;
}

export function createRose(numerator, denominator, size) {
  const bothOdd = numerator % 2 === 1 && denominator % 2 === 1;
  const maxTheta = (bothOdd ? denominator : denominator * 2) * Math.PI;
  const center = size / 2;
  const radius = center - 1;
  const k = numerator / denominator;

  const points = [];
  for (let theta = 0; theta <= maxTheta; theta += STEP) {
    const r = Math.cos(k * theta) * radius;
    const x = center + r * Math.cos(theta);
    const y = center + r * Math.sin(theta);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'rose');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `由 ${numerator} 月 ${denominator} 日算出來的花形`);

  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', `M${points.join('L')}`);
  svg.append(path);
  return svg;
}
