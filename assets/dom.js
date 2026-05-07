// Shared DOM helpers — safe element construction (no HTML string assignment)

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'on') {
      for (const [evt, fn] of Object.entries(v)) el.addEventListener(evt, fn);
    } else if (k === 'data') {
      for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = dv;
    } else if (k in el && typeof el[k] !== 'object') {
      el[k] = v;
    } else {
      el.setAttribute(k, v);
    }
  }
  const list = Array.isArray(children) ? children : [children];
  for (const c of list) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function icon(pathD, { className = 'w-4 h-4', strokeWidth = 2 } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', String(strokeWidth));
  svg.setAttribute('class', className);
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  p.setAttribute('d', pathD);
  svg.appendChild(p);
  return svg;
}

function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
