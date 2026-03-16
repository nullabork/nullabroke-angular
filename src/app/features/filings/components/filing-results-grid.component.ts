import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  ColumnState,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  themeQuartz,
  ValueFormatterParams,
} from 'ag-grid-community';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';

import { Filing } from '../../../core/models/filing.model';
import { StringsService } from '../../../core/services/strings.service';

ModuleRegistry.registerModules([AllCommunityModule]);

const GRID_STATE_KEY = 'filing-grid-column-state';

function hash32(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mixHash(a: number, b: number): number {
  let h = a ^ b;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return h ^ (h >>> 16);
}

const tagColorCache = new Map<string, string>();

function tagColor(str: string): string {
  const key = str.trim().toLowerCase();
  let color = tagColorCache.get(key);
  if (color) return color;

  const h = mixHash(hash32(key), hash32('14'));
  const hue = (h % 360 + 360) % 360;
  const sat = 68 + ((h >> 8) % 22);
  const lig = 74 + ((h >> 16) % 10);
  const s = sat / 100, l = lig / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  color = `#${f(0)}${f(8)}${f(4)}`;
  tagColorCache.set(key, color);
  return color;
}

interface ColumnInfo {
  colId: string;
  headerName: string;
  hide: boolean;
}

@Component({
  selector: 'app-filing-results-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular],
  template: `
    <div class="grid-wrapper">
      <!-- Toolbar -->
      <div class="grid-toolbar">
        <span class="result-count">{{ rowData().length }} results</span>
        <div class="toolbar-spacer"></div>
        <div class="columns-dropdown">
          <button
            class="columns-btn"
            (click)="toggleColumnPanel($event)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Columns
          </button>
          @if (showColumnPanel()) {
            <div class="column-panel-backdrop" (click)="showColumnPanel.set(false)"></div>
            <div class="column-panel">
              <div class="column-panel-header">Toggle Columns</div>
              <div class="column-panel-list">
                @for (col of columnList(); track col.colId) {
                  <label class="column-option">
                    <input
                      type="checkbox"
                      [checked]="!col.hide"
                      (change)="toggleColumnVisibility(col.colId)"
                    />
                    <span>{{ col.headerName }}</span>
                  </label>
                }
              </div>
              <div class="column-panel-footer">
                <button class="show-all-btn" (click)="showAllColumns()">Show All</button>
                <button class="reset-btn" (click)="resetColumns()">Reset</button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- AG Grid -->
      <ag-grid-angular
        class="grid-container"
        [theme]="theme"
        [rowData]="rowData()"
        [columnDefs]="columnDefs()"
        [defaultColDef]="defaultColDef"
        [suppressCellFocus]="true"
        [animateRows]="false"
        [rowHeight]="36"
        [headerHeight]="32"
        (gridReady)="onGridReady($event)"
        (columnMoved)="onColumnStateChanged()"
        (columnResized)="onColumnStateChanged()"
        (columnVisible)="onColumnStateChanged()"
        (columnPinned)="onColumnStateChanged()"
        (sortChanged)="onColumnStateChanged()"
        (rowClicked)="onRowClicked($event)"
      />

      <!-- Custom right-click context menu for column headers -->
      @if (headerContextMenu()) {
        <div class="ctx-backdrop" (click)="closeContextMenu()" (contextmenu)="closeContextMenu()"></div>
        <div
          class="ctx-menu"
          [style.left.px]="headerContextMenu()!.x"
          [style.top.px]="headerContextMenu()!.y"
        >
          <div class="ctx-menu-header">{{ headerContextMenu()!.headerName }}</div>
          <button class="ctx-menu-item" (click)="contextPinColumn('left')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>
            Pin Left
          </button>
          <button class="ctx-menu-item" (click)="contextPinColumn('right')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z"/></svg>
            Pin Right
          </button>
          <button class="ctx-menu-item" (click)="contextPinColumn(null)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            No Pin
          </button>
          <div class="ctx-menu-separator"></div>
          <button class="ctx-menu-item" (click)="contextAutosizeColumn()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12H3"/><path d="m15 6 6 6-6 6"/><path d="m9 18-6-6 6-6"/></svg>
            Autosize Column
          </button>
          <button class="ctx-menu-item" (click)="contextHideColumn()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
            Hide Column
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .grid-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .grid-toolbar {
      display: flex;
      align-items: center;
      height: 28px;
      padding: 0 8px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
      gap: 8px;
    }

    .result-count {
      font-size: 11px;
      color: #858585;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .columns-dropdown {
      position: relative;
    }

    .columns-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      font-size: 11px;
      color: #858585;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 3px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }

    .columns-btn:hover {
      color: #cccccc;
      background: #3c3c3c;
    }

    .column-panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99;
    }

    .column-panel {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 100;
      width: 240px;
      max-height: 400px;
      display: flex;
      flex-direction: column;
      background: #252526;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      margin-top: 4px;
    }

    .column-panel-header {
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #858585;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #3c3c3c;
    }

    .column-panel-list {
      flex: 1;
      overflow-y: auto;
      padding: 4px 0;
    }

    .column-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      font-size: 12px;
      color: #cccccc;
      cursor: pointer;
      transition: background 0.1s;
    }

    .column-option:hover {
      background: #2a2d2e;
    }

    .column-option input[type="checkbox"] {
      appearance: none;
      width: 14px;
      height: 14px;
      border: 1px solid #5a5a5a;
      border-radius: 2px;
      background: #3c3c3c;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
    }

    .column-option input[type="checkbox"]:checked {
      background: #007acc;
      border-color: #007acc;
    }

    .column-option input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      left: 3px;
      top: 0px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .column-panel-footer {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      border-top: 1px solid #3c3c3c;
    }

    .show-all-btn,
    .reset-btn {
      flex: 1;
      padding: 4px 8px;
      font-size: 11px;
      font-family: inherit;
      border: 1px solid #3c3c3c;
      border-radius: 3px;
      cursor: pointer;
      transition: all 0.15s;
      color: #cccccc;
      background: transparent;
    }

    .show-all-btn:hover,
    .reset-btn:hover {
      background: #3c3c3c;
    }

    .grid-container {
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    /* Context menu */
    .ctx-backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .ctx-menu {
      position: fixed;
      z-index: 200;
      min-width: 180px;
      background: #252526;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      padding: 4px 0;
    }

    .ctx-menu-header {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #858585;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #3c3c3c;
      margin-bottom: 4px;
    }

    .ctx-menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      font-size: 12px;
      font-family: inherit;
      color: #cccccc;
      background: transparent;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s;
    }

    .ctx-menu-item:hover {
      background: #2a2d2e;
    }

    .ctx-menu-item svg {
      flex-shrink: 0;
      opacity: 0.7;
    }

    .ctx-menu-separator {
      height: 1px;
      background: #3c3c3c;
      margin: 4px 0;
    }
  `],
})
export class FilingResultsGridComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly stringsService = inject(StringsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rowData = input.required<Filing[]>();
  readonly initialColumnState = input<ColumnState[] | null>(null);

  private gridApi!: GridApi;
  private readonly saveState$ = new Subject<void>();

  showColumnPanel = signal(false);
  columnList = signal<ColumnInfo[]>([]);
  headerContextMenu = signal<{ x: number; y: number; colId: string; headerName: string } | null>(null);

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button !== 1) return; // only middle click
    const row = (event.target as HTMLElement).closest('.ag-row');
    if (!row) return;
    // Prevent browser auto-scroll and AG Grid's middle-click handling
    event.preventDefault();
    const rowIndex = row.getAttribute('row-index');
    if (rowIndex == null) return;
    const rowNode = this.gridApi?.getDisplayedRowAtIndex(Number(rowIndex));
    const filing = rowNode?.data as Filing | undefined;
    if (filing?.accessionNumber) {
      window.open(`/filings/document/${filing.accessionNumber}/1`, '_blank');
    }
  }

  @HostListener('contextmenu', ['$event'])
  onHostContextMenu(event: MouseEvent): void {
    const headerCell = (event.target as HTMLElement).closest('.ag-header-cell');
    if (headerCell) {
      event.preventDefault();
      const colId = headerCell.getAttribute('col-id');
      if (colId) {
        const colDef = this.baseColumnDefs.find((cd) => cd.field === colId);
        this.headerContextMenu.set({
          x: event.clientX,
          y: event.clientY,
          colId,
          headerName: (colDef?.headerName as string) || colId,
        });
      }
    }
  }

  /** AG Grid theme matching VS Code dark */
  theme = themeQuartz.withParams({
    backgroundColor: '#1e1e1e',
    foregroundColor: '#cccccc',
    borderColor: '#3c3c3c',
    headerBackgroundColor: '#252526',
    headerTextColor: '#858585',
    headerFontSize: 11,
    fontSize: 13,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    oddRowBackgroundColor: '#1e1e1e',
    rowHoverColor: '#2a2d2e',
    selectedRowBackgroundColor: '#37373d',
    chromeBackgroundColor: '#252526',
    accentColor: '#007acc',
    borderRadius: 0,
    wrapperBorderRadius: 0,
    spacing: 4,
    cellHorizontalPaddingScale: 0.8,
  });

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    minWidth: 80,
    suppressHeaderMenuButton: false,
  };

  /** Base column definitions — order/widths/visibility may be overridden by saved state */
  private readonly baseColumnDefs: ColDef<Filing>[] = [
    // --- Default visible columns (in order) ---
    {
      field: 'ticker',
      headerName: 'Ticker',
      width: 90,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return '';
        const span = document.createElement('span');
        span.textContent = params.value;
        span.style.color = '#4ec9b0';
        span.style.fontWeight = '500';
        return span;
      },
    },
    {
      field: 'formType',
      headerName: 'Form',
      width: 90,
      cellStyle: { color: '#61afef', fontWeight: '500' },
    },
    {
      field: 'companyConformedName',
      headerName: 'Company',
      width: 220,
      flex: 1,
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 180,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value?.length) return '';
        const container = document.createElement('div');
        container.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow:hidden;';
        for (const tag of params.value) {
          const color = tagColor(tag);
          const item = document.createElement('span');
          item.style.cssText = `display:inline-flex;align-items:center;gap:3px;white-space:nowrap;color:${color};font-size:12px;`;
          // Tiny tag icon (SVG)
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('width', '10');
          svg.setAttribute('height', '10');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', color);
          svg.setAttribute('stroke-width', '2.5');
          svg.setAttribute('stroke-linecap', 'round');
          svg.setAttribute('stroke-linejoin', 'round');
          svg.style.cssText = 'flex-shrink:0;';
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z');
          svg.appendChild(path);
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '7.5');
          circle.setAttribute('cy', '7.5');
          circle.setAttribute('r', '1');
          svg.appendChild(circle);
          item.appendChild(svg);
          item.appendChild(document.createTextNode(tag));
          container.appendChild(item);
        }
        return container;
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 260,
      flex: 1,
    },
    {
      field: 'dateFiled',
      headerName: 'Date Filed',
      width: 120,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? new Date(params.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 100,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) return '';
        const kb = params.value / 1024;
        if (kb < 1024) return `${kb.toFixed(0)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
      },
    },
    // --- Hidden by default ---
    {
      field: 'datePublished',
      headerName: 'Date Published',
      width: 130,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? new Date(params.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
    },
    {
      field: 'accessionNumber',
      headerName: 'Accession #',
      width: 200,
      hide: true,
      cellStyle: { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '12px' },
    },
    {
      field: 'centralIndexKey',
      headerName: 'CIK',
      width: 100,
      hide: true,
    },
    {
      field: 'relationship',
      headerName: 'Relationship',
      width: 130,
      hide: true,
    },
    {
      field: 'documentCount',
      headerName: 'Docs',
      width: 80,
      hide: true,
    },
    {
      field: 'fileNumber',
      headerName: 'File #',
      width: 120,
      hide: true,
    },
    {
      field: 'filmNumber',
      headerName: 'Film #',
      width: 120,
      hide: true,
    },
    {
      field: 'isAmendment',
      headerName: 'Amendment',
      width: 110,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'isAmended',
      headerName: 'Amended',
      width: 100,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'amendedAccessionNumber',
      headerName: 'Amended Accession #',
      width: 200,
      hide: true,
    },
    {
      field: 'amendmentAccessionNumber',
      headerName: 'Amendment Accession #',
      width: 200,
      hide: true,
    },
    {
      field: 'sponsorCIK',
      headerName: 'Sponsor CIK',
      width: 120,
      hide: true,
    },
    {
      field: 'fileName',
      headerName: 'File Name',
      width: 180,
      hide: true,
    },
    {
      field: 'snowflakeId',
      headerName: 'Snowflake ID',
      width: 160,
      hide: true,
    },
    {
      field: 'noDocument',
      headerName: 'No Document',
      width: 120,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'isEmpty',
      headerName: 'Empty',
      width: 90,
      hide: true,
      valueFormatter: (params: ValueFormatterParams) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      hide: true,
    },
  ];

  /**
   * Computed column defs that bake saved state (order, width, pinned, hide)
   * directly into the definitions so the grid's very first frame is correct.
   */
  columnDefs = computed<ColDef<Filing>[]>(() => {
    const saved = this.initialColumnState();
    if (!saved?.length) return this.baseColumnDefs;

    const defsByField = new Map<string, ColDef<Filing>>(
      this.baseColumnDefs.filter((d) => d.field).map((d) => [d.field as string, d])
    );
    const result: ColDef<Filing>[] = [];

    // Walk saved state in order — this determines column order
    for (const cs of saved) {
      const base = defsByField.get(cs.colId);
      if (!base) continue;
      defsByField.delete(cs.colId);

      const merged: ColDef<Filing> = { ...base };

      // Apply saved width (and drop flex so it doesn't override)
      if (cs.width != null) {
        merged.width = cs.width;
        delete merged.flex;
      }
      if (cs.hide != null) merged.hide = cs.hide;
      if (cs.pinned != null) merged.pinned = cs.pinned as 'left' | 'right';
      if (cs.sort) merged.sort = cs.sort as 'asc' | 'desc';
      if (cs.sortIndex != null) merged.sortIndex = cs.sortIndex;

      result.push(merged);
    }

    // Append any new columns not in saved state (e.g. added after user last saved)
    for (const remaining of defsByField.values()) {
      result.push(remaining);
    }

    return result;
  });

  ngOnInit(): void {
    // Debounce state saves to avoid excessive API calls
    this.saveState$
      .pipe(
        debounceTime(500),
        switchMap(() => {
          if (!this.gridApi) return of(null);
          const state = this.gridApi.getColumnState();
          return this.stringsService.setJson(GRID_STATE_KEY, state).pipe(
            catchError(() => of(null))
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.updateColumnList();
  }

  onRowClicked(event: { data?: Filing }): void {
    if (event.data?.accessionNumber) {
      this.router.navigate(['/filings/document', event.data.accessionNumber, 1]);
    }
  }

  onColumnStateChanged(): void {
    this.saveState$.next();
    this.updateColumnList();
  }

  toggleColumnPanel(event: Event): void {
    event.stopPropagation();
    if (!this.showColumnPanel()) {
      this.updateColumnList();
    }
    this.showColumnPanel.update((v) => !v);
  }

  toggleColumnVisibility(colId: string): void {
    if (!this.gridApi) return;
    const col = this.gridApi.getColumn(colId);
    if (col) {
      this.gridApi.setColumnsVisible([colId], !col.isVisible());
      this.onColumnStateChanged();
    }
  }

  showAllColumns(): void {
    if (!this.gridApi) return;
    const allColIds = this.baseColumnDefs.map((c) => c.field!).filter(Boolean);
    this.gridApi.setColumnsVisible(allColIds, true);
    this.onColumnStateChanged();
  }

  closeContextMenu(): void {
    this.headerContextMenu.set(null);
  }

  contextPinColumn(direction: 'left' | 'right' | null): void {
    const ctx = this.headerContextMenu();
    if (!ctx || !this.gridApi) return;
    this.gridApi.setColumnsPinned([ctx.colId], direction);
    this.onColumnStateChanged();
    this.closeContextMenu();
  }

  contextAutosizeColumn(): void {
    const ctx = this.headerContextMenu();
    if (!ctx || !this.gridApi) return;
    this.gridApi.autoSizeColumns([ctx.colId]);
    this.onColumnStateChanged();
    this.closeContextMenu();
  }

  contextHideColumn(): void {
    const ctx = this.headerContextMenu();
    if (!ctx || !this.gridApi) return;
    this.gridApi.setColumnsVisible([ctx.colId], false);
    this.onColumnStateChanged();
    this.closeContextMenu();
  }

  resetColumns(): void {
    if (!this.gridApi) return;
    this.gridApi.resetColumnState();
    this.onColumnStateChanged();
    // Also clear persisted state
    this.stringsService.set(GRID_STATE_KEY, '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private updateColumnList(): void {
    if (!this.gridApi) return;
    const state = this.gridApi.getColumnState();
    const list: ColumnInfo[] = state.map((cs) => {
      const colDef = this.baseColumnDefs.find((cd) => cd.field === cs.colId);
      return {
        colId: cs.colId,
        headerName: (colDef?.headerName as string) || cs.colId,
        hide: cs.hide ?? false,
      };
    });
    this.columnList.set(list);
  }
}
