"use strict";

const $ = sel => document.querySelector(sel);
const editor = $('#editor');

function format(command, value = null) {
  document.execCommand(command, false, value);
}


let currentFontFamily = null;
let currentFontSize = null;
let currentColor = null;       // hex string like "#rrggbb"
let currentHighlight = null;   // hex string or null


function applyStyle(styles) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const keys = Object.keys(styles);

  function removeStyleFromContainer(container, prop) {
    const nodes = Array.from(container.querySelectorAll('*'));
    nodes.forEach(node => {
      if (node.style && node.style[prop]) node.style[prop] = '';
    });
    const spans = Array.from(container.querySelectorAll('span'));
    spans.forEach(s => {
      if (!s.getAttribute('style') || s.getAttribute('style').trim() === '') {
        unwrap(s);
      }
    });
  }

  function unwrap(el) {
    while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
    el.parentNode.removeChild(el);
  }

  const clearingAll = keys.every(k => styles[k] === '');

  if (range.collapsed) {
    const anchor = sel.anchorNode;
    const parent = anchor && anchor.nodeType === 3 ? anchor.parentElement : anchor;

    if (clearingAll) {
      if (parent && parent !== editor) {
        keys.forEach(k => { parent.style[k] = ''; });
      }
      return;
    }

    const span = document.createElement('span');
    keys.forEach(k => {
      if (styles[k] !== '' && styles[k] != null) span.style[k] = styles[k];
    });
    const zw = document.createTextNode('\u200B');
    span.appendChild(zw);
    range.insertNode(span);

    sel.removeAllRanges();
    const newR = document.createRange();
    newR.setStart(zw, 0);
    newR.collapse(true);
    sel.addRange(newR);
    if (editor) editor.focus();
    return;
  }

  const frag = range.extractContents();
  const container = document.createElement('div');
  container.appendChild(frag);

  if (clearingAll) {
    keys.forEach(k => removeStyleFromContainer(container, k));
    while (container.firstChild) {
      range.insertNode(container.firstChild);
    }
    sel.removeAllRanges();
    const r2 = document.createRange();
    r2.setStart(range.endContainer || editor, range.endOffset || 0);
    r2.collapse(true);
    sel.addRange(r2);
    return;
  }

  keys.forEach(k => removeStyleFromContainer(container, k));

  const wrapper = document.createElement('span');
  keys.forEach(k => {
    if (styles[k] !== '' && styles[k] != null) wrapper.style[k] = styles[k];
  });
  while (container.firstChild) wrapper.appendChild(container.firstChild);
  range.insertNode(wrapper);

  sel.removeAllRanges();
  const r3 = document.createRange();
  r3.setStartAfter(wrapper);
  r3.collapse(true);
  sel.addRange(r3);
  if (editor) editor.focus();
}

/* ---------- setters and clearers ---------- */
function setFontFamily(family) {
  if (!family) return;
  if (currentFontFamily === family) {
    currentFontFamily = null;
    applyStyle({ fontFamily: '' });
    return;
  }
  currentFontFamily = family;
  applyStyle({ fontFamily: family });
}
function clearFontFamily() {
  currentFontFamily = null;
  applyStyle({ fontFamily: '' });
}

function setFontSize(sz) {
  if (!sz) return;
  if (currentFontSize === sz) {
    currentFontSize = null;
    applyStyle({ fontSize: '' });
    return;
  }
  currentFontSize = sz;
  applyStyle({ fontSize: sz });
}
function clearFontSize() {
  currentFontSize = null;
  applyStyle({ fontSize: '' });
}

/* === ✅ FIXED COLOR === */
function setColor(hex) {
  if (!hex) return;
  hex = hex.toLowerCase();
  if (currentColor === hex) {
    currentColor = null;
    applyStyle({ color: '' });
    return;
  }
  currentColor = hex;
  applyStyle({ color: hex });
}
function clearColor() {
  currentColor = null;
  applyStyle({ color: '' });
  const el = $('#fontColor'); if (el) el.value = '#000000';
}

/* === ✅ FIXED HIGHLIGHT === */
function setHighlight(hex) {
  if (!hex) return;
  hex = hex.toLowerCase();
  if (currentHighlight === hex) {
    currentHighlight = null;
    applyStyle({ backgroundColor: '' });
    return;
  }
  currentHighlight = hex;
  applyStyle({ backgroundColor: hex });
}
function clearHighlight() {
  currentHighlight = null;
  applyStyle({ backgroundColor: '' });
  const el = $('#highlightColor'); if (el) el.value = '#ffffff';
}

/* ---------- attach toolbar handlers ---------- */
const fontFamilySelect = $('#fontFamily');
const fontSizeSelect = $('#fontSize');
const colorInput = $('#fontColor');
const highlightInput = $('#highlightColor');

if (fontFamilySelect) {
  fontFamilySelect.addEventListener('change', (e) => setFontFamily(e.target.value));
  $('#clearFontFamily')?.addEventListener('click', clearFontFamily);
}
if (fontSizeSelect) {
  fontSizeSelect.addEventListener('change', (e) => setFontSize(e.target.value));
  $('#clearFontSize')?.addEventListener('click', clearFontSize);
}
if (colorInput) {
  colorInput.addEventListener('click', () => {
    if (colorInput.value && colorInput.value.toLowerCase() === (currentColor || '').toLowerCase()) {
      clearColor();
    }
  });
  colorInput.addEventListener('input', (e) => setColor(e.target.value));
  $('#clearColor')?.addEventListener('click', clearColor);
}
if (highlightInput) {
  highlightInput.addEventListener('click', () => {
    if (highlightInput.value && highlightInput.value.toLowerCase() === (currentHighlight || '').toLowerCase()) {
      clearHighlight();
    }
  });
  highlightInput.addEventListener('input', (e) => setHighlight(e.target.value));
  $('#clearHighlight')?.addEventListener('click', clearHighlight);
}

/* ---------- sync toolbar with caret ---------- */
function setSelectValueSafely(select, val) {
  if (!select) return;
  let found = false;
  for (const opt of select.options) {
    if (opt.value && opt.value.toLowerCase() === (val || '').toLowerCase()) { found = true; break; }
  }
  select.value = found ? val : '';
}

function syncToolbarWithCaret() {
  if (!editor) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const anchor = sel.anchorNode;
  const parent = (anchor && anchor.nodeType === 3) ? anchor.parentElement : anchor;
  if (!parent) return;
  const computed = window.getComputedStyle(parent);

  setSelectValueSafely(fontFamilySelect, (computed.fontFamily || '').split(',')[0].replace(/['"]/g,''));
  if (fontSizeSelect) fontSizeSelect.value = computed.fontSize || '';
  if (colorInput) colorInput.value = rgbToHex(computed.color) || '#000000';
  if (highlightInput) {
    const hex = rgbToHex(computed.backgroundColor);
    highlightInput.value = hex || '#ffffff';
  }
}

/* rgb -> hex for sync only */
function rgbToHex(rgb) {
  if (!rgb) return '';
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/i);
  if (!m) return '';
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

if (editor) {
  editor.addEventListener('mouseup', syncToolbarWithCaret);
  editor.addEventListener('keyup', syncToolbarWithCaret);
  document.addEventListener('selectionchange', () => {
    if (document.activeElement === editor) syncToolbarWithCaret();
  });
}

