import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  inject, 
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw, lucideSearch, lucideLoader2 } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';

import { QueryParameter } from '../../core/models/query-parameter.model';
import { SavedQueriesService, ParameterValue } from '../../core/services/saved-queries.service';
import { StringInputComponent } from './inputs/string-input.component';
import { NumberInputComponent } from './inputs/number-input.component';
import { FormTypesInputComponent } from './inputs/form-types-input.component';
import { TagsInputComponent } from './inputs/tags-input.component';

/**
 * Component for displaying inline parameter inputs for parameterized queries.
 * Renders horizontally with wrapping, showing a label above each input.
 * Search button is fixed to the right side.
 */
@Component({
  selector: 'app-query-parameters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    HlmButtonImports,
    StringInputComponent,
    NumberInputComponent,
    FormTypesInputComponent,
    TagsInputComponent,
  ],
  providers: [
    provideIcons({ lucideRotateCcw, lucideSearch, lucideLoader2 }),
  ],
  template: `
    <div class="flex items-stretch bg-[#252526] border-t border-[#3c3c3c]">
      <!-- Parameters Area (flexible, wraps) -->
      <div class="flex-1 flex flex-wrap items-end gap-3 px-3 py-2 min-h-[44px]">
        @for (param of parameters(); track param.index) {
          <div class="flex flex-col gap-1 min-w-[120px]">
            <!-- Label -->
            <label class="text-[10px] text-[#858585] uppercase tracking-wide truncate">
              {{ param.label }}
            </label>
            
            <!-- Input based on component type -->
            @switch (param.componentType) {
              @case ('StringInput') {
                <app-string-input
                  [value]="getValueAsString(param.index)"
                  [defaultValue]="param.defaultValue"
                  (valueChange)="onValueChange(param.index, $event)"
                />
              }
              @case ('NumberInput') {
                <app-number-input
                  [value]="getValueAsNumber(param.index)"
                  [defaultValue]="param.defaultValue"
                  (valueChange)="onValueChange(param.index, $event)"
                />
              }
              @case ('FormTypes') {
                <app-form-types-input
                  [value]="getValueAsString(param.index)"
                  [defaultValue]="param.defaultValue"
                  (valueChange)="onValueChange(param.index, $event)"
                />
              }
              @case ('Tags') {
                <app-tags-input
                  [value]="getValueAsStringArray(param.index)"
                  [defaultValue]="param.defaultValue"
                  (valueChange)="onValueChange(param.index, $event)"
                />
              }
              @default {
                <app-string-input
                  [value]="getValueAsString(param.index)"
                  [defaultValue]="param.defaultValue"
                  (valueChange)="onValueChange(param.index, $event)"
                />
              }
            }
          </div>
        }
        
        <!-- Reset All Button (only show if has parameters) -->
        @if (hasParameters()) {
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            (click)="resetAll()"
            class="text-[#858585] hover:text-[#cccccc] self-end mb-0.5"
            title="Reset all parameters to defaults"
          >
            <ng-icon name="lucideRotateCcw" size="sm" class="mr-1" />
            Reset
          </button>
        }
      </div>

      <!-- Search Button (fixed right side) -->
      <button
        (click)="onSearch()"
        [disabled]="searchDisabled()"
        class="flex-none w-24 flex items-center justify-center gap-1.5 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#6e6e6e] text-white text-[13px] border-l border-[#3c3c3c]"
      >
        @if (loading()) {
          <ng-icon name="lucideLoader2" class="text-[16px] animate-spin" />
        } @else {
          <ng-icon name="lucideSearch" class="text-[16px]" />
        }
        Search
      </button>
    </div>
  `,
})
export class QueryParametersComponent {
  private readonly savedQueriesService = inject(SavedQueriesService);

  // Search button inputs
  readonly loading = input<boolean>(false);
  readonly searchDisabled = input<boolean>(false);
  readonly searchClick = output<void>();

  // Direct binding to service state
  readonly parameters = this.savedQueriesService.currentParameters;
  readonly values = this.savedQueriesService.currentValues;

  readonly hasParameters = computed(() => this.parameters().length > 0);

  /**
   * Handle search button click
   */
  onSearch(): void {
    this.searchClick.emit();
  }

  /**
   * Get value at index as string.
   */
  getValueAsString(index: number): string {
    const val = this.values()[index];
    if (val === undefined || val === null) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.join(',');
    return String(val);
  }

  /**
   * Get value at index as number.
   */
  getValueAsNumber(index: number): number {
    const val = this.values()[index];
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * Get value at index as string array.
   */
  getValueAsStringArray(index: number): string[] {
    const val = this.values()[index];
    if (val === undefined || val === null) return [];
    if (Array.isArray(val)) return val.map(String);
    if (typeof val === 'string') {
      return val.split(',').map(s => s.trim()).filter(s => s);
    }
    return [];
  }

  /**
   * Handle value change from an input component.
   */
  onValueChange(index: number, value: ParameterValue): void {
    this.savedQueriesService.setParameterValue(index, value);
  }

  /**
   * Reset all parameters to their default values.
   */
  resetAll(): void {
    this.savedQueriesService.resetAllParameterValues();
  }
}
