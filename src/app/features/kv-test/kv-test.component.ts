import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserKvService, KVEntry } from '../../core/services/user-kv.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-kv-test',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <h1>KV Store Test</h1>
        <p class="user-id">User ID: <code>{{ userService.guid() }}</code></p>
      </header>

      <section class="section">
        <h2>Set Value</h2>
        <div class="form-row">
          <input
            type="text"
            [(ngModel)]="setKey"
            placeholder="Key"
            class="input"
          />
          <input
            type="text"
            [(ngModel)]="setValue"
            placeholder="Value"
            class="input"
          />
          <button (click)="set()" class="btn btn-primary" [disabled]="loading()">
            Set
          </button>
        </div>
      </section>

      <section class="section">
        <h2>Get Value</h2>
        <div class="form-row">
          <input
            type="text"
            [(ngModel)]="getKey"
            placeholder="Key"
            class="input"
          />
          <button (click)="get()" class="btn btn-primary" [disabled]="loading()">
            Get
          </button>
        </div>
        @if (getValue()) {
          <div class="result">
            <strong>Result:</strong> {{ getValue() }}
          </div>
        }
      </section>

      <section class="section">
        <h2>Get All</h2>
        <button (click)="getAll()" class="btn btn-primary" [disabled]="loading()">
          Fetch All
        </button>
        @if (allEntries().length > 0) {
          <div class="entries">
            @for (entry of allEntries(); track entry.key) {
              <div class="entry">
                <code class="entry-key">{{ entry.key }}</code>
                <span class="entry-value">{{ entry.value }}</span>
                <button (click)="deleteKey(entry.key)" class="btn btn-small btn-danger">
                  Delete
                </button>
              </div>
            }
          </div>
        } @else if (fetched()) {
          <div class="empty">No entries found</div>
        }
      </section>

      <section class="section">
        <h2>Delete</h2>
        <div class="form-row">
          <input
            type="text"
            [(ngModel)]="deleteKeyInput"
            placeholder="Key to delete"
            class="input"
          />
          <button (click)="deleteByInput()" class="btn btn-danger" [disabled]="loading()">
            Delete
          </button>
        </div>
      </section>

      <!-- Status -->
      @if (loading()) {
        <div class="status loading">Loading...</div>
      }
      @if (error()) {
        <div class="status error">Error: {{ error() }}</div>
      }
      @if (success()) {
        <div class="status success">{{ success() }}</div>
      }

      <footer class="footer">
        <a href="/" class="btn btn-secondary">← Back to App</a>
      </footer>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem 1rem;
      padding-bottom: 60px;
    }

    .header {
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #cccccc;
      margin: 0 0 0.5rem 0;
    }

    .user-id {
      font-size: 0.8rem;
      color: #808080;
      margin: 0;
    }

    .user-id code {
      background: #2d2d2d;
      padding: 0.2rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      color: #4ec9b0;
    }

    .section {
      background: #252526;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .section h2 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #cccccc;
      margin: 0 0 0.75rem 0;
    }

    .form-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .input {
      flex: 1;
      min-width: 120px;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      font-family: inherit;
      background: #3c3c3c;
      border: 1px solid #4c4c4c;
      border-radius: 3px;
      color: #cccccc;
      outline: none;
    }

    .input:focus {
      border-color: #0e639c;
    }

    .input::placeholder {
      color: #6e6e6e;
    }

    .btn {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      font-family: inherit;
      border-radius: 3px;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #0e639c;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1177bb;
    }

    .btn-secondary {
      background: #3c3c3c;
      color: #cccccc;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #4c4c4c;
    }

    .btn-danger {
      background: #5a1d1d;
      color: #f14c4c;
    }

    .btn-danger:hover:not(:disabled) {
      background: #6e2424;
    }

    .btn-small {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .result {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #2d2d2d;
      border-radius: 3px;
      font-size: 0.85rem;
      color: #cccccc;
      word-break: break-all;
    }

    .entries {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .entry {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #2d2d2d;
      border-radius: 3px;
    }

    .entry-key {
      font-size: 0.8rem;
      color: #4ec9b0;
      background: #1e1e1e;
      padding: 0.15rem 0.4rem;
      border-radius: 2px;
    }

    .entry-value {
      flex: 1;
      font-size: 0.85rem;
      color: #cccccc;
      word-break: break-all;
    }

    .empty {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #6e6e6e;
      font-style: italic;
    }

    .status {
      padding: 0.75rem 1rem;
      border-radius: 4px;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }

    .status.loading {
      background: #2d2d2d;
      color: #808080;
    }

    .status.error {
      background: rgba(241, 76, 76, 0.1);
      border: 1px solid #5a1d1d;
      color: #f14c4c;
    }

    .status.success {
      background: rgba(78, 201, 176, 0.1);
      border: 1px solid #2d5c4a;
      color: #4ec9b0;
    }

    .footer {
      margin-top: 2rem;
    }
  `],
})
export class KvTestComponent {
  protected userService = inject(UserService);
  private kvService = inject(UserKvService);

  // Form inputs
  setKey = '';
  setValue = '';
  getKey = '';
  deleteKeyInput = '';

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  getValue = signal<string | null>(null);
  allEntries = signal<KVEntry[]>([]);
  fetched = signal(false);

  private clearStatus() {
    this.error.set(null);
    this.success.set(null);
  }

  set() {
    if (!this.setKey || !this.setValue) return;
    
    this.clearStatus();
    this.loading.set(true);

    this.kvService.set(this.setKey, this.setValue).subscribe({
      next: () => {
        this.success.set(`Set "${this.setKey}" = "${this.setValue}"`);
        this.loading.set(false);
        this.setKey = '';
        this.setValue = '';
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to set value');
        this.loading.set(false);
      },
    });
  }

  get() {
    if (!this.getKey) return;

    this.clearStatus();
    this.loading.set(true);
    this.getValue.set(null);

    this.kvService.get(this.getKey).subscribe({
      next: (value) => {
        this.getValue.set(value ?? '(null)');
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to get value');
        this.loading.set(false);
      },
    });
  }

  getAll() {
    this.clearStatus();
    this.loading.set(true);
    this.fetched.set(false);

    this.kvService.getAll().subscribe({
      next: (entries) => {
        this.allEntries.set(entries);
        this.fetched.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to fetch entries');
        this.loading.set(false);
        this.fetched.set(true);
      },
    });
  }

  deleteKey(key: string) {
    this.clearStatus();
    this.loading.set(true);

    this.kvService.delete(key).subscribe({
      next: () => {
        this.success.set(`Deleted "${key}"`);
        this.allEntries.update(entries => entries.filter(e => e.key !== key));
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Failed to delete');
        this.loading.set(false);
      },
    });
  }

  deleteByInput() {
    if (!this.deleteKeyInput) return;
    this.deleteKey(this.deleteKeyInput);
    this.deleteKeyInput = '';
  }
}

