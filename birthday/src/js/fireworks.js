// 一朵只綻放一次的煙火。大稻埕跟淡水那兩晚的視覺呼應。
export function createFireworks(variant) {
  const wrap = document.createElement('div');
  wrap.className = variant ? `fireworks ${variant}` : 'fireworks';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 8; i += 1) wrap.append(document.createElement('span'));
  return wrap;
}
