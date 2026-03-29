import {
  ViewPlugin,
  Decoration,
  DecorationSet,
  EditorView,
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

const parameterMark = Decoration.mark({ class: 'cm-parameter-syntax' });

/**
 * ViewPlugin that highlights {Label:Type:Default|modifier} parameter syntax
 * with a distinct teal color. Uses the same regex pattern as QueryParserService.
 */
export const parameterHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc.toString();
  const regex = /(?<!\\)\{([^{}]*?)(?<!\\)\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(doc)) !== null) {
    builder.add(match.index, match.index + match[0].length, parameterMark);
  }
  return builder.finish();
}
