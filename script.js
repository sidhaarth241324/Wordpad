/* ================= WordPad Editor Script: Font-Family & Font-Size ================= */

// Current typing style
let currentFontFamily = null;
let currentFontSize = null;

// ---------- Format using execCommand for simple actions ----------
function format(command) {
  document.execCommand(command, false, null);
}

// ---------- Apply font-family ----------
function setFontFamily(family) {
  if (!family) return;
  currentFontFamily = family;
  applyStyle({ fontFamily: family });
}

// ---------- Apply font-size ----------
function setFontSize(px) {
  if (!px) return;
  currentFontSize = px;
  applyStyle({ fontSize: px });
}

// ---------- Core function to apply style ----------
function applyStyle(styles) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);

  if (range.collapsed) {
    // collapsed caret → insert span for future typing
    const span = document.createElement('span');
    for (let key in styles) span.style[key] = styles[key];
    span.appendChild(document.createTextNode('\u00A0')); // NBSP
    range.insertNode(span);

    // place caret inside span
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStart(span.firstChild, 0);
    newRange.collapse(true);
    sel.addRange(newRange);
    if (span.closest('#editor')) span.closest('#editor').focus();
    return;
  }

  // Non-collapsed selection → wrap in span
  const frag = range.extractContents();
  const container = document.createElement('div');
  container.appendChild(frag);

  container.querySelectorAll('span').forEach(s => {
    s.style.fontFamily = '';
    s.style.fontSize = '';
  });

  const wrapper = document.createElement('span');
  for (let key in styles) wrapper.style[key] = styles[key];
  while (container.firstChild) wrapper.appendChild(container.firstChild);
  range.insertNode(wrapper);

  // place caret after wrapped content
  sel.removeAllRanges();
  const newRange2 = document.createRange();
  newRange2.setStartAfter(wrapper);
  newRange2.collapse(true);
  sel.addRange(newRange2);
  if (wrapper.closest('#editor')) wrapper.closest('#editor').focus();
}

// ---------- Hook toolbar selects ----------
const fontFamilySelect = document.getElementById('fontFamily');
if (fontFamilySelect) fontFamilySelect.addEventListener('change', e => setFontFamily(e.target.value));

const fontSizeSelect = document.getElementById('fontSize');
if (fontSizeSelect) fontSizeSelect.addEventListener('change', e => setFontSize(e.target.value));

// ---------- Sync toolbar with caret ----------
const editor = document.getElementById('editor');
editor.addEventListener('mouseup', syncToolbarWithCaret);
editor.addEventListener('keyup', syncToolbarWithCaret);
document.addEventListener('selectionchange', () => {
  if (document.activeElement === editor) syncToolbarWithCaret();
});

function syncToolbarWithCaret() {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const anchor = sel.anchorNode;
  const parent = (anchor && anchor.nodeType === 3) ? anchor.parentElement : anchor;
  if (!parent) return;

  const computed = window.getComputedStyle(parent);
  if (fontFamilySelect) fontFamilySelect.value = computed.fontFamily.replace(/['"]/g,'');
  if (fontSizeSelect) fontSizeSelect.value = computed.fontSize;
}

// ---------- Apply current style when typing ----------
editor.addEventListener('keypress', (e) => {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return; // ignore selections

  const anchor = sel.anchorNode;
  if (!anchor || anchor.nodeType !== 3) return;

  const parent = anchor.parentElement;
  const char = e.key;

  // only if parent doesn't already have the current font
  const styleMismatch = (currentFontFamily && parent.style.fontFamily !== currentFontFamily) ||
                        (currentFontSize && parent.style.fontSize !== currentFontSize);

  if (styleMismatch && char.length === 1) { // ignore non-character keys
    e.preventDefault(); // stop default character insertion

    // split text node at caret
    const offset = range.startOffset;
    const afterText = anchor.splitText(offset);

    // create new span for the typed character
    const span = document.createElement('span');
    if (currentFontFamily) span.style.fontFamily = currentFontFamily;
    if (currentFontSize) span.style.fontSize = currentFontSize;
    span.textContent = char;

    afterText.parentNode.insertBefore(span, afterText);

    // move caret after inserted char
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }
});
