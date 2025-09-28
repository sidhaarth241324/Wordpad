function format(command) {
  document.execCommand(command, false, null);
}

/* ---------- Robust setFontFamily ---------- */
function setFontFamily(family) {
  if (!family) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);

  // Try the quick execCommand path (enables css-based styling first)
  try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
  try { document.execCommand('fontName', false, family); } catch (e) {}

  // If collapsed, attempt to detect whether execCommand already set caret style
  if (range.collapsed) {
    const anchor = sel.anchorNode;
    const parentEl = (anchor && anchor.nodeType === 3) ? anchor.parentElement : anchor;

    if (parentEl) {
      const computed = window.getComputedStyle(parentEl).fontFamily || '';
      // quick check: if computed font already includes chosen family, stop
      if (computed.toLowerCase().includes(family.split(',')[0].toLowerCase())) {
        return;
      }
    }

    // Fallback: insert a span with a non-breaking space and place caret inside it
    const span = document.createElement('span');
    span.style.fontFamily = family;
    span.appendChild(document.createTextNode('\u00A0')); // NBSP so browser keeps span
    range.insertNode(span);

    // Place caret before the NBSP so user typing will replace it
    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStart(span.firstChild, 0);
    newRange.collapse(true);
    sel.addRange(newRange);
    // final focus to editor (optional)
    if (span.closest('#editor')) span.closest('#editor').focus();
    return;
  }

  // Non-collapsed: normalize selection and wrap it in a span with target font
  // Extract selected fragment into a temporary container
  const frag = range.extractContents();
  const container = document.createElement('div');
  container.appendChild(frag);

  // Remove inline font faces/style from nested font/span tags to avoid conflicts
  container.querySelectorAll('font').forEach(f => f.removeAttribute('face'));
  container.querySelectorAll('span').forEach(s => {
    s.style.fontFamily = '';
  });

  // Build wrapper span and re-insert
  const wrapper = document.createElement('span');
  wrapper.style.fontFamily = family;
  while (container.firstChild) wrapper.appendChild(container.firstChild);
  range.insertNode(wrapper);

  // Place caret after wrapped content
  sel.removeAllRanges();
  const newRange2 = document.createRange();
  newRange2.setStartAfter(wrapper);
  newRange2.collapse(true);
  sel.addRange(newRange2);
  if (wrapper.closest('#editor')) wrapper.closest('#editor').focus();
}

/* ---------- Robust setFontSize ---------- */
/* Accepts values like "14px" or "18px" */
function setFontSize(px) {
  if (!px) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);

  // Try execCommand (map px to fontSize if you want, but modern approach uses span)
  try { document.execCommand('styleWithCSS', false, true); } catch (e) {}
  // execCommand('fontSize') expects 1-7, so skip it; we will fall back to DOM method

  if (range.collapsed) {
    // insert span with NBSP and font-size style, place caret before NBSP
    const span = document.createElement('span');
    span.style.fontSize = px;
    span.appendChild(document.createTextNode('\u00A0'));
    range.insertNode(span);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStart(span.firstChild, 0);
    newRange.collapse(true);
    sel.addRange(newRange);
    if (span.closest('#editor')) span.closest('#editor').focus();
    return;
  }

  // Non-collapsed: extract, clean nested span font-size, wrap in new span
  const frag = range.extractContents();
  const container = document.createElement('div');
  container.appendChild(frag);

  container.querySelectorAll('span').forEach(s => {
    s.style.fontSize = '';
  });

  const wrapper = document.createElement('span');
  wrapper.style.fontSize = px;
  while (container.firstChild) wrapper.appendChild(container.firstChild);
  range.insertNode(wrapper);

  sel.removeAllRanges();
  const newRange2 = document.createRange();
  newRange2.setStartAfter(wrapper);
  newRange2.collapse(true);
  sel.addRange(newRange2);
  if (wrapper.closest('#editor')) wrapper.closest('#editor').focus();
}

/* ---------- Hook up selects (make sure these IDs exist in index.html) ---------- */
const fontFamilySelect = document.getElementById('fontFamily');
if (fontFamilySelect) {
  fontFamilySelect.addEventListener('change', (e) => {
    setFontFamily(e.target.value);
    // optional: e.target.value = ""; // reset dropdown label
  });
}

const fontSizeSelect = document.getElementById('fontSize');
if (fontSizeSelect) {
  fontSizeSelect.addEventListener('change', (e) => {
    setFontSize(e.target.value);
    // optional: e.target.value = "";
  });
}
