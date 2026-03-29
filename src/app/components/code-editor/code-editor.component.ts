import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { sql, PostgreSQL } from '@codemirror/lang-sql';

import { darkTheme, highlightStyle } from './editor-theme';
import { parameterHighlighter } from './query-language';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #editorHost class="editor-host"></div>`,
  styles: `
    :host {
      display: block;
      overflow: hidden;
    }
    .editor-host {
      height: 100%;
    }
    .editor-host .cm-editor {
      height: 100%;
    }
    .editor-host .cm-editor.cm-focused {
      outline: none;
    }
  `,
})
export class CodeEditorComponent {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly value = input<string>('');
  readonly placeholder = input<string>('');
  readonly extensions = input<Extension[]>([]);

  readonly valueChange = output<string>();
  readonly keyboardShortcut = output<string>();

  private readonly editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private view: EditorView | null = null;
  private isExternalUpdate = false;

  constructor() {
    afterNextRender(() => {
      this.createEditor();
    });

    // Sync external value changes into the editor
    effect(() => {
      const val = this.value();
      const view = this.view;
      if (!view) return;
      const current = view.state.doc.toString();
      if (val !== current) {
        this.isExternalUpdate = true;
        view.dispatch({
          changes: { from: 0, to: current.length, insert: val },
        });
        this.isExternalUpdate = false;
      }
    });

    this.destroyRef.onDestroy(() => {
      this.view?.destroy();
      this.view = null;
    });
  }

  private createEditor() {
    const host = this.editorHost().nativeElement;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && !this.isExternalUpdate) {
        const text = update.state.doc.toString();
        this.zone.run(() => this.valueChange.emit(text));
      }
    });

    // Ctrl+Enter / Cmd+Enter shortcut
    const searchKeymap = keymap.of([
      {
        key: 'Ctrl-Enter',
        mac: 'Cmd-Enter',
        run: () => {
          this.zone.run(() => this.keyboardShortcut.emit('ctrl-enter'));
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: this.value(),
      extensions: [
        searchKeymap,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...closeBracketsKeymap]),
        closeBrackets(),
        sql({ dialect: PostgreSQL }),
        darkTheme,
        highlightStyle,
        parameterHighlighter,
        cmPlaceholder(this.placeholder()),
        updateListener,
        EditorView.lineWrapping,
        ...this.extensions(),
      ],
    });

    this.zone.runOutsideAngular(() => {
      this.view = new EditorView({ state, parent: host });
    });
  }
}
