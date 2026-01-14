import { 
  ChangeDetectionStrategy, 
  Component, 
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputImports } from '@spartan-ng/helm/input';

/**
 * Number input component for query parameters.
 * Numeric input with validation.
 */
@Component({
  selector: 'app-number-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, HlmInputImports],
  template: `
    <input
      hlmInput
      type="number"
      class="h-7 text-[12px] bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] min-w-[80px] max-w-[120px]"
      [ngModel]="internalValue()"
      (ngModelChange)="onInput($event)"
      [placeholder]="getPlaceholder()"
    />
  `,
})
export class NumberInputComponent {
  readonly value = input<number>(0);
  readonly defaultValue = input<string>('');
  readonly valueChange = output<number>();

  readonly internalValue = signal<number>(0);

  constructor() {
    // Sync external value to internal state
    effect(() => {
      const val = this.value();
      this.internalValue.set(val);
    }, { allowSignalWrites: true });
  }

  onInput(newValue: number | string): void {
    const num = typeof newValue === 'string' ? parseFloat(newValue) : newValue;
    const safeNum = isNaN(num) ? 0 : num;
    this.internalValue.set(safeNum);
    this.valueChange.emit(safeNum);
  }

  getPlaceholder(): string {
    const def = this.defaultValue();
    if (def) return def;
    return '0';
  }
}
