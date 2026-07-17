// Mode.Inc email signature generator — UI wiring.
// State + rendering for the form, segmented controls, live preview, and
// clipboard actions. All signature HTML comes from signature.js (pure).

import { CONFIG, validate, generateSignature } from './signature.js';

const state = {
  name: '', title: '', email: '', linkedin: '', calendar: '',
  concept: '02', theme: 'clear', logoPos: 'top',
  touched: {}, attempted: false,
  copied: '', howOpen: false,
};

const CONCEPT_TAGS = {
  '01': 'Concept 01 · Super minimal',
  '02': 'Concept 02 · Minimal with mission',
  '03': 'Concept 03 · Company values',
  '04': 'Concept 04 · Values + accolade',
  '05': 'Concept 05 · Mission + accolade',
};

const PREVIEW_DEFAULTS = { name: 'Gaston Klanian', title: 'Head of AI', email: 'gaston@mode.inc' };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Hosted wordmark overrides (?logoClear=…&logoDark=…); blank falls back to
// the bundled PNGs, and an explicit "none" forces the text wordmark.
function config() {
  const params = new URLSearchParams(location.search);
  const pick = (key, fallback) => {
    const v = params.get(key);
    if (v === null) return fallback;
    return v === 'none' ? '' : v;
  };
  return Object.assign({}, CONFIG, {
    LOGO_URL_CLEAR: pick('logoClear', CONFIG.LOGO_URL_CLEAR),
    LOGO_URL_DARK: pick('logoDark', CONFIG.LOGO_URL_DARK),
    LOGO_POSITION: state.logoPos,
  });
}

function data() {
  return {
    name: state.name, title: state.title, email: state.email,
    linkedin: state.concept === '01' ? '' : state.linkedin,
    calendar: state.concept === '01' ? '' : state.calendar,
  };
}

function previewData() {
  const d = data();
  return {
    name: d.name.trim() || PREVIEW_DEFAULTS.name,
    title: d.title.trim() || PREVIEW_DEFAULTS.title,
    email: d.email.trim() || PREVIEW_DEFAULTS.email,
    linkedin: d.linkedin,
    calendar: d.calendar,
  };
}

function signatureHtml() {
  return generateSignature(data(), state.concept, state.theme, config());
}

function isValid() {
  return Object.keys(validate(data(), state.concept)).length === 0;
}

// ── Clipboard ─────────────────────────────────────────────

function execCopyRich(html) {
  const div = document.createElement('div');
  div.contentEditable = 'true';
  div.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  div.innerHTML = html;
  document.body.appendChild(div);
  const range = document.createRange();
  range.selectNodeContents(div);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  sel.removeAllRanges();
  div.remove();
  return ok;
}

function execCopyText(text) {
  const ta = document.createElement('textarea');
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

function guard() {
  if (isValid()) return true;
  state.attempted = true;
  render();
  return false;
}

let flashTimer;
function flash(kind) {
  state.copied = kind;
  state.attempted = false;
  render();
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { state.copied = ''; render(); }, 2400);
}

async function copyRich() {
  if (!guard()) return;
  const html = signatureHtml();
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  let ok = false;
  try {
    await navigator.clipboard.write([new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    })]);
    ok = true;
  } catch (e) {
    ok = execCopyRich(html);
  }
  if (ok) flash('rich');
}

async function copyHtml() {
  if (!guard()) return;
  const html = signatureHtml();
  let ok = false;
  try {
    await navigator.clipboard.writeText(html);
    ok = true;
  } catch (e) {
    ok = execCopyText(html);
  }
  if (ok) flash('html');
}

// ── Rendering ─────────────────────────────────────────────

function render() {
  const errors = validate(data(), state.concept);
  const show = (k) => Boolean((state.touched[k] || state.attempted) && errors[k]);
  const valid = Object.keys(errors).length === 0;

  for (const k of ['name', 'title', 'email', 'linkedin', 'calendar']) {
    const el = $('#err-' + k);
    el.textContent = errors[k] || '';
    el.hidden = !show(k);
  }

  const linksDisabled = state.concept === '01';
  for (const wrap of $$('.optional-link')) {
    wrap.classList.toggle('links-disabled', linksDisabled);
    wrap.querySelector('input').disabled = linksDisabled;
    wrap.querySelector('.links-note').textContent = linksDisabled ? '· not on concept 01' : '';
  }

  for (const btn of $$('[data-concept]')) {
    btn.classList.toggle('selected', btn.dataset.concept === state.concept);
    btn.setAttribute('aria-checked', String(btn.dataset.concept === state.concept));
  }
  for (const btn of $$('[data-theme]')) {
    btn.classList.toggle('selected', btn.dataset.theme === state.theme);
    btn.setAttribute('aria-checked', String(btn.dataset.theme === state.theme));
  }
  for (const btn of $$('[data-logo]')) {
    btn.classList.toggle('selected', btn.dataset.logo === state.logoPos);
    btn.setAttribute('aria-checked', String(btn.dataset.logo === state.logoPos));
  }

  $('#copy-row').classList.toggle('invalid', !valid);
  $('#copy-blocked').hidden = !(state.attempted && !valid);
  $('#copy-rich span').textContent = state.copied === 'rich' ? 'Copied' : 'Copy signature';
  $('#copy-html span').textContent = state.copied === 'html' ? 'Copied' : 'Copy HTML';

  $('#how-toggle').textContent = (state.howOpen ? '−' : '+') + ' How to install in Gmail';
  $('#how-toggle').setAttribute('aria-expanded', String(state.howOpen));
  $('#how-steps').hidden = !state.howOpen;

  $('#concept-tag').textContent = CONCEPT_TAGS[state.concept];
  $('#theme-tag').textContent = (state.theme === 'dark' ? 'Dark' : 'Clear') +
    (state.logoPos === 'bottom' ? ' · Logo bottom' : '');
  $('#signature-preview').innerHTML = generateSignature(previewData(), state.concept, state.theme, config());
}

// ── Events ────────────────────────────────────────────────

for (const input of $$('input[data-field]')) {
  const k = input.dataset.field;
  input.addEventListener('input', () => {
    state[k] = input.value;
    state.copied = '';
    render();
  });
  input.addEventListener('blur', () => {
    state.touched[k] = true;
    render();
  });
}

for (const btn of $$('[data-concept]')) {
  btn.addEventListener('click', () => { state.concept = btn.dataset.concept; render(); });
}
for (const btn of $$('[data-theme]')) {
  btn.addEventListener('click', () => { state.theme = btn.dataset.theme; render(); });
}
for (const btn of $$('[data-logo]')) {
  btn.addEventListener('click', () => { state.logoPos = btn.dataset.logo; render(); });
}

$('#copy-rich').addEventListener('click', copyRich);
$('#copy-html').addEventListener('click', copyHtml);
$('#how-toggle').addEventListener('click', () => { state.howOpen = !state.howOpen; render(); });

render();
