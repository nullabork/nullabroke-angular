import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { StringsService } from '../../core/services/strings.service';
import { APP_VERSION, CHANGELOG } from './changelog';

@Component({
  selector: 'app-welcome-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports],
  template: `
    @if (visible()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" (click)="close()">
        <div
          class="relative w-full max-w-3xl mx-4 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl flex overflow-hidden max-h-[85vh]"
          (click)="$event.stopPropagation()"
        >
          <!-- Close button -->
          <button
            (click)="close()"
            class="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors text-[18px]"
          >
            &times;
          </button>

          <!-- Left: Logo Splash -->
          <div class="hidden sm:flex w-1/3 flex-none items-center justify-center bg-[#0a2f2f] rounded-l-lg overflow-hidden relative">
            <img src="/logo-anim.svg" alt="" style="position:absolute;width:1000px;height:1000px;min-width:1000px;min-height:1000px;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.7" />
            <img src="/logo.svg" alt="Nullabroke" class="w-3/4 max-w-[180px] opacity-90 relative z-10" />
          </div>

          <!-- Right: Content -->
          <div class="flex-1 flex flex-col min-w-0">
            <!-- Header -->
            <div class="px-6 pt-5 pb-3">
              <h2 class="text-[18px] font-semibold text-white">Welcome to Nullabroke</h2>
              <p class="text-[13px] text-[#858585] mt-1">
                Search, explore, and analyze SEC filings with powerful query-driven workflows.
              </p>
            </div>

            <!-- Tabs -->
            <div class="flex gap-0 px-6 border-b border-[#3c3c3c]">
              <button
                (click)="activeTab.set('changelog')"
                class="px-3 py-1.5 text-[12px] transition-colors border-b-2 -mb-px"
                [class.border-[#4ec9b0]]="activeTab() === 'changelog'"
                [class.text-white]="activeTab() === 'changelog'"
                [class.border-transparent]="activeTab() !== 'changelog'"
                [class.text-[#858585]]="activeTab() !== 'changelog'"
              >
                What's New
              </button>
              <button
                (click)="activeTab.set('tips')"
                class="px-3 py-1.5 text-[12px] transition-colors border-b-2 -mb-px"
                [class.border-[#4ec9b0]]="activeTab() === 'tips'"
                [class.text-white]="activeTab() === 'tips'"
                [class.border-transparent]="activeTab() !== 'tips'"
                [class.text-[#858585]]="activeTab() !== 'tips'"
              >
                Help &amp; Tips
              </button>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              @if (activeTab() === 'changelog') {
                <!-- Changelog Tab -->
                @for (release of changelog; track release.version; let first = $first) {
                  @if (!first) {
                    <div class="border-t border-[#3c3c3c] my-4"></div>
                  }
                  <div class="mb-3">
                    <span
                      class="inline-block px-2 py-0.5 text-[11px] font-mono text-white rounded"
                      [class.bg-[#0e639c]]="first"
                      [class.bg-[#3c3c3c]]="!first"
                    >v{{ release.version }}</span>
                  </div>
                  @for (section of release.sections; track section.title) {
                    <div class="mb-3">
                      <div class="text-[12px] text-[#858585] uppercase tracking-wide mb-1">{{ section.title }}</div>
                      <ul class="space-y-1">
                        @for (item of section.items; track item) {
                          <li class="flex gap-2 text-[13px] text-[#cccccc]">
                            <span class="text-[#4ec9b0] flex-none">-</span>
                            <span>{{ item }}</span>
                          </li>
                        }
                      </ul>
                    </div>
                  }
                }
              } @else {
                <!-- Tips Tab -->
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
              }
            </div>

            <!-- Footer -->
            <div class="px-6 py-3 border-t border-[#3c3c3c] flex items-center justify-between">
              <button
                (click)="dismissUntilUpdate()"
                class="text-[12px] text-[#6e6e6e] hover:text-[#858585] transition-colors"
              >
                Hide until next update
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
      </div>
    }
  `,
})
export class WelcomeModalComponent {
  private readonly stringsService = inject(StringsService);
  private static readonly STORAGE_KEY = 'welcome_dismissed';

  readonly forceShow = input(false);
  readonly visible = signal(false);
  readonly closed = output<void>();
  readonly activeTab = signal<'changelog' | 'tips'>('changelog');

  readonly version = APP_VERSION;
  readonly changelog = CHANGELOG;

  constructor() {
    effect(() => {
      if (this.forceShow()) this.visible.set(true);
    });

    this.stringsService.get(WelcomeModalComponent.STORAGE_KEY).pipe(
      takeUntilDestroyed(),
    ).subscribe({
      next: (val) => {
        if (val !== APP_VERSION) this.visible.set(true);
      },
      error: () => this.visible.set(true),
    });
  }

  close() {
    this.visible.set(false);
    this.closed.emit();
  }

  dismissUntilUpdate() {
    this.visible.set(false);
    this.closed.emit();
    this.stringsService.set(WelcomeModalComponent.STORAGE_KEY, APP_VERSION).pipe(
      take(1),
    ).subscribe();
  }
}
