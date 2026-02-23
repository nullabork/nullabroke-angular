import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppChromeService {
  readonly visible = signal(false);
}
