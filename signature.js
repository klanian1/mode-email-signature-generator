// Mode.Inc email signature generator.
// Pure, isolated, unit-testable: (data, concept, theme) -> email-safe HTML string.
// Hard constraints honored here: table-based layout, inline styles only,
// web-safe font stack, no JavaScript, no classes, no <style> blocks, no webfonts.

export const CONFIG = {
  COMPANY_URL: 'https://mode.inc',
  COMPANY_LABEL: 'mode.inc',
  MISSION: 'The supply for the AI economy. Built and owned alongside everyday people.',
  VALUES: ['ACCOUNTABLE', 'ACTION-DRIVEN', 'CURIOUS', 'CARING', 'THOROUGH'],
  ACCOLADE_COMPANY: 'Mode.Inc',
  ACCOLADE_AWARD: '#1 Fastest-Growing Software Company',
  ACCOLADE_EVENT: "on 2023 Deloitte's Fast 500",
  // Concept 06: same award, regional framing, no company prefix.
  ACCOLADE_06_AWARD: '#1 Fastest-Growing Software Company',
  ACCOLADE_06_EVENT: 'in North America, 2023 Deloitte Technology Fast 500\u2122',
  // Hosted <img> wordmarks (design-system logo, rasterized to PNG). If empty,
  // falls back to the text wordmark (bold "m0de.inc", green zero, green underline).
  // Replace with a public CDN URL before company-wide rollout so the image
  // resolves in recipients' inboxes.
  LOGO_URL_CLEAR: 'assets/logo-clear.png',
  LOGO_URL_DARK: 'assets/logo-dark.png',
  // 'top' places the wordmark above the name block; 'bottom' closes the
  // signature with it instead.
  LOGO_POSITION: 'top',
};

const FONT = 'Arial, Helvetica, sans-serif';

const THEMES = {
  dark: {
    card: '#000000',
    text: '#FFFFFF',
    muted: '#9DA3AE',
    accent: '#00FF9D',
    divider: '#33383F',
  },
  clear: {
    card: '',
    text: '#111111',
    muted: '#6B7280',
    accent: '#6D28D9',
    divider: '#E5E5E0',
  },
};

export function escapeHtml(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isUrl(v, host) {
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : 'https://' + v);
    if (!u.hostname || u.hostname.indexOf('.') === -1) return false;
    if (host) return u.hostname === host || u.hostname.endsWith('.' + host);
    return true;
  } catch (e) {
    return false;
  }
}

function normalizeUrl(v) {
  return /^https?:\/\//i.test(v) ? v : 'https://' + v;
}

// Returns an errors object; empty object means valid.
export function validate(data, concept) {
  const errors = {};
  const name = String(data.name || '').trim();
  const title = String(data.title || '').trim();
  const email = String(data.email || '').trim();
  const linkedin = String(data.linkedin || '').trim();
  const calendar = String(data.calendar || '').trim();

  if (!name) errors.name = 'Full name is required.';
  if (!title) errors.title = 'Job title is required.';
  else if (/(^|[^a-z0-9])m[o0]de([^a-z0-9]|$)/i.test(title))
    errors.title = 'Job titles never include the company name.';
  if (!email) errors.email = 'Email is required.';
  else if (!/^[A-Za-z0-9._%+-]+@mode\.inc$/i.test(email))
    errors.email = 'Must be a @mode.inc address.';
  if (concept !== '01') {
    if (linkedin && !isUrl(linkedin, 'linkedin.com'))
      errors.linkedin = 'Must be a linkedin.com URL.';
    if (calendar && !isUrl(calendar)) errors.calendar = 'Enter a valid URL.';
  }
  return errors;
}

function wordmark(theme, t, config) {
  const url = theme === 'dark' ? config.LOGO_URL_DARK : config.LOGO_URL_CLEAR;
  if (url) {
    let abs = url;
    try { abs = new URL(url, (typeof document !== 'undefined' && document.baseURI) || undefined).href; } catch (e) {}
    return (
      '<img src="' + escapeHtml(abs) +
      '" alt="mode.inc" width="100" height="24" style="display:block;border:0;outline:none;width:100px;height:24px;">'
    );
  }
  return (
    '<span style="display:inline-block;border-bottom:2px solid #00FF9D;padding-bottom:1px;font-family:' + FONT +
    ';font-size:17px;font-weight:bold;letter-spacing:0.3px;color:' + t.text +
    ';">m<span style="color:#00FF9D;">0</span>de.inc</span>'
  );
}

