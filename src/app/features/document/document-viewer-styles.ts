/**
 * CSS and scripts injected into fetched document HTML before rendering in iframe.
 * Provides a CSS reset, dark-theme styling matching the application, and
 * a postMessage script for height reporting and text selection.
 */

export const DOCUMENT_STYLES = `
/* ===== CSS Reset ===== */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* ===== Base ===== */
body {
  margin: 0;
  padding: 32px 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  font-size: 16px !important;
  line-height: 1.75 !important;
  color: #d4d4d4 !important;
  background-color: #1e1e1e !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* ===== Override SEC Inline Styles ===== */
span, p, div, td, th, tr, li, a, b, i, u, em, strong, font,
table, tbody, thead, tfoot,
span[style], p[style], div[style], td[style], th[style], tr[style],
table[style], font[style] {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
  color: inherit !important;
  background-color: transparent !important;
}

/* ===== Typography ===== */
h1, h2, h3, h4, h5, h6 {
  color: #e0e0e0 !important;
  font-weight: 600;
  font-family: inherit !important;
  margin: 1.25em 0 0.5em;
  line-height: 1.3;
}

h1 { font-size: 1.5em; }
h2 { font-size: 1.3em; }
h3 { font-size: 1.15em; }
h4 { font-size: 1.05em; }

p {
  margin: 0.6em 0;
}

b, strong {
  color: #ffffff !important;
  font-weight: 600;
}

i, em {
  color: #cccccc !important;
}

a {
  color: #3794ff !important;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* ===== Tables ===== */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  background: #1e1e1e !important;
  border: 1px solid #3c3c3c;
}

th {
  background: #252526 !important;
  color: #cccccc !important;
  font-weight: 600;
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #3c3c3c;
}

td {
  padding: 6px 12px;
  border: 1px solid #2d2d2d;
  vertical-align: top;
  color: #cccccc !important;
}

tr:nth-child(even) { background: #252526 !important; }
tr:nth-child(odd) { background: #1e1e1e !important; }
tr:hover { background: #2a2d2e !important; }

/* Numeric value cells (SEC XBRL classes) */
td.nump, td.num {
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace !important;
  color: #4ec9b0 !important;
}

td.numn {
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace !important;
  color: #f14c4c !important;
}

/* Bold/header rows */
tr.rh td {
  color: #ffffff !important;
  font-weight: 600;
}

/* ===== Lists ===== */
ul, ol {
  margin: 0.6em 0;
  padding-left: 1.5em;
}

li {
  margin: 0.2em 0;
}

/* ===== Images ===== */
img {
  max-width: 100%;
  height: auto;
}

/* ===== Horizontal Rules ===== */
hr {
  border: none;
  border-top: 1px solid #3c3c3c;
  margin: 1.25em 0;
}

/* ===== Blockquotes ===== */
blockquote {
  border-left: 3px solid #3c3c3c;
  padding-left: 16px;
  margin: 1em 0;
  color: #858585 !important;
}

/* ===== Preformatted / Code ===== */
pre, code {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace !important;
  font-size: 13px;
  background: #252526 !important;
  border-radius: 3px;
  color: #d4d4d4 !important;
}

pre {
  padding: 12px;
  overflow-x: auto;
  border: 1px solid #3c3c3c;
  margin: 1em 0;
}

code {
  padding: 2px 4px;
}

/* ===== Selection ===== */
::selection {
  background: #264f78;
  color: #ffffff;
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #424242; border-radius: 4px; }
::-webkit-scrollbar-track { background: #1e1e1e; }
`;

export const DOCUMENT_POSTMESSAGE_SCRIPT = `
<script>
(function() {
  function reportHeight() {
    var h = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body.scrollHeight || 0
    );
    window.parent.postMessage({ t: 'height', d: h }, '*');
  }

  // Report height once DOM is ready
  reportHeight();

  // Re-report after all resources load
  window.addEventListener('load', reportHeight);

  // Re-report on resize
  window.addEventListener('resize', reportHeight);

  // Re-report after each image loads
  document.querySelectorAll('img').forEach(function(img) {
    if (!img.complete) {
      img.addEventListener('load', reportHeight);
      img.addEventListener('error', reportHeight);
    }
  });

  // Text selection tracking
  document.addEventListener('mouseup', function(e) {
    var sel = window.getSelection();
    var text = sel ? sel.toString().trim() : '';
    window.parent.postMessage({
      t: 'selection',
      d: { Text: text },
      m: { x: e.clientX, y: e.clientY }
    }, '*');
  });
})();
</script>
`;
