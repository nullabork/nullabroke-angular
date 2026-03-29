import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { FavoritesService } from '../../../core/services/favorites.service';

/**
 * Read-only input that displays favorite IDs formatted per the modifier.
 * Does not allow user editing — the value comes from FavoritesService.
 */
@Component({
  selector: 'app-favorites-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmInputImports],
  template: `
    <input
      hlmInput
      type="text"
      readonly
      class="h-7 text-[12px] bg-[#1e1e1e] border-[#3c3c3c] text-[#858585] min-w-[140px] max-w-[300px] cursor-default"
      [value]="displayText()"
      [placeholder]="placeholder()"
      [title]="displayText()"
    />
  `,
})
export class FavoritesInputComponent {
  private readonly favoritesService = inject(FavoritesService);

  readonly value = input<string>('');
  readonly defaultValue = input<string>('');
  readonly modifier = input<string>('');
  readonly valueChange = output<string>();

  readonly placeholder = computed(() => {
    if (!this.favoritesService.loaded()) return 'Loading...';
    if (!this.favoritesService.hasFavorites()) return 'No favorites';
    return '';
  });

  readonly displayText = computed(() => {
    const ids = this.favoritesService.favoriteIds();
    if (ids.length === 0) return '';

    switch (this.modifier()) {
      case 'array':
        return `(${ids.join(',')})`;
      case 'pgarray':
        return `array[${ids.join(',')}]`;
      case 'first':
        return String(ids[0]);
      case 'last':
        return String(ids[ids.length - 1]);
      case 'csv':
      default:
        return ids.join(',');
    }
  });
}
