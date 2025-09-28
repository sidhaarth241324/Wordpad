function format(command) {
  document.execCommand(command, false, null);
}

function setFontSize(px) {
  if (!px) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;

  const range = sel.getRangeAt(0);

  if (range.collapsed) return;

  const frag = range.extractContents();
  const span = document.createElement('span');
  span.style.fontSize = px;
  span.appendChild(frag);
  range.insertNode(span);


  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.setStartAfter(span);
  newRange.collapse(true);
  sel.addRange(newRange);
}


const fontSizeSelect = document.getElementById('fontSize');
if (fontSizeSelect) {
  fontSizeSelect.addEventListener('change', (e) => {
    setFontSize(e.target.value);

  });
}
