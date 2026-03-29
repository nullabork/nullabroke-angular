import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/** Dark theme matching the app's VS Code-like color scheme */
export const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily:
        "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
      fontSize: '13px',
    },
    '.cm-content': {
      caretColor: '#d4d4d4',
      padding: '8px 12px',
      minHeight: '64px',
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#d4d4d4' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: '#264f78',
    },
    '.cm-gutters': { display: 'none' },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '&.cm-focused .cm-activeLine': { backgroundColor: '#2a2a2a' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent' },
    '.cm-scroller': { overflow: 'auto' },

    /* Parameter syntax {Label:Type:Default} */
    '.cm-parameter-syntax': { color: '#4ec9b0', fontWeight: 'bold' },

    /* Autocomplete tooltip */
    '.cm-tooltip': {
      backgroundColor: '#252526',
      border: '1px solid #3c3c3c',
      color: '#d4d4d4',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul': { fontFamily: 'inherit', fontSize: '12px' },
      '& > ul > li': { padding: '2px 8px' },
      '& > ul > li[aria-selected]': { backgroundColor: '#04395e', color: '#ffffff' },
    },
    '.cm-tooltip-autocomplete .cm-completionIcon': {
      display: 'none',
    },
    '.cm-completionLabel': { color: '#d4d4d4' },
    '.cm-completionDetail': { color: '#858585', fontStyle: 'italic', marginLeft: '8px' },
    '.cm-completionMatchedText': { color: '#4ec9b0', textDecoration: 'none' },

    /* Section headers in autocomplete */
    '.cm-completionSection': {
      color: '#858585',
      fontSize: '10px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      padding: '4px 8px 2px',
      borderBottom: '1px solid #3c3c3c',
    },

    /* Placeholder */
    '.cm-placeholder': { color: '#6e6e6e', fontStyle: 'normal' },
  },
  { dark: true },
);

/** SQL-like syntax highlighting colors */
export const highlightStyle = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.keyword, color: '#569cd6' },
    { tag: tags.string, color: '#ce9178' },
    { tag: tags.number, color: '#b5cea8' },
    { tag: tags.operator, color: '#d4d4d4' },
    { tag: tags.comment, color: '#6a9955' },
    { tag: [tags.function(tags.variableName), tags.standard(tags.variableName)], color: '#dcdcaa' },
    { tag: tags.typeName, color: '#4ec9b0' },
    { tag: tags.bool, color: '#569cd6' },
    { tag: tags.null, color: '#569cd6' },
    { tag: tags.punctuation, color: '#d4d4d4' },
  ]),
);
