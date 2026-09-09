export function renderCardShell(title, bodyEl, footerEl) {
  const card = document.createElement('section');
  card.className = 'card';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  if (title) card.append(h2);
  card.append(bodyEl);
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
    let selected = currentValue;
    const drawSingle = () => {
      body.innerHTML = '';
      for (const label of question.options) {
        body.append(optionButton(label, selected === label, () => {
          selected = label;
          onChange(label);
          drawSingle();
        }));
      }
    };
    drawSingle();
  }

  if (question.type === 'multi') {
    const picked = Array.isArray(currentValue) ? [...currentValue] : [];
    const drawMulti = () => {
      body.innerHTML = '';
      for (const label of question.options) {
        body.append(optionButton(label, picked.includes(label), () => {
          const i = picked.indexOf(label);
          if (i >= 0) picked.splice(i, 1); else picked.push(label);
          onChange([...picked]);
          drawMulti();
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
    drawMulti();
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
