import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { StringsService } from '../../core/services/strings.service';

@Component({
  selector: 'app-welcome-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" (click)="close()">
        <div class="relative w-full max-w-lg mx-4 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl" (click)="$event.stopPropagation()">
          <button
            (click)="close()"
            class="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors text-[18px]"
          >
            &times;
          </button>

          <div class="px-6 pt-6 pb-4">
            <h2 class="text-[18px] font-semibold text-white">Welcome to Nullabroke</h2>
            <p class="text-[13px] text-[#858585] mt-1">
              Search, explore, and analyze SEC filings with powerful query-driven workflows.
              Build custom queries with dynamic parameters, save them for later, and dive into filing documents instantly.
            </p>
          </div>

          <div class="px-6 pb-4">
            <div class="text-[11px] text-[#858585] uppercase tracking-wide mb-2">Quick tips</div>
            <div class="space-y-2 text-[13px]">
              <div class="flex gap-2">
                <span class="text-[#4ec9b0] flex-none">1.</span>
                <span class="text-[#cccccc]"><strong class="text-white">Use dynamic parameters</strong> &mdash; type <code class="text-[#ce9178] bg-[#1e1e1e] px-1 rounded text-[12px]">{{ '{' }}Label:Type:Default{{ '}' }}</code> in your query to create inline inputs like dropdowns and text fields.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4ec9b0] flex-none">2.</span>
                <span class="text-[#cccccc]"><strong class="text-white">Middle-click queries</strong> &mdash; middle-click any saved query in the sidebar to open it in a new tab.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4ec9b0] flex-none">3.</span>
                <span class="text-[#cccccc]"><strong class="text-white">Pin your favourites</strong> &mdash; use the &vellip; menu on any query to pin it to the top of the list.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4ec9b0] flex-none">4.</span>
                <span class="text-[#cccccc]"><strong class="text-white">Ctrl+Enter to search</strong> &mdash; run your query instantly from the editor without clicking the button.</span>
              </div>
              <div class="flex gap-2">
                <span class="text-[#4ec9b0] flex-none">5.</span>
                <span class="text-[#cccccc]"><strong class="text-white">Default queries are editable</strong> &mdash; modify any default query and it becomes yours. Restore defaults anytime from the &vellip; menu next to "Queries".</span>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-[#3c3c3c] flex items-center justify-between">
            <button
              (click)="dismissForever()"
              class="text-[12px] text-[#6e6e6e] hover:text-[#858585] transition-colors"
            >
              Don't show this again
            </button>
            <button
              hlmBtn
              (click)="close()"
              class="bg-[#0e639c] hover:bg-[#1177bb] text-white text-[13px] px-4"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class WelcomeModalComponent {
  private readonly stringsService = inject(StringsService);
  private static readonly STORAGE_KEY = 'welcome_dismissed';

  readonly visible = signal(false);
  readonly closed = output<void>();

  constructor() {
    this.stringsService.get(WelcomeModalComponent.STORAGE_KEY).pipe(
      takeUntilDestroyed(),
    ).subscribe({
      next: (val) => { if (!val) this.visible.set(true); },
      error: () => this.visible.set(true),
    });
  }

  close() {
    this.visible.set(false);
    this.closed.emit();
  }

  dismissForever() {
    this.visible.set(false);
    this.closed.emit();
    this.stringsService.set(WelcomeModalComponent.STORAGE_KEY, 'true').pipe(
      take(1),
    ).subscribe();
  }
}
