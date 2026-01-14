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
 * String input component for query parameters.
 * Simple text input with styling.
 */
@Component({
  selector: 'app-string-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, HlmInputImports],
  template: `
    <input
      hlmInput
      type="text"
      class="h-7 text-[12px] bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] min-w-[100px] max-w-[200px]"
      [ngModel]="internalValue()"
      (ngModelChange)="onInput($event)"
      [placeholder]="defaultValue() || 'Enter text...'"
    />
  `,
})
export class StringInputComponent {
  readonly value = input<string>('');
  readonly defaultValue = input<string>('');
  readonly valueChange = output<string>();

  readonly internalValue = signal<string>('');

  constructor() {
    // Sync external value to internal state
    effect(() => {
      const val = this.value();
      this.internalValue.set(val);
    }, { allowSignalWrites: true });
  }

  onInput(newValue: string): void {
    this.internalValue.set(newValue);
    this.valueChange.emit(newValue);
  }
}