function emailLink(email, t) {
  const e = escapeHtml(email);
  return '<a href="mailto:' + e + '" style="color:' + t.text + ';text-decoration:none;">' + e + '</a>';
}

function siteLink(t, config) {
  return (
    '<a href="' + config.COMPANY_URL + '" style="color:' + t.accent +
    ';font-weight:bold;text-decoration:none;">' + config.COMPANY_LABEL + '&nbsp;&#8599;</a>'
  );
}

function mutedLink(href, label, t) {
  return (
    '<a href="' + escapeHtml(normalizeUrl(href)) + '" style="color:' + t.muted +
    ';text-decoration:none;">' + label + '&nbsp;&#8599;</a>'
  );
}

function sep(t) {
  return '<span style="color:' + t.muted + ';">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>';
}

// Links row: email, mode.inc, then LinkedIn / Book time only when provided.
// Empty optional fields disappear cleanly - no orphan separators.
function linksRow(d, t, config) {
  const parts = [emailLink(d.email, t), siteLink(t, config)];
  if (d.linkedin) parts.push(mutedLink(d.linkedin, 'LinkedIn', t));
  if (d.calendar) parts.push(mutedLink(d.calendar, 'Book time', t));
  return parts.join(sep(t));
}

function td(content, styles) {
  return '<tr><td style="font-family:' + FONT + ';' + styles + '">' + content + '</td></tr>';
}

// Deloitte accolade: muted line, only the award itself carries weight.
function accoladeLine(t, config) {
  return (
    escapeHtml(config.ACCOLADE_COMPANY) + '&nbsp;&middot;&nbsp;<strong style="color:' + t.text + ';">' +
    escapeHtml(config.ACCOLADE_AWARD) + '</strong> ' + escapeHtml(config.ACCOLADE_EVENT)
  );
}

// Concept 06 accolade: same treatment, reworded without the company prefix.
function accoladeLine06(t, config) {
  return (
    '<strong style="color:' + t.text + ';">' + escapeHtml(config.ACCOLADE_06_AWARD) + '</strong> ' +
    escapeHtml(config.ACCOLADE_06_EVENT)
  );
}

function valuesRow(t, config) {
  return td(
    config.VALUES.map(escapeHtml).join('&nbsp;&middot;&nbsp;'),
    'border-top:1px solid ' + t.divider + ';font-size:10.5px;font-weight:bold;letter-spacing:1px;line-height:1.5;color:' + t.accent + ';padding:12px 0 0 0;'
  );
}

