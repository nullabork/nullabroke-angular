import { 
  ChangeDetectionStrategy, 
  Component, 
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideChevronDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

import { TagsService } from '../../../core/services/tags.service';

/**
 * Tags multi-select input component.
 * Allows selecting multiple tags from a dropdown.
 */
@Component({
  selector: 'app-tags-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    HlmButtonImports,
    HlmDropdownMenuImports,
  ],
  providers: [
    provideIcons({ lucideX, lucideChevronDown }),
  ],
  template: `
    <div class="flex flex-col gap-1">
      <!-- Selected tags display -->
      <div class="flex flex-wrap gap-1 min-h-[28px] items-center">
        @for (tag of selectedTags(); track tag) {
          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#0e639c] text-white text-[10px] rounded">
            {{ tag }}
            <button
              type="button"
              (click)="removeTag(tag)"
              class="hover:bg-[#1177bb] rounded-sm"
            >
              <ng-icon name="lucideX" size="xs" />
            </button>
          </span>
        }
        
        <!-- Dropdown trigger -->
        <button
          hlmBtn
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-[11px] text-[#858585] hover:text-[#cccccc]"
          [hlmDropdownMenuTrigger]="tagsMenu"
        >
          @if (selectedTags().length === 0) {
            Select tags
          } @else {
            Add more
          }
          <ng-icon name="lucideChevronDown" size="xs" class="ml-1" />
        </button>
      </div>
    </div>

    <!-- Tags dropdown menu -->
    <ng-template #tagsMenu>
      <hlm-dropdown-menu class="w-48 max-h-[200px] overflow-y-auto bg-[#252526] border-[#3c3c3c]">
        <hlm-dropdown-menu-label class="text-[11px] text-[#858585]">Available Tags</hlm-dropdown-menu-label>
        <hlm-dropdown-menu-separator class="bg-[#3c3c3c]" />
        @for (tag of availableTags(); track tag.name) {
          <button
            hlmDropdownMenuCheckbox
            [checked]="isSelected(tag.name)"
            (triggered)="toggleTag(tag.name)"
            class="text-[#cccccc] hover:bg-[#3c3c3c] focus:bg-[#3c3c3c]"
          >
            <hlm-dropdown-menu-checkbox-indicator />
            <span class="text-[12px]">{{ tag.name }}</span>
          </button>
        }
        @if (availableTags().length === 0) {
          <div class="px-2 py-1 text-[11px] text-[#858585]">No tags available</div>
        }
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
export class TagsInputComponent {
  private readonly tagsService = inject(TagsService);

  readonly value = input<string[]>([]);
  readonly defaultValue = input<string>('');
  readonly valueChange = output<string[]>();

  readonly availableTags = this.tagsService.tags;
  readonly selectedTags = signal<string[]>([]);

  constructor() {
    // Load tags on init
    this.tagsService.load();

    // Sync external value to internal state
    effect(() => {
      const val = this.value();
      this.selectedTags.set([...val]);
    }, { allowSignalWrites: true });
  }

  isSelected(tagName: string): boolean {
    return this.selectedTags().includes(tagName);
  }

  toggleTag(tagName: string): void {
    const current = this.selectedTags();
    let newTags: string[];
    
    if (current.includes(tagName)) {
      newTags = current.filter(t => t !== tagName);
    } else {
      newTags = [...current, tagName];
    }
    
    this.selectedTags.set(newTags);
    this.valueChange.emit(newTags);
  }

  removeTag(tagName: string): void {
    const newTags = this.selectedTags().filter(t => t !== tagName);
    this.selectedTags.set(newTags);
    this.valueChange.emit(newTags);
  }
}
