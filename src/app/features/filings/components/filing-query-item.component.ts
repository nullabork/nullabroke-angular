import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideEllipsisVertical,
  lucidePin,
  lucidePinOff,
  lucideCopy,
  lucidePencil,
  lucideTrash2,
  lucideRotateCcw,
} from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmInputImports } from '@spartan-ng/helm/input';

import { SavedQuery } from '../../../core/models/query-parameter.model';

@Component({
  selector: 'app-filing-query-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'filing-query-item' },
  imports: [NgIcon, HlmDropdownMenuImports, HlmInputImports],
  providers: [
    provideIcons({
      lucideCheck,
      lucideEllipsisVertical,
      lucidePin,
      lucidePinOff,
      lucideCopy,
      lucidePencil,
      lucideTrash2,
      lucideRotateCcw,
    }),
  ],
  template: `
    @if (isRenaming()) {
      <div
        class="flex items-center gap-1 p-1 w-full"
        [class.bg-[#17171a]]="isBlueprint()"
        [class.rounded]="isBlueprint()"
      >
        <div
          class="w-8 h-8 flex-none rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10"
          [style.background-color]="color()"
        >
          {{ iconText() }}
        </div>
        <input
          hlmInput
          type="text"
          [value]="renameValue()"
          (input)="renameValueChange.emit($any($event.target).value)"
          (keydown)="renameKeydown.emit($event)"
          (blur)="saveRename.emit()"
          placeholder="Enter name..."
          class="flex-1 h-7 text-[12px] bg-[#1e1e1e] border-[#3c3c3c] text-[#cccccc] group-data-[collapsible=icon]:hidden"
          autofocus
        />
        <button
          (click)="saveRename.emit()"
          class="w-7 h-7 flex items-center justify-center text-[#4ec9b0] hover:bg-[#3c3c3c] rounded group-data-[collapsible=icon]:hidden"
          title="Save"
        >
          <ng-icon name="lucideCheck" size="sm" />
        </button>
      </div>
    } @else {
      <a
        [href]="'/filings?q=' + guid()"
        (click)="$event.preventDefault(); select.emit(guid())"
        class="group/item w-full flex items-center p-2 rounded transition-colors text-[#cccccc] cursor-pointer relative no-underline"
        [class.bg-[#17171a]]="isBlueprint()"
        [class.hover:bg-[#2a2a2e]]="isBlueprint()"
        [class.hover:bg-[#3c3c3c]]="!isBlueprint()"
        [class.!bg-[#2a2a30]]="isBlueprint() && isActive()"
        [class.bg-[#37373d]]="!isBlueprint() && isActive()"
        [title]="displayText()"
      >
        <div
          class="w-8 h-8 flex-none rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10"
          [style.background-color]="color()"
        >
          {{ iconText() }}
        </div>
        <div class="ml-3 flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
          <div class="flex items-center gap-1">
            @if (query().pinned) {
              <ng-icon name="lucidePin" class="text-[11px] text-[#4ec9b0] flex-none" />
            }
            <span class="text-[12px] truncate">{{ displayText() }}</span>
          </div>
          @if (query().lastUsed) {
            <div class="text-[10px] text-[#555555]">{{ relativeTime() }}</div>
          }
        </div>
        <button
          [hlmDropdownMenuTrigger]="itemMenu"
          (click)="$event.stopPropagation(); $event.preventDefault()"
          class="ml-auto w-6 h-6 flex items-center justify-center text-[#555555] hover:text-[#cccccc] hover:bg-[#505050] rounded transition-colors group-data-[collapsible=icon]:hidden flex-none"
          title="More actions"
        >
          <ng-icon name="lucideEllipsisVertical" class="text-[16px]" />
        </button>
        <ng-template #itemMenu>
          <hlm-dropdown-menu class="w-48 bg-[#252526] border-[#3c3c3c]">
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem (click)="togglePin.emit(guid())" class="text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
                <ng-icon [name]="query().pinned ? 'lucidePinOff' : 'lucidePin'" class="mr-2" />
                {{ query().pinned ? 'Unpin' : 'Pin' }}
              </button>
              @if (isBlueprint()) {
                <button hlmDropdownMenuItem (click)="resetBlueprint.emit(guid())" class="text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
                  <ng-icon name="lucideRotateCcw" class="mr-2" /> Reset
                </button>
              }
              <button hlmDropdownMenuItem (click)="duplicate.emit(guid())" class="text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
                <ng-icon name="lucideCopy" class="mr-2" /> Duplicate
              </button>
              <button hlmDropdownMenuItem (click)="rename.emit(guid())" class="text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]">
                <ng-icon name="lucidePencil" class="mr-2" /> Rename
              </button>
            </hlm-dropdown-menu-group>
            <hlm-dropdown-menu-separator class="bg-[#3c3c3c]" />
            <hlm-dropdown-menu-group>
              <button hlmDropdownMenuItem (click)="deleteQuery.emit(guid())" class="text-[#f48771] hover:bg-[#5a1d1d] focus:bg-[#5a1d1d]">
                <ng-icon name="lucideTrash2" class="mr-2" /> Delete
              </button>
            </hlm-dropdown-menu-group>
          </hlm-dropdown-menu>
        </ng-template>
      </a>
    }
  `,
})
export class FilingQueryItemComponent {
  // Inputs
  readonly guid = input.required<string>();
  readonly query = input.required<SavedQuery>();
  readonly isActive = input.required<boolean>();
  readonly isRenaming = input.required<boolean>();
  readonly renameValue = input.required<string>();
  readonly color = input.required<string>();
  readonly iconText = input.required<string>();
  readonly displayText = input.required<string>();
  readonly relativeTime = input<string>('');
  readonly isBlueprint = input<boolean>(false);

  // Outputs
  readonly select = output<string>();
  readonly togglePin = output<string>();
  readonly duplicate = output<string>();
  readonly rename = output<string>();
  readonly deleteQuery = output<string>();
  readonly resetBlueprint = output<string>();
  readonly renameKeydown = output<KeyboardEvent>();
  readonly saveRename = output<void>();
  readonly renameValueChange = output<string>();
}
