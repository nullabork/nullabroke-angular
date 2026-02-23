import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

import { Filing } from '../../../core/models/filing.model';

@Component({
  selector: 'app-filing-result-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filing-result-row' },
  imports: [RouterLink, DatePipe],
  template: `
    <a
      [routerLink]="['/filings/document', filing().accessionNumber]"
      class="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 w-full px-3 py-2 text-left hover:bg-[#2a2d2e] cursor-pointer no-underline"
      role="listitem"
    >
      <!-- Cell 1: Description + Company name (expands) -->
      <div class="flex flex-col min-w-0">
        <div class="flex items-center gap-2">
          @if (filing().ticker) {
            <span class="flex-none text-[13px] font-medium text-[#4ec9b0]">{{ filing().ticker }}</span>
            <span class="text-[13px] text-[#555555]">-</span>
          }
          <span class="text-[13px] font-medium text-[#e0e0e0] truncate">
            {{ filing().description || filing().companyConformedName }}
          </span>
          <span class="flex-none px-1 py-0 text-[10px] font-medium bg-[#0e639c] text-white">
            {{ filing().formType }}
          </span>
        </div>
        @if (filing().description) {
          <div class="text-[11px] text-[#858585] mt-0.5 truncate">
            {{ filing().companyConformedName }}
          </div>
        }
      </div>

      <!-- Cell 2: Tags -->
      <div class="flex items-center gap-1 flex-wrap justify-end">
        @for (tag of filing().tags; track tag) {
          <span class="px-1.5 py-0 text-[10px] font-medium bg-[#333333] text-[#a0a0a0] rounded">
            {{ tag }}
          </span>
        }
      </div>

      <!-- Cell 3: Date -->
      <div class="text-[11px] text-[#858585] font-mono whitespace-nowrap">
        {{ filing().dateFiled | date:'mediumDate' }}
      </div>
    </a>
  `,
})
export class FilingResultRowComponent {
  readonly filing = input.required<Filing>();
}
