import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, Subject, debounceTime, switchMap, take } from 'rxjs';
import { StringsService } from './strings.service';

const STORAGE_KEY = 'filing-favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly stringsService = inject(StringsService);
  private readonly saveSubject = new Subject<void>();

  readonly favoriteIds = signal<number[]>([]);
  readonly loaded = signal(false);
  readonly favoriteIdSet = computed(() => new Set(this.favoriteIds()));
  readonly hasFavorites = computed(() => this.favoriteIds().length > 0);

  constructor() {
    this.load();

    // Debounced persistence
    this.saveSubject.pipe(
      debounceTime(500),
      switchMap(() =>
        this.stringsService.setJson(STORAGE_KEY, this.favoriteIds()).pipe(
          catchError(err => {
            console.error('Failed to save favorites', err);
            return of(null);
          }),
        ),
      ),
    ).subscribe();
  }

  private load() {
    this.stringsService.getJson<number[]>(STORAGE_KEY).pipe(
      catchError(() => of(null)),
      take(1),
    ).subscribe(ids => {
      if (Array.isArray(ids)) {
        this.favoriteIds.set(ids);
      }
      this.loaded.set(true);
    });
  }

  isFavorite(id: number): boolean {
    return this.favoriteIdSet().has(id);
  }

  addFavorite(id: number) {
    if (this.isFavorite(id)) return;
    this.favoriteIds.update(ids => [...ids, id]);
    this.saveSubject.next();
  }

  removeFavorite(id: number) {
    this.favoriteIds.update(ids => ids.filter(i => i !== id));
    this.saveSubject.next();
  }
}
