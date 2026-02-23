import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-filing-status-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filing-status-bar' },
  template: `
    <footer class="flex-none h-6 flex items-center px-3 bg-[#007acc] text-white text-[12px]">
      @if (loading()) {
        <span>Searching...</span>
      } @else if (hasSearched()) {
        <span>{{ resultCount() }} filing(s)</span>
      } @else {
        <span>Ready</span>
      }
    </footer>
  `,
})
export class FilingStatusBarComponent {
  readonly loading = input.required<boolean>();
  readonly hasSearched = input.required<boolean>();
  readonly resultCount = input.required<number>();
}
