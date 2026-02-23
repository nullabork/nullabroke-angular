import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertCircle } from '@ng-icons/lucide';

import { QueryParseError } from '../../../core/models/query-parameter.model';

@Component({
  selector: 'app-filing-query-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filing-query-editor' },
  imports: [ReactiveFormsModule, NgIcon],
  providers: [provideIcons({ lucideAlertCircle })],
  template: `
    <div class="bg-[#252526] border-t border-[#3c3c3c]">
      <div class="flex">
        <textarea
          [formControl]="queryControl()"
          (keydown.control.enter)="searchTriggered.emit()"
          (keydown.meta.enter)="searchTriggered.emit()"
          placeholder="form_type = '8-K' order by snowflake desc limit 50"
          spellcheck="false"
          aria-label="Search query"
          class="flex-1 h-20 px-3 py-2 bg-[#1e1e1e] text-[#d4d4d4] placeholder-[#6e6e6e] text-[13px] font-mono border-r border-[#3c3c3c] focus:outline-none resize-none"
          [class.border-red-500]="!isQueryValid()"
          [class.border-l-2]="!isQueryValid()"
        ></textarea>
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
        <div>
          <kbd class="text-[#858585] font-sans">Ctrl+Enter</kbd> to search
          @if (hasParameters()) {
            <span class="ml-3 text-[#4ec9b0]">• Query has parameters</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class FilingQueryEditorComponent {
  readonly queryControl = input.required<FormControl<string>>();
  readonly isQueryValid = input.required<boolean>();
  readonly parseErrors = input.required<QueryParseError[]>();
  readonly hasParameters = input.required<boolean>();

  readonly searchTriggered = output<void>();
}
