import { 
  ChangeDetectionStrategy, 
  Component, 
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmSelectImports } from '@spartan-ng/helm/select';

import { FormTypesService } from '../../../core/services/form-types.service';

/**
 * Form types dropdown input component.
 * Displays SEC filing form types from the API.
 */
@Component({
  selector: 'app-form-types-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BrnSelectImports, HlmSelectImports],
  template: `
    <brn-select
      class="inline-block"
      [placeholder]="getPlaceholder()"
      [value]="internalValue()"
      (valueChange)="onSelect($event)"
    >
      <hlm-select-trigger class="h-7 min-w-[100px] max-w-[150px] text-[12px] bg-[#3c3c3c] border-[#3c3c3c] text-[#cccccc]">
        <hlm-select-value class="text-[#cccccc]">
          <span *brnSelectValue="let value">{{ value }}</span>
        </hlm-select-value>
      </hlm-select-trigger>
      <hlm-select-content class="max-h-[200px] bg-[#252526] border-[#3c3c3c]">
        @for (formType of formTypes(); track formType.code) {
          <hlm-option [value]="formType.code" class="text-[12px] text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
            {{ formType.code }}
            @if (formType.description) {
              <span class="text-[10px] text-[#858585] ml-2">{{ formType.description }}</span>
            }
          </hlm-option>
        }
      </hlm-select-content>
    </brn-select>
  `,
})
export class FormTypesInputComponent {
  private readonly formTypesService = inject(FormTypesService);

  readonly value = input<string>('');
  readonly defaultValue = input<string>('');
  readonly valueChange = output<string>();

  readonly formTypes = this.formTypesService.formTypes;
  readonly internalValue = signal<string>('');

  constructor() {
    // Load form types on init
    this.formTypesService.load();

    // Sync external value to internal state
    effect(() => {
      const val = this.value();
      this.internalValue.set(val);
    }, { allowSignalWrites: true });
  }

  onSelect(newValue: string | string[] | undefined): void {
    // Handle the union type from brn-select
    const stringValue = Array.isArray(newValue) 
      ? newValue[0] ?? '' 
      : newValue ?? '';
    this.internalValue.set(stringValue);
    this.valueChange.emit(stringValue);
  }

  getPlaceholder(): string {
    const def = this.defaultValue();
    if (def) return def;
    return 'Select form type';
  }
}
