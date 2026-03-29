import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle, lucideEye } from '@ng-icons/lucide';

import { QueryParseError } from '../../../core/models/query-parameter.model';
import { FilingService } from '../../../core/services/filing.service';
import { SavedQueriesService } from '../../../core/services/saved-queries.service';
import { CodeEditorComponent } from '../../../components/code-editor/code-editor.component';
import { createQueryAutocomplete } from '../../../components/code-editor/query-autocomplete';

@Component({
  selector: 'app-filing-query-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filing-query-editor' },
  imports: [NgIcon, CodeEditorComponent],
  providers: [provideIcons({ lucideAlertCircle, lucideEye })],
  template: `
    <div class="bg-[#252526] border-t border-[#3c3c3c]">
      <div class="flex">
        <app-code-editor
          class="flex-1 h-20 border-r border-[#3c3c3c]"
          [class.border-red-500]="!isQueryValid()"
          [class.border-l-2]="!isQueryValid()"
          [value]="peeking() ? peekValue : queryText()"
          [placeholder]="'form_type = \\'8-K\\' order by snowflake desc limit 50'"
          [extensions]="editorExtensions()"
          (valueChange)="onEditorChange($event)"
          (keyboardShortcut)="onShortcut($event)"
        />
      </div>

      <!-- Parse Errors -->
      @if (parseErrors().length > 0) {
        <div class="px-3 py-1.5 bg-[#5a1d1d] border-t border-[#3c3c3c]">
          @for (err of parseErrors(); track err.startIndex) {
            <div class="flex items-center gap-1.5 text-[11px] text-[#f48771]">
              <ng-icon name="lucideAlertCircle" class="text-[12px]" />
              {{ err.message }}
            </div>
          }
        </div>
      }

      <!-- Toolbar -->
      <div class="px-3 py-1.5 text-[11px] text-[#6e6e6e] border-t border-[#3c3c3c] flex items-center justify-between">
        <div class="flex items-center">
          <kbd class="text-[#858585] font-sans">Ctrl+Enter</kbd> to search
          @if (hasParameters()) {
            <span class="ml-3 text-[#4ec9b0]">• Query has parameters</span>
            <button
              class="ml-2 px-1.5 py-0.5 rounded text-[10px] select-none transition-colors"
              [class.bg-[#007acc]]="peeking()"
              [class.text-white]="peeking()"
              [class.text-[#858585]]="!peeking()"
              [class.hover:text-[#cccccc]]="!peeking()"
              [class.hover:bg-[#3c3c3c]]="!peeking()"
              (mousedown)="startPeek()"
              (mouseup)="stopPeek()"
              (mouseleave)="stopPeek()"
              (touchstart)="startPeek()"
              (touchend)="stopPeek()"
              title="Hold to preview the compiled query"
            >
              <ng-icon name="lucideEye" class="text-[10px] mr-0.5 inline-block align-middle" />
              Preview
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class FilingQueryEditorComponent {
  private readonly filingService = inject(FilingService);
  private readonly savedQueriesService = inject(SavedQueriesService);

  readonly queryControl = input.required<FormControl<string>>();
  readonly queryText = input.required<string>();
  readonly isQueryValid = input.required<boolean>();
  readonly parseErrors = input.required<QueryParseError[]>();
  readonly hasParameters = input.required<boolean>();

  readonly searchTriggered = output<void>();

  readonly peeking = signal(false);
  peekValue = '';

  readonly editorExtensions = computed(() => [
    createQueryAutocomplete(this.filingService),
  ]);

  onEditorChange(text: string) {
    if (this.peeking()) return;
    this.queryControl().setValue(text);
  }

  onShortcut(name: string) {
    if (name === 'ctrl-enter') {
      this.searchTriggered.emit();
    }
  }

  startPeek() {
    if (!this.isQueryValid()) return;
    try {
      this.peekValue = this.savedQueriesService.getCompiledQuery();
      this.peeking.set(true);
    } catch {
      // compilation failed — ignore
    }
  }

  stopPeek() {
    if (!this.peeking()) return;
    this.peeking.set(false);
  }
}