export function generateSignature(data, concept, theme, config) {
  const cfg = config || CONFIG;
  const t = THEMES[theme] || THEMES.clear;
  const d = {
    name: String(data.name || '').trim(),
    title: String(data.title || '').trim(),
    email: String(data.email || '').trim(),
    linkedin: concept === '01' ? '' : String(data.linkedin || '').trim(),
    calendar: concept === '01' ? '' : String(data.calendar || '').trim(),
  };
  const name = escapeHtml(d.name);
  const title = escapeHtml(d.title);

  const logoBottom = cfg.LOGO_POSITION === 'bottom';
  const rows = [];
  if (!logoBottom) rows.push(td(wordmark(theme, t, cfg), 'padding:0 0 12px 0;'));

  if (concept === '01') {
    rows.push(td('<strong>' + name + '</strong>', 'font-size:15px;line-height:1.4;color:' + t.text + ';padding:0 0 2px 0;'));
    rows.push(td(title, 'font-size:13px;line-height:1.4;color:' + t.muted + ';padding:0 0 12px 0;'));
    rows.push(td(emailLink(d.email, t), 'font-size:13px;line-height:1.4;color:' + t.text + ';padding:0 0 3px 0;'));
    rows.push(td(siteLink(t, cfg), 'font-size:13px;line-height:1.4;padding:0;'));
  } else if (concept === '02') {
    rows.push(td(
      '<strong>' + name + '</strong><span style="color:' + t.muted + ';">&nbsp;&middot;&nbsp;' + title + '</span>',
      'font-size:14px;line-height:1.4;color:' + t.text + ';padding:0 0 10px 0;'
    ));
    rows.push(td(linksRow(d, t, cfg), 'font-size:13px;line-height:1.5;color:' + t.muted + ';padding:0;'));
    rows.push(td(escapeHtml(cfg.MISSION), 'font-size:12px;line-height:1.5;color:' + t.muted + ';padding:10px 0 0 0;'));
  } else if (concept === '04') {
    rows.push(td(
      '<strong>' + name + '</strong><span style="color:' + t.muted + ';">&nbsp;&middot;&nbsp;' + title + '</span>',
      'font-size:14px;line-height:1.4;color:' + t.text + ';padding:0 0 10px 0;'
    ));
    rows.push(td(linksRow(d, t, cfg), 'font-size:13px;line-height:1.5;color:' + t.muted + ';padding:0 0 14px 0;'));
    rows.push(valuesRow(t, cfg));
    rows.push(td(accoladeLine(t, cfg), 'font-size:11px;line-height:1.5;color:' + t.muted + ';padding:10px 0 0 0;'));
  } else if (concept === '05' || concept === '06') {
    rows.push(td(
      '<strong>' + name + '</strong><span style="color:' + t.muted + ';">&nbsp;&middot;&nbsp;' + title + '</span>',
      'font-size:14px;line-height:1.4;color:' + t.text + ';padding:0 0 10px 0;'
    ));
    rows.push(td(linksRow(d, t, cfg), 'font-size:13px;line-height:1.5;color:' + t.muted + ';padding:0 0 10px 0;'));
    rows.push(td(escapeHtml(cfg.MISSION), 'font-size:12px;line-height:1.5;color:' + t.muted + ';padding:0 0 12px 0;'));
    rows.push(td(
      concept === '06' ? accoladeLine06(t, cfg) : accoladeLine(t, cfg),
      'border-top:1px solid ' + t.divider + ';font-size:11px;line-height:1.5;color:' + t.muted + ';padding:12px 0 0 0;'
    ));
  } else {
    rows.push(td('<strong>' + name + '</strong>', 'font-size:15px;line-height:1.4;color:' + t.text + ';padding:0 0 2px 0;'));
    rows.push(td(title, 'font-size:13px;line-height:1.4;color:' + t.muted + ';padding:0 0 12px 0;'));
    rows.push(td(linksRow(d, t, cfg), 'font-size:13px;line-height:1.5;color:' + t.muted + ';padding:0 0 14px 0;'));
    rows.push(valuesRow(t, cfg));
  }

  // Bottom placement: the wordmark closes the signature. Every concept's
  // last content row ends flush (no bottom padding), so a single 14px top
  // gap keeps the same breathing room the top placement has below the logo.
  if (logoBottom) rows.push(td(wordmark(theme, t, cfg), 'padding:14px 0 0 0;'));

  const inner =
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">' +
    rows.join('') + '</table>';

  const shell = (cells) =>
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;">' +
    '<tr>' + cells + '</tr></table>';

  // Concepts carrying brand statements (values/mission footers) get the
  // accent rail: mint on the dark card, violet on clear.
  const railed = concept === '03' || concept === '04' || concept === '05' || concept === '06';

  if (theme === 'dark') {
    if (railed) {
      return shell(
        '<td width="5" style="width:5px;background-color:#00FF9D;border-radius:14px 0 0 14px;font-size:0;line-height:0;">&nbsp;</td>' +
        '<td style="background-color:#000000;border-radius:0 14px 14px 0;padding:20px 24px;">' + inner + '</td>'
      );
    }
    return shell(
      '<td style="background-color:#000000;border-radius:14px;padding:20px 24px;">' + inner + '</td>'
    );
  }
  if (railed) {
    return shell(
      '<td width="3" style="width:3px;background-color:#6D28D9;font-size:0;line-height:0;">&nbsp;</td>' +
      '<td style="padding:2px 0 2px 18px;">' + inner + '</td>'
    );
  }
  return inner;
}
