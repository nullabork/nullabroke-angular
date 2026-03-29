import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideStar, lucidePlus, lucideX } from '@ng-icons/lucide';
import { TabEntry } from '../../../core/services/tab-manager.service';

@Component({
  selector: 'app-filing-tab-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [provideIcons({ lucideStar, lucidePlus, lucideX })],
  template: `
    <div class="tab-bar">
      <!-- Favorites tab -->
      @if (showFavoritesTab()) {
        <button
          class="tab"
          [class.tab-active]="activeIndex() === -1"
          (click)="tabSelected.emit(-1)"
        >
          <ng-icon name="lucideStar" class="text-[12px] mr-1" />
          <span class="tab-label">Favorites</span>
        </button>
      }

      <!-- Query tabs -->
      @for (tab of tabs(); track tab.queryGuid; let i = $index) {
        <button
          class="tab"
          [class.tab-active]="activeIndex() === i"
          (click)="tabSelected.emit(i)"
          [title]="queryNames().get(tab.queryGuid) ?? 'Untitled'"
        >
          <span class="tab-label">{{ queryNames().get(tab.queryGuid) ?? 'Untitled' }}</span>
          @if (i > 0) {
            <span
              class="tab-close"
              (click)="$event.stopPropagation(); tabClosed.emit(i)"
              title="Close tab"
            >
              <ng-icon name="lucideX" class="text-[10px]" />
            </span>
          }
        </button>
      }

      <!-- Add tab button -->
      <button class="tab-add" (click)="newTabClicked.emit()" title="New tab">
        <ng-icon name="lucidePlus" class="text-[12px]" />
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .tab-bar {
      display: flex;
      align-items: stretch;
      height: 100%;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: #555 transparent;
    }

    .tab-bar::-webkit-scrollbar {
      height: 3px;
    }
    .tab-bar::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 2px;
    }
    .tab-bar::-webkit-scrollbar-track {
      background: transparent;
    }

    .tab {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      max-width: 180px;
      padding: 0 12px;
      font-size: 12px;
      color: #858585;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s, background 0.15s;
      gap: 4px;
    }

    .tab:hover {
      color: #cccccc;
      background: #2a2a2e;
    }

    .tab-active {
      color: #cccccc;
      background: #1e1e1e;
      border-bottom-color: #007acc;
    }

    .tab-label {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tab-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 3px;
      color: #858585;
      flex-shrink: 0;
    }

    .tab-close:hover {
      color: #ffffff;
      background: #505050;
    }

    .tab-add {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 28px;
      color: #858585;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.15s;
    }

    .tab-add:hover {
      color: #cccccc;
    }
  `,
})
export class FilingTabBarComponent {
  readonly tabs = input.required<TabEntry[]>();
  readonly activeIndex = input.required<number>();
  readonly showFavoritesTab = input(false);
  readonly queryNames = input.required<Map<string, string>>();

  readonly tabSelected = output<number>();
  readonly tabClosed = output<number>();
  readonly newTabClicked = output<void>();
}
